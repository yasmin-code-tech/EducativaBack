"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, { message: "Nome não pode ser vazio" }).optional(),
    email: zod_1.z.email({ message: "Digite um e-mail correto" }).optional(),
})
    .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: "Informe ao menos nome ou e-mail para atualizar",
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(6, { message: "A nova senha deve ter no mínimo 6 caracteres" }),
    confirmNewPassword: zod_1.z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, { message: "A nova senha e a confirmação devem ser iguais." });
