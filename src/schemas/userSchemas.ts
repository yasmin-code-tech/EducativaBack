import {z} from 'zod'

export const updateProfileSchema = z
    .object({
        name: z.string().min(1, {message: "Nome não pode ser vazio"}).optional(),
        email: z.email({message: "Digite um e-mail correto"}).optional(),
        phone: z.string().optional(),
        course: z.string().optional(),
        photo: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Informe ao menos um campo para atualizar",
    })

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, {message: "A nova senha deve ter no mínimo 6 caracteres"}),
    confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {message: "A nova senha e a confirmação devem ser iguais."})