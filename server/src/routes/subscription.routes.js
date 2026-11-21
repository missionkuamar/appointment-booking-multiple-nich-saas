import express from "express";
import {
  createOrder,
  getSubscriptionStatus,
  verifyPayment,
  getSubscriptionHistory,
} from "../controllers/subscription.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // Saare routes protected hain

router.post("/create", createOrder);
router.post("/create-order", createOrder);
router.get("/status", getSubscriptionStatus);
router.post("/verify", verifyPayment);
router.post("/verify-payment", verifyPayment);
router.get("/history", protect, getSubscriptionHistory);
export default router;