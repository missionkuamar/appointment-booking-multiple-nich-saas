import express from "express";
import {
  generateSlots,
  getMySlots,
  clearSlots,
  generateMySlots,
  generateSlotByDocter
} from "../controllers/slot.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { getDoctorSchedule } from "../controllers/slot.controller.js";



const router = express.Router();

router.post(
  "/generate",
  (req, res, next) => {
    // console.log("\n📥 [Route Hit] POST /api/slots/generate | Body:", req.body);
    next();
  },
  protect,
  generateSlots
);
router.post("/my-generate", protect, generateMySlots);
router.post("/mydocterslot", protect, generateSlotByDocter);

router.get("/my", protect, getMySlots);
router.delete("/clear", protect, clearSlots);
router.get("/my-schedule", protect, getDoctorSchedule);

export default router;