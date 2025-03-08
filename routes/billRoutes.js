import express from "express";
import { changeState, createBill, deleteBill, getBills } from "../controllers/billController.js";

const bill = express.Router();

bill.get("/bill/", getBills);
bill.post("/bill/", createBill);
bill.put("/bill/:idFactura/status", changeState);
bill.delete("/bill/:id", deleteBill);

export default bill;
