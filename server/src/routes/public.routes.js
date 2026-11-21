import express from "express";
import {
  getBusinessBySlug,
  getAvailableDates,
  getAvailableSlots,
  bookAppointment,
  getByToken,
  cancelByToken,
  rescheduleByToken,
} from "../controllers/public.controller.js";
import {
  bookingLimiter,
  publicLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// manage routes first (avoid slug clash)
router.get("/manage/:token", publicLimiter, getByToken);
router.post("/manage/:token/cancel", bookingLimiter, cancelByToken);
router.post("/manage/:token/reschedule", bookingLimiter, rescheduleByToken);

router.get("/:slug", publicLimiter, getBusinessBySlug);
router.get("/:slug/dates", publicLimiter, getAvailableDates);
router.get("/:slug/slots", publicLimiter, getAvailableSlots);
router.post("/:slug/book", bookingLimiter, bookAppointment);

export default router;