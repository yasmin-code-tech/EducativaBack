"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../errors/AppError");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
function errorHandler(error, request, response, next) {
    try {
        const logMessage = `\n[${new Date().toISOString()}] Unhandled error: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
        fs_1.default.appendFileSync('/tmp/goal-error.log', logMessage);
    }
    catch (fileError) {
        console.error('Failed to write error log:', fileError);
    }
    console.error('Unhandled error:', error);
    if (error?.stack) {
        console.error(error.stack);
    }
    if (error instanceof AppError_1.AppError) {
        return response.status(error.status).json({ message: error.message });
    }
    if (error instanceof zod_1.ZodError) {
        return response.status(400).json(error.issues[0].message);
    }
    return response.status(500).json({ message: "Erro interno do servidor" });
}
