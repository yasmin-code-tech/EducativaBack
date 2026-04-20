"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
const roles_1 = require("../types/roles");
function adminMiddleware(request, response, next) {
    if (!request.user) {
        return response.status(401).json({ message: "Usuário não autenticado" });
    }
    if (request.user.role !== roles_1.UserRole.ADMIN) {
        return response.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }
    next();
}
