"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordConfirmSchema = exports.resetPasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.resetPasswordConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().uuid({ message: "Token de redefinição inválido" }),
    newPassword: zod_1.z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres" }),
    confirmNewPassword: zod_1.z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem"
});
