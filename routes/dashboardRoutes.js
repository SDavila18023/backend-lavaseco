import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

const dashboard = express.Router();

dashboard.get("/dashboard-data",getDashboard);

export default dashboard;