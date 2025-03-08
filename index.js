import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import user from "./routes/userRoutes.js";
import bill from "./routes/billRoutes.js";
import cost from "./routes/costRoutes.js";
import supply from "./routes/supplyRoutes.js";
import report from "./routes/reportRoutes.js";
import dashboard from "./routes/dashboardRoutes.js";
import employee from "./routes/employeeRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

// Rutas
app.use("/api", user);
app.use("/api", bill);
app.use("/api", cost);
app.use("/api", employee);
app.use("/api", supply);
app.use("/api", report);
app.use("/api",dashboard)

// Puerto
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
