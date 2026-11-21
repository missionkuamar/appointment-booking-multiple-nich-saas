import express from "express";
import { getPlans } from "../controllers/plan.controller.js";

const router = express.Router();

// Public route (frontend ko plans dikhane ke liye)
router.get("/", getPlans);

export default router;