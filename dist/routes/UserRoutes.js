"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const UserController_1 = require("../controller/UserController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const validateTaskId_1 = require("../middleware/validateTaskId");
const userRouter = (0, express_1.Router)();
exports.userRouter = userRouter;
const userController = new UserController_1.UserController();
userRouter.post('/', userController.create);
userRouter.get('/profile', authMiddleware_1.authMiddleware, userController.profile);
//userRouter.patch('/profile', authMiddleware, userController.updateProfile) 
userRouter.patch('/change-password', authMiddleware_1.authMiddleware, userController.changePassword);
userRouter.get('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, userController.list);
userRouter.patch('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, validateTaskId_1.validateTaskId, userController.updateRole);
