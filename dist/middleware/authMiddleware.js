"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtSecret_1 = require("../config/jwtSecret");
function authMiddleware(request, response, next) {
    let authHeader = request.headers.authorization || request.headers['Authorization'] || request.headers['x-access-token'];
    if (Array.isArray(authHeader)) {
        authHeader = authHeader[0];
    }
    console.log('authHeader:', authHeader);
    if (!authHeader) {
        return response.status(401).json({ message: "Token não fornecido" });
    }
    const [_, token] = authHeader?.split(" ");
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret_1.JWT_SECRET);
        request.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        console.log('Authenticated user:', request.user);
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        return response.status(401).json({ message: "Token inválido ou expirado" });
    }
}
