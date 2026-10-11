import express from "express";
import {
  onboarding,
  getMyBusiness,
  updateCustomFields,
} from "../controllers/business.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/onboarding", protect, onboarding);
router.get("/me", protect, getMyBusiness);
router.put("/custom-fields", protect, updateCustomFields);

export default router;