import express from "express";
import {
  generateSlots,
  getMySlots,
  clearSlots,
} from "../controllers/slot.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", protect, generateSlots);
router.get("/my", protect, getMySlots);
router.delete("/clear", protect, clearSlots);

export default router;