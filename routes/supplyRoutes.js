import express from 'express';
import { createSupplyCost, deleteSupplyCost, getSupplyCost, updateSupplyCost } from '../controllers/supplyController.js';

const supply = express.Router();

supply.get("/cost/supply/",getSupplyCost);
supply.post("/cost/supply/",createSupplyCost);
supply.put("/cost/supply/:id",updateSupplyCost);
supply.delete("/cost/supply/:id",deleteSupplyCost);

export default supply;