import express from "express";
import {
  getMyAppointments,
  updateAppointment,
  getStats,
} from "../controllers/appointment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my", protect, getMyAppointments);
router.get("/stats", protect, getStats);
router.patch("/:id", protect, updateAppointment);

export default router;