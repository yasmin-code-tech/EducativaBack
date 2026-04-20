"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importStar(require("bcrypt"));
const PrismaConfig_1 = require("../config/PrismaConfig");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authSchemas_1 = require("../schemas/authSchemas");
const crypto_1 = require("crypto");
const AppError_1 = require("../errors/AppError");
const jwtSecret_1 = require("../config/jwtSecret");
class AuthController {
    async login(request, response) {
        const { email, password } = authSchemas_1.loginSchema.parse(request.body);
        const user = await PrismaConfig_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return response.status(400).json("Usuário não encontrado");
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return response.status(400).json("Senha incorreta");
        }
        const { password: _, ...userWithoutPassword } = user;
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret_1.JWT_SECRET, { expiresIn: "1d" });
        return response.json({ token: token, user: userWithoutPassword });
    }
    async resetPassword(request, response) {
        const { email } = authSchemas_1.resetPasswordSchema.parse(request.body);
        try {
            const user = await PrismaConfig_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                return response.status(200).json({ message: "Se o email estiver cadastrado, o processo foi iniciado. " });
            }
            const token = (0, crypto_1.randomUUID)();
            const expirationTime = new Date();
            expirationTime.setHours(expirationTime.getHours() + 1);
            await PrismaConfig_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: token,
                    resetTokenExpiresAt: expirationTime
                }
            });
            return response.status(200).json({
                message: "Se o email estiver cadastrado, o processo foi iniciado.",
            });
        }
        catch (error) {
            throw new AppError_1.AppError("Erro interno ao solicitar redefinição de senha.");
        }
    }
    async resetPasswordConfirm(request, response) {
        try {
            const { token, newPassword } = authSchemas_1.resetPasswordConfirmSchema.parse(request.body);
            const user = await PrismaConfig_1.prisma.user.findUnique({
                where: {
                    resetToken: token,
                    resetTokenExpiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!user) {
                throw new AppError_1.AppError("Token de redefinição inválido ou expirado", 400);
            }
            const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 10);
            await PrismaConfig_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiresAt: null
                },
            });
            return response.status(200).json({ message: "Senha redefinida com sucesso. Você pode fazer login agora" });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                return response.status(error.status).json({ message: error.message });
            }
            console.log(error);
            return response.status(500).json({ message: "Erro interno ao redefinir a senha" });
        }
    }
    async logout(request, response) {
        return response.status(204).send();
    }
}
exports.AuthController = AuthController;
