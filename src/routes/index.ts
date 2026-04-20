import { Router } from "express";
import { taskRouter } from "./TaskRoutes";
import { goalRouter } from "./GoalRoutes";
import { userRouter } from "./UserRoutes";
import { authRouter } from "./AuthRoutes";
import { adminRouter } from "./AdminRoutes";
import { GoalController } from '../controller/GoalController'
import { authMiddleware } from '../middleware/authMiddleware'

const routes = Router()
const goalController = new GoalController()

routes.use("/task", taskRouter)
routes.use("/goals", goalRouter)
routes.get('/metrics', authMiddleware, goalController.metrics)
routes.use("/user", userRouter)
routes.use("/auth", authRouter)
routes.use('/admin', adminRouter)

export {routes}