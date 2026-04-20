"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const TasktypeEnum = zod_1.z.enum(["TRABALHO", "PROVA", "REUNIAO", "APRESENTACAO"]);
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: "Título precisa no mínimo 3 caracteres" }),
    completed: zod_1.z.boolean().optional(),
    dueDate: zod_1.z.string().regex(dataRegex, { message: "Formato da data deve ser YYYY-MM-DD" }),
    type: TasktypeEnum,
    icon: zod_1.z.string().min(1, { message: "O ícone da tarefa é obrigatório" }),
    notes: zod_1.z.string().optional().nullable(),
    hasReminder: zod_1.z.boolean().optional(),
    reminderTime: zod_1.z.string().optional().nullable(),
});
// export const updateTaskSchema = z.object({
//     title: z.string().min(3, {message: "Título precisa no mínimo 3 caracteres"}).optional(),
//     completed: z.boolean().optional()
// })
exports.updateTaskSchema = exports.createTaskSchema.partial();
exports.idSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: "Id inválido, precisa ser um UUID" })
});
