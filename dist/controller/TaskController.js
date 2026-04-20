"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const PrismaConfig_1 = require("../config/PrismaConfig");
const AppError_1 = require("../errors/AppError");
const taskSchemas_1 = require("../schemas/taskSchemas");
const zod_1 = require("zod");
const typeColorMap = {
    TRABALHO: "#f97316",
    PROVA: "#ef4444",
    REUNIAO: "#3b82f6",
    APRESENTACAO: "#1e3a8a"
};
class TaskController {
    async list(request, response) {
        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = request.user?.id;
        if (!userId) {
            return response.status(401).json({ message: "Usuário não autenticado" });
        }
        const tasks = await PrismaConfig_1.prisma.task.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: "asc" }
        });
        const total = await PrismaConfig_1.prisma.task.count({ where: { userId } });
        const totalPages = Math.ceil(total / limit);
        return response.status(200).json({ message: "Lista paginada de tasks", page, totalPages, total, tasks, user: request.user });
    }
    async create(request, response, next) {
        const userId = request.user?.id;
        if (!userId) {
            throw new AppError_1.AppError("Usuário não autenticado ou token inválido", 401);
        }
        try {
            const taskData = taskSchemas_1.createTaskSchema.parse(request.body);
            const newTask = await PrismaConfig_1.prisma.task.create({
                data: {
                    ...taskData,
                    color: typeColorMap[taskData.type],
                    dueDate: new Date(taskData.dueDate),
                    userId: userId,
                }
            });
            return response.status(201).json({ message: "Tarefa criada com sucesso", newTask });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return response.status(400).json({
                    message: "Dados inválidos na requisição"
                });
            }
            next(error);
        }
    }
    async find(request, response, next) {
        try {
            const { id } = taskSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            const task = await PrismaConfig_1.prisma.task.findUnique({ where: { id, userId: userId } });
            if (!task) {
                throw new AppError_1.AppError("Task não encontrada ou não pertence a este usuário", 404);
            }
            return response.status(200).json({ message: "Sua task", task });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTask(request, response, next) {
        try {
            const { id } = taskSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            const task = await PrismaConfig_1.prisma.task.findUnique({ where: { id } });
            if (!task || task.userId != userId) {
                throw new AppError_1.AppError("Task não encontrada ou não pertence a este usuário", 404);
            }
            const taskForDelete = await PrismaConfig_1.prisma.task.delete({ where: { id } });
            return response.status(200).json({ message: "Task deletada com sucesso", task: taskForDelete });
        }
        catch (error) {
            next(error);
        }
    }
    async update(request, response, next) {
        try {
            delete request.body.color;
            const { id } = taskSchemas_1.idSchema.parse(request.params);
            const userId = request.user?.id;
            const validateData = taskSchemas_1.updateTaskSchema.parse(request.body);
            if (Object.keys(validateData).length === 0) {
                throw new AppError_1.AppError("Nenhum dado válido fornecido para atualização", 400);
            }
            if (validateData.type) {
                validateData.color = typeColorMap[validateData.type];
            }
            const taskForUpdate = await PrismaConfig_1.prisma.task.update({
                where: {
                    id,
                    userId: userId
                },
                data: validateData
            });
            return response.status(200).json({ message: "Task atualizada com sucesso", taskForUpdate });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return response.status(400).json({
                    message: "Dados inválidos na requisição",
                    errors: error.issues[0]
                });
            }
            next(error);
        }
    }
}
exports.TaskController = TaskController;
