import express from "express";
import {
  getMyAppointments,
  updateAppointment,
  getStats,
} from "../controllers/appointment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { getDoctorOwnAppointments } from "../controllers/appointment.controller.js";
import { addWalkInAppointment } from "../controllers/appointment.controller.js";
import { updateAppointmentByDoctor } from "../controllers/staff.controller.js";


const router = express.Router();

router.get("/my", protect, getMyAppointments);
router.get("/stats", protect, getStats);
router.patch("/:id", protect, updateAppointment);
router.patch("/bydoctor/:id", protect, updateAppointmentByDoctor);
router.get("/my-appointments", protect, getDoctorOwnAppointments);

router.post("/walk-in", protect, addWalkInAppointment);

export default router;