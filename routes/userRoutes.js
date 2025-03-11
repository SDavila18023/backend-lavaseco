import express from 'express';
import { deleteUser, fetchUsers, loginUser, registerUser } from '../controllers/userController.js';

const user = express.Router();

user.get("/user/",fetchUsers);
user.post("/user/register",registerUser);
user.post("/user/login",loginUser);
user.delete("/user/:id",deleteUser);

export default user;