import express from 'express';
import { createSpecificCost, deleteSpecificCost, getCost, getCostSpecific, getCostSpecificById, updateSpecificCost } from '../controllers/costController.js';

const cost = express.Router();

cost.get("/cost/",getCost);
cost.get("/cost/specific",getCostSpecific);
cost.get("/cost/specific/:id",getCostSpecificById);
cost.post("/cost/specific/",createSpecificCost);
cost.put("/cost/specific/:id",updateSpecificCost);
cost.delete("/cost/specific/:id",deleteSpecificCost);

export default cost;