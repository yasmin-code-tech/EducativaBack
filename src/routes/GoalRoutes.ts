import { Router } from 'express'
import { GoalController } from '../controller/GoalController'
import { authMiddleware } from '../middleware/authMiddleware'

const goalRouter = Router()
const goalController = new GoalController()

goalRouter.get('/', authMiddleware, goalController.list)
goalRouter.post('/', authMiddleware, goalController.create)
goalRouter.get('/history', authMiddleware, goalController.history)
goalRouter.get('/metrics', authMiddleware, goalController.metrics)
goalRouter.get('/:id', authMiddleware, goalController.find)
goalRouter.put('/:id', authMiddleware, goalController.update)
goalRouter.patch('/:id/progress', authMiddleware, goalController.progress)
goalRouter.patch('/:id/complete', authMiddleware, goalController.complete)
goalRouter.delete('/:id', authMiddleware, goalController.delete)

export { goalRouter }
