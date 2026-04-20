import "dotenv/config"
import express from "express"
import cors from "cors"
import { routes } from "./routes"
import { errorHandler } from "./middleware/errorHandler"

const app = express()
app.use(cors())
app.use(express.json())

const PORT = Number(process.env.PORT) || 3333;

app.use(routes)
app.use(errorHandler)

app.listen(PORT,'0.0.0.0', ()=>{
    console.log(`Rodando na porta ${PORT}`)
})