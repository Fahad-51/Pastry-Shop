import express from "express";

import userAuth from '../middleware/userAuth.js'

import { getUserData, changePassword } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);
userRouter.post('/change-password', userAuth, changePassword);

export default userRouter;