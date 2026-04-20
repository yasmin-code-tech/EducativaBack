"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const fs_1 = __importDefault(require("fs"));
const PrismaConfig_1 = require("../config/PrismaConfig");
const AppError_1 = require("../errors/AppError");
const goalSchemas_1 = require("../schemas/goalSchemas");
const zod_1 = require("zod");
class GoalController {
    async list(request, response, next) {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const goals = await PrismaConfig_1.prisma.goal.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            return response.status(200).json({ message: 'Lista de metas', goals });
        }
        catch (error) {
            next(error);
        }
    }
    async create(request, response, next) {
        try {
            const debugInfo = {
                path: request.path,
                body: request.body,
                user: request.user,
            };
            await fs_1.default.promises.appendFile('/tmp/goal-create-debug.log', `\n[${new Date().toISOString()}] create debug: ${JSON.stringify(debugInfo)}\n`);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const goalRequest = {
                title: request.body.title ?? request.body.text,
                totalSessions: request.body.totalSessions !== undefined ? Number(request.body.totalSessions) : 1,
                priority: request.body.priority ?? 'media',
            };
            const goalData = goalSchemas_1.createGoalSchema.parse(goalRequest);
            const newGoal = await PrismaConfig_1.prisma.goal.create({
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
            });
            return response.status(201).json({ message: 'Meta criada com sucesso', newGoal });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues });
            }
            next(error);
        }
    }
    async find(request, response, next) {
        try {
            const { id } = goalSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const goal = await PrismaConfig_1.prisma.goal.findFirst({ where: { id, userId } });
            if (!goal) {
                throw new AppError_1.AppError('Meta não encontrada ou não pertence a este usuário', 404);
            }
            return response.status(200).json({ message: 'Meta encontrada', goal });
        }
        catch (error) {
            next(error);
        }
    }
    async update(request, response, next) {
        try {
            const { id } = goalSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const validatedData = goalSchemas_1.updateGoalSchema.parse(request.body);
            if (Object.keys(validatedData).length === 0) {
                throw new AppError_1.AppError('Nenhum dado válido fornecido para atualização', 400);
            }
            const updatedGoal = await PrismaConfig_1.prisma.goal.updateMany({
                where: { id, userId },
                data: validatedData,
            });
            if (updatedGoal.count === 0) {
                throw new AppError_1.AppError('Meta não encontrada ou não pertence a este usuário', 404);
            }
            const goal = await PrismaConfig_1.prisma.goal.findFirst({ where: { id, userId } });
            return response.status(200).json({ message: 'Meta atualizada com sucesso', goal });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues });
            }
            next(error);
        }
    }
    async delete(request, response, next) {
        try {
            const { id } = goalSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const goal = await PrismaConfig_1.prisma.goal.findUnique({ where: { id } });
            if (!goal || goal.userId !== userId) {
                throw new AppError_1.AppError('Meta não encontrada ou não pertence a este usuário', 404);
            }
            await PrismaConfig_1.prisma.goal.delete({ where: { id } });
            return response.status(204).json({ message: 'Meta deletada com sucesso' });
        }
        catch (error) {
            next(error);
        }
    }
    async complete(request, response, next) {
        try {
            const { id } = goalSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const goal = await PrismaConfig_1.prisma.goal.findUnique({ where: { id } });
            if (!goal || goal.userId !== userId) {
                throw new AppError_1.AppError('Meta não encontrada ou não pertence a este usuário', 404);
            }
            if (goal.completed) {
                throw new AppError_1.AppError('Meta já está concluída', 400);
            }
            const [completedGoal, updatedUser] = await PrismaConfig_1.prisma.$transaction([
                PrismaConfig_1.prisma.goal.update({
                    where: { id },
                    data: { completed: true, completedAt: new Date(), status: 'completed' },
                }),
                PrismaConfig_1.prisma.user.update({
                    where: { id: userId },
                    data: { xp: { increment: 10 } },
                }),
            ]);
            return response.status(200).json({ xp: updatedUser.xp, completedGoal });
        }
        catch (error) {
            next(error);
        }
    }
    async progress(request, response, next) {
        try {
            const { id } = goalSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const { duration } = goalSchemas_1.progressGoalSchema.parse(request.body);
            const goal = await PrismaConfig_1.prisma.goal.findUnique({ where: { id } });
            if (!goal || goal.userId !== userId) {
                throw new AppError_1.AppError('Meta não encontrada ou não pertence a este usuário', 404);
            }
            if (goal.completed) {
                throw new AppError_1.AppError('Meta já está concluída', 400);
            }
            const nextCompletedSessions = goal.completedSessions + 1;
            const isCompleted = nextCompletedSessions >= goal.totalSessions;
            const updatedGoal = await PrismaConfig_1.prisma.goal.update({
                where: { id },
                data: {
                    completedSessions: { increment: 1 },
                    totalTime: { increment: duration },
                    completed: isCompleted,
                    status: isCompleted ? 'completed' : 'in-progress',
                    ...(isCompleted ? { completedAt: new Date() } : {}),
                },
            });
            return response.status(200).json({ message: 'Progresso atualizado', goal: updatedGoal });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return response.status(400).json({ message: 'Dados inválidos na requisição', errors: error.issues });
            }
            next(error);
        }
    }
    async history(request, response, next) {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const history = await PrismaConfig_1.prisma.goal.findMany({
                where: { userId, completed: true },
                orderBy: { completedAt: 'desc' },
                select: { id: true, title: true, text: true, completedAt: true },
            });
            return response.status(200).json(history);
        }
        catch (error) {
            next(error);
        }
    }
    async metrics(request, response, next) {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Usuário não autenticado', 401);
            }
            const now = new Date();
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const streakWindowStart = new Date(now);
            streakWindowStart.setDate(now.getDate() - 30);
            streakWindowStart.setHours(0, 0, 0, 0);
            const [weekGoals, monthGoals, yearGoals, completedTasks, goalDates, taskDates, user] = await Promise.all([
                PrismaConfig_1.prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: sevenDaysAgo } } }),
                PrismaConfig_1.prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: startOfMonth } } }),
                PrismaConfig_1.prisma.goal.count({ where: { userId, completed: true, completedAt: { gte: startOfYear } } }),
                PrismaConfig_1.prisma.task.count({ where: { userId, completed: true } }),
                PrismaConfig_1.prisma.goal.findMany({ where: { userId, completed: true, completedAt: { gte: streakWindowStart } }, select: { completedAt: true } }),
                PrismaConfig_1.prisma.task.findMany({ where: { userId, completed: true, createdAt: { gte: streakWindowStart } }, select: { createdAt: true } }),
                PrismaConfig_1.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
            ]);
            const activeDateKeys = new Set();
            goalDates.forEach((goal) => {
                if (goal.completedAt) {
                    const day = new Date(goal.completedAt);
                    day.setHours(0, 0, 0, 0);
                    activeDateKeys.add(day.toISOString().slice(0, 10));
                }
            });
            taskDates.forEach((task) => {
                const day = new Date(task.createdAt);
                day.setHours(0, 0, 0, 0);
                activeDateKeys.add(day.toISOString().slice(0, 10));
            });
            const countConsecutiveDays = () => {
                let streak = 0;
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                while (activeDateKeys.has(today.toISOString().slice(0, 10))) {
                    streak += 1;
                    today.setDate(today.getDate() - 1);
                }
                return streak;
            };
            const xp = user?.xp ?? 0;
            const currentLevel = Math.floor(xp / 100) + 1;
            return response.status(200).json({
                weekGoals,
                monthGoals,
                yearGoals,
                completedTasks: completedTasks + (await PrismaConfig_1.prisma.goal.count({ where: { userId, completed: true } })),
                streakDays: countConsecutiveDays(),
                currentLevel,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GoalController = GoalController;
