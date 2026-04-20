import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
import { UserRole } from "../types/roles"
import { JWT_SECRET } from "../config/jwtSecret"

interface JwtPayload {
    id: string
    email: string
    role?: UserRole
}

export function authMiddleware(request: Request, response: Response, next: NextFunction) {
    let authHeader = request.headers.authorization || request.headers['Authorization'] || request.headers['x-access-token']
    if (Array.isArray(authHeader)) {
        authHeader = authHeader[0]
    }

    console.log('authHeader:', authHeader)

    if (!authHeader) {
        return response.status(401).json({ message: "Token não fornecido" })
    }

    const [_, token] = authHeader?.split(" ")

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

        request.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        }

        console.log('Authenticated user:', request.user)
        next()
    } catch (error) {
        console.error('Token verification error:', error)
        return response.status(401).json({ message: "Token inválido ou expirado" })
    }

}