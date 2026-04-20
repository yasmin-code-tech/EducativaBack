import { z } from 'zod'

export const createGoalSchema = z.object({
  title: z.string().min(3, { message: 'O título da meta precisa ter no mínimo 3 caracteres' }),
  totalSessions: z.preprocess(
    (value) => {
      if (typeof value === 'string') return Number(value)
      return value
    },
    z.number().int().min(1, { message: 'A meta precisa ter pelo menos 1 sessão' }).default(1)
  ),
  priority: z.preprocess(
    (value) => (typeof value === 'string' ? value : 'media'),
    z.enum(['alta', 'media', 'baixa']).default('media')
  ),
})

export const updateGoalSchema = z.object({
  title: z.string().min(3, { message: 'O título da meta precisa ter no mínimo 3 caracteres' }).optional(),
  totalSessions: z.number().int().min(1, { message: 'A meta precisa ter pelo menos 1 sessão' }).optional(),
  completedSessions: z.number().int().min(0).optional(),
  totalTime: z.number().int().min(0).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  priority: z.enum(['alta', 'media', 'baixa']).optional(),
  completed: z.boolean().optional(),
})

export const progressGoalSchema = z.object({
  duration: z.number().int().min(1, { message: 'A duração deve ser um número positivo' }),
})

export const idSchema = z.object({
  id: z.string().uuid({ message: 'Id inválido, precisa ser um UUID' }),
})
