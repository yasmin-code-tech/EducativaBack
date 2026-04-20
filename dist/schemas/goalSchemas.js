"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idSchema = exports.progressGoalSchema = exports.updateGoalSchema = exports.createGoalSchema = void 0;
const zod_1 = require("zod");
exports.createGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: 'O título da meta precisa ter no mínimo 3 caracteres' }),
    totalSessions: zod_1.z.preprocess((value) => {
        if (typeof value === 'string')
            return Number(value);
        return value;
    }, zod_1.z.number().int().min(1, { message: 'A meta precisa ter pelo menos 1 sessão' }).default(1)),
    priority: zod_1.z.preprocess((value) => (typeof value === 'string' ? value : 'media'), zod_1.z.enum(['alta', 'media', 'baixa']).default('media')),
});
exports.updateGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: 'O título da meta precisa ter no mínimo 3 caracteres' }).optional(),
    totalSessions: zod_1.z.number().int().min(1, { message: 'A meta precisa ter pelo menos 1 sessão' }).optional(),
    completedSessions: zod_1.z.number().int().min(0).optional(),
    totalTime: zod_1.z.number().int().min(0).optional(),
    status: zod_1.z.enum(['pending', 'in-progress', 'completed']).optional(),
    priority: zod_1.z.enum(['alta', 'media', 'baixa']).optional(),
    completed: zod_1.z.boolean().optional(),
});
exports.progressGoalSchema = zod_1.z.object({
    duration: zod_1.z.number().int().min(1, { message: 'A duração deve ser um número positivo' }),
});
exports.idSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Id inválido, precisa ser um UUID' }),
});
