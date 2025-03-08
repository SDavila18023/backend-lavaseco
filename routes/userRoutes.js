import express from 'express';
import { loginUser, registerUser } from '../controllers/userController.js';

const user = express.Router();

user.post("/user/register",registerUser);
user.post("/user/login",loginUser);

export default user;