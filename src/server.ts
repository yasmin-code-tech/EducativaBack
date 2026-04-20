import "dotenv/config"
import express from "express"
import cors from "cors"
import { routes } from "./routes"
import { errorHandler } from "./middleware/errorHandler"

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3333
const HOST = process.env.HOST || '0.0.0.0'

app.use(routes)
app.use(errorHandler)

app.listen(PORT, HOST, ()=>{
    console.log(`Rodando na porta ${PORT} em ${HOST}`)
})