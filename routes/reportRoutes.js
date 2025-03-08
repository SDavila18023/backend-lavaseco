import express from "express";
import { fetchReport, fetchReportByType, generatePDF } from "../controllers/reportController.js";

const report = express.Router();

report.get("/reports/:type",fetchReport)
report.get("/reports/:type/search",fetchReportByType)
report.post("/reports/:type/pdf",generatePDF)

export default report;