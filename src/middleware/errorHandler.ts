import {Request, Response, NextFunction} from "express"
import { AppError } from "../errors/AppError"
import { ZodError } from "zod"
import fs from 'fs'

export function errorHandler(error: any, request: Request, response: Response, next: NextFunction) {
    try {
        const logMessage = `\n[${new Date().toISOString()}] Unhandled error: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`
        fs.appendFileSync('/tmp/goal-error.log', logMessage)
    } catch (fileError) {
        console.error('Failed to write error log:', fileError)
    }

    console.error('Unhandled error:', error)
    if (error?.stack) {
        console.error(error.stack)
    }

    if(error instanceof AppError) {
        return response.status(error.status).json({message: error.message})
    }

    if(error instanceof ZodError) {
        return response.status(400).json(error.issues[0].message)
    }

    
    return response.status(500).json({message: "Erro interno do servidor"})
}