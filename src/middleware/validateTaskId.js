"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTaskId = validateTaskId;
const taskSchemas_1 = require("../schemas/taskSchemas");
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
function validateTaskId(request, response, next) {
    try {
        taskSchemas_1.idSchema.parse(request.params);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new AppError_1.AppError(error.issues[0].message, 400);
        }
        throw new AppError_1.AppError("Erro inesperado na validação do ID", 500);
    }
}
