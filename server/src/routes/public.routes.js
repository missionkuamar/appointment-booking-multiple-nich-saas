import express from "express";
import {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableDates,
  bookAppointment,
  getByToken,
  cancelByToken,
  rescheduleByToken,
} from "../controllers/public.controller.js";

const router = express.Router();

// Manage routes FIRST (before /:slug)
router.get("/manage/:token", getByToken);
router.post("/manage/:token/cancel", cancelByToken);
router.post("/manage/:token/reschedule", rescheduleByToken);

// Business routes
router.get("/:slug", getBusinessBySlug);
router.get("/:slug/dates", getAvailableDates);
router.get("/:slug/slots", getAvailableSlots);
router.post("/:slug/book", bookAppointment);

export default router;