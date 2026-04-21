import fs from 'fs'
import { prisma } from '../config/PrismaConfig'
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { createGoalSchema, idSchema, progressGoalSchema, updateGoalSchema } from '../schemas/goalSchemas'
import { ZodError } from 'zod'

export class GoalController {
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const goals = await prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      return response.status(200).json({ message: 'Lista de metas', goals })
    } catch (error) {
      next(error)
    }
  }

  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const debugInfo = {
        path: request.path,
        body: request.body,
        user: request.user,
      }
      await fs.promises.appendFile('/tmp/goal-create-debug.log', `\n[${new Date().toISOString()}] create debug: ${JSON.stringify(debugInfo)}\n`)

      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const goalRequest = {
        title: request.body.title ?? request.body.text,
        totalSessions: request.body.totalSessions !== undefined ? Number(request.body.totalSessions) : 1,
        priority: request.body.priority ?? 'media',
      }

      const goalData = createGoalSchema.parse(goalRequest)

      const newGoal = await prisma.goal.create({
        data: {
          title: goalData.title,
          text: goalData.title,
          priority: goalData.priority,
          totalSessions: goalData.totalSessions,
          completedSessions: 0,
          totalTime: 0,
          status: 'pending',
          completed: false,
          userId,
        },
      })

      return response.status(201).json({ message: 'Meta criada com sucesso', newGoal })
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues })
      }
      next(error)
    }
  }

  async find(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = idSchema.parse(request.params)
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const goal = await prisma.goal.findFirst({ where: { id, userId } })
      if (!goal) {
        throw new AppError('Meta não encontrada ou não pertence a este usuário', 404)
      }

      return response.status(200).json({ message: 'Meta encontrada', goal })
    } catch (error) {
      next(error)
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = idSchema.parse(request.params)
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const validatedData = updateGoalSchema.parse(request.body)
      if (Object.keys(validatedData).length === 0) {
        throw new AppError('Nenhum dado válido fornecido para atualização', 400)
      }

      const updatedGoal = await prisma.goal.updateMany({
        where: { id, userId },
        data: validatedData,
      })

      if (updatedGoal.count === 0) {
        throw new AppError('Meta não encontrada ou não pertence a este usuário', 404)
      }

      const goal = await prisma.goal.findFirst({ where: { id, userId } })
      return response.status(200).json({ message: 'Meta atualizada com sucesso', goal })
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues })
      }
      next(error)
    }
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = idSchema.parse(request.params)
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const goal = await prisma.goal.findUnique({ where: { id } })
      if (!goal || goal.userId !== userId) {
        throw new AppError('Meta não encontrada ou não pertence a este usuário', 404)
      }

      await prisma.goal.delete({ where: { id } })
      return response.status(204).json({ message: 'Meta deletada com sucesso' })
    } catch (error) {
      next(error)
    }
  }

  async complete(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = idSchema.parse(request.params)
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const goal = await prisma.goal.findUnique({ where: { id } })
      if (!goal || goal.userId !== userId) {
        throw new AppError('Meta não encontrada ou não pertence a este usuário', 404)
      }

      if (goal.completed) {
        throw new AppError('Meta já está concluída', 400)
      }

      const [completedGoal, updatedUser] = await prisma.$transaction([
        prisma.goal.update({
          where: { id },
          data: { completed: true, completedAt: new Date(), status: 'completed' },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { xp: { increment: 10 } },
        }),
      ])

      return response.status(200).json({ xp: updatedUser.xp, completedGoal })
    } catch (error) {
      next(error)
    }
  }

  async progress(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = idSchema.parse(request.params)
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const { duration } = progressGoalSchema.parse(request.body)
      const goal = await prisma.goal.findUnique({ where: { id } })
      if (!goal || goal.userId !== userId) {
        throw new AppError('Meta não encontrada ou não pertence a este usuário', 404)
      }

      if (goal.completed) {
        throw new AppError('Meta já está concluída', 400)
      }

      const nextCompletedSessions = goal.completedSessions + 1
      const isCompleted = nextCompletedSessions >= goal.totalSessions

      let updatedGoal;

      if (isCompleted) {
        const [goalResult, userResult] = await prisma.$transaction([
          prisma.goal.update({
            where: { id },
            data: {
              completedSessions: { increment: 1 },
              totalTime: { increment: duration },
              completed: true,
              status: 'completed',
              completedAt: new Date(),
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: 10 } },
          }),
        ])
        updatedGoal = goalResult;
      } else {
        updatedGoal = await prisma.goal.update({
          where: { id },
          data: {
            completedSessions: { increment: 1 },
            totalTime: { increment: duration },
            completed: false,
            status: 'in-progress',
          },
        })
      }

      return response.status(200).json({ message: 'Progresso atualizado', goal: updatedGoal })
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues })
      }
      next(error)
    }
  }

  async history(request: Request, response: Response, next: NextFunction) {
    try {
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const history = await prisma.goal.findMany({
        where: { userId, completed: true },
        orderBy: { completedAt: 'desc' },
        select: { id: true, title: true, text: true, completedAt: true },
      })

      return response.status(200).json(history)
    } catch (error) {
      next(error)
    }
  }

  async metrics(request: Request, response: Response, next: NextFunction) {
    try {
      const userId = request.user?.id
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const streakWindowStart = new Date(now)
      streakWindowStart.setDate(now.getDate() - 30)
      streakWindowStart.setHours(0, 0, 0, 0)

      const [weekGoals, monthGoals, yearGoals, completedTasks, goalDates, taskDates, user] = await Promise.all([
        prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: sevenDaysAgo } } }),
        prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: startOfMonth } } }),
        prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: startOfYear } } }),
        prisma.task.count({ where: { userId, completed: true } }),
        prisma.goal.findMany({ where: { userId, completed: true, completedAt: { gte: streakWindowStart } }, select: { completedAt: true } }),
        prisma.task.findMany({ where: { userId, completed: true, createdAt: { gte: streakWindowStart } }, select: { createdAt: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
      ])

      const activeDateKeys = new Set<string>()

      goalDates.forEach((goal) => {
        if (goal.completedAt) {
          const day = new Date(goal.completedAt)
          day.setHours(0, 0, 0, 0)
          activeDateKeys.add(day.toISOString().slice(0, 10))
        }
      })

      taskDates.forEach((task) => {
        const day = new Date(task.createdAt)
        day.setHours(0, 0, 0, 0)
        activeDateKeys.add(day.toISOString().slice(0, 10))
      })

      const countConsecutiveDays = () => {
        let streak = 0
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)

        while (activeDateKeys.has(today.toISOString().slice(0, 10))) {
          streak += 1
          today.setDate(today.getDate() - 1)
        }

        return streak
      }

      const xp = user?.xp ?? 0
      const currentLevel = Math.floor(xp / 100) + 1

      return response.status(200).json({
        weekGoals,
        monthGoals,
        yearGoals,
        completedTasks: completedTasks + (await prisma.goal.count({ where: { userId, completed: true } })),
        streakDays: countConsecutiveDays(),
        currentLevel,
      })
    } catch (error) {
      next(error)
    }
  }
}
