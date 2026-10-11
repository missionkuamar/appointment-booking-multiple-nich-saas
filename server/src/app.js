import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import slotRoutes from "./routes/slot.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import publicRoutes from "./routes/public.routes.js";
import staffRoutes from "./routes/staff.routes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Appointment SaaS API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/staff", staffRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

export default app;