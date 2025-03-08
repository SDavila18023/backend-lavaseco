import express from 'express';
import { createEmployee, deleteEmployee, getEmployee, updateEmployee } from '../controllers/employeeController.js';

const employee = express.Router();

employee.get("/cost/employee",getEmployee);
employee.post("/cost/employee",createEmployee);
employee.put("/cost/employee/:id",updateEmployee);
employee.delete("/cost/employee/:id",deleteEmployee);

export default employee;