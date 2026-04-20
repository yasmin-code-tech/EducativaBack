"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const PrismaConfig_1 = require("../config/PrismaConfig");
const AppError_1 = require("../errors/AppError");
const roles_1 = require("../types/roles");
const userSchemas_1 = require("../schemas/userSchemas");
class UserController {
    async create(request, response) {
        const bodySchema = zod_1.z.object({
            name: zod_1.z.string(),
            email: zod_1.z.email({ message: "Digite um e-mail correto" }),
            password: zod_1.z.string(),
        });
        const { name, email, password } = bodySchema.parse(request.body);
        const userExists = await PrismaConfig_1.prisma.user.findUnique({ where: { email } });
        if (userExists) {
            throw new AppError_1.AppError("Usuário já existe", 409);
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await PrismaConfig_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            }
        });
        return response.status(201).json(newUser);
    }
    async profile(request, response, next) {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError("Usuário não autenticado", 401);
            }
            const user = await PrismaConfig_1.prisma.user.findUnique({ where: { id: userId }, select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    xp: true
                } });
            if (!user) {
                throw new AppError_1.AppError("Usuário não encontrado", 404);
            }
            const xp = user.xp ?? 0;
            const xpToNextLevel = 100;
            const xpProgress = xp % xpToNextLevel;
            const level = Math.floor(xp / xpToNextLevel) + 1;
            return response.status(200).json({
                message: "Perfil do usuário",
                user: {
                    ...user,
                    level,
                    xpProgress,
                    xpToNextLevel,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(request, response, next) {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AppError_1.AppError("Usuário não autenticado", 401);
            }
            const data = userSchemas_1.updateProfileSchema.parse(request.body);
            const existing = await PrismaConfig_1.prisma.user.findUnique({ where: { id: userId } });
            if (!existing) {
                throw new AppError_1.AppError("Usuário não encontrado", 404);
            }
            if (data.email !== undefined && data.email !== existing.email) {
                const emailTaken = await PrismaConfig_1.prisma.user.findUnique({ where: { email: data.email } });
                if (emailTaken) {
                    throw new AppError_1.AppError("E-mail já está em uso", 409);
                }
            }
            const updated = await PrismaConfig_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.email !== undefined ? { email: data.email } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            return response.status(200).json({ message: "Perfil atualizado", user: updated });
        }
        catch (error) {
            next(error);
        }
    }
    async updateRole(request, response, next) {
        try {
            const roleUser = request.user?.role;
            const { id } = request.params;
            if (!roleUser || roleUser != roles_1.UserRole.ADMIN) {
                throw new AppError_1.AppError("Permissão somente para administradores");
            }
            const user = await PrismaConfig_1.prisma.user.findUnique({ where: { id } });
            if (user?.role == roles_1.UserRole.USER) {
                await PrismaConfig_1.prisma.user.update({ where: { id }, data: { role: roles_1.UserRole.ADMIN } });
            }
            return response.status(200).json({ message: "Alteração feita com sucesso" });
        }
        catch (error) {
            next(error);
        }
    }
    async list(request, response) {
        const users = await PrismaConfig_1.prisma.user.findMany();
        return response.status(200).json(users);
    }
    async changePassword(request, response, next) {
        const userId = request.user?.id;
        if (!userId) {
            throw new AppError_1.AppError("Usuário não autenticado", 401);
        }
        try {
            const { currentPassword, newPassword, confirmNewPassword } = userSchemas_1.changePasswordSchema.parse(request.body);
            const user = await PrismaConfig_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new AppError_1.AppError("Usuário não encontrado", 401);
            }
            const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new AppError_1.AppError("A senha atual está incorreta", 401);
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            await PrismaConfig_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
            return response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
