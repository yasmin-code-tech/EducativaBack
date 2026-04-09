const DEV_FALLBACK = "emanuelTesteSecreta"

function resolveJwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim()
    if (secret) {
        return secret
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("Defina JWT_SECRET no ambiente antes de iniciar o servidor.")
    }
    console.warn("[auth] JWT_SECRET não definido; usando segredo apenas para desenvolvimento.")
    return DEV_FALLBACK
}

export const JWT_SECRET = resolveJwtSecret()
