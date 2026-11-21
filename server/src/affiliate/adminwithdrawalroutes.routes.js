import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js"; // apne auth middleware ke hisaab se naam check kar lein
import {
  getAllWithdrawalsAdmin,
  getWithdrawalStatsAdmin,
  getWithdrawalByIdAdmin,
  approveWithdrawalAdmin,
  completeWithdrawalAdmin,
  rejectWithdrawalAdmin,
  cancelWithdrawalAdmin,
  bulkProcessWithdrawalsAdmin,
  exportWithdrawalsAdmin,
} from "./adminwithdrawal.controllers.js";

const router = express.Router();

router.use(protect, authorize("admin", "super_admin"));

router.get("/", getAllWithdrawalsAdmin);
router.get("/stats", getWithdrawalStatsAdmin);
router.get("/export", exportWithdrawalsAdmin);
router.get("/:id", getWithdrawalByIdAdmin);
router.patch("/:id/approve", approveWithdrawalAdmin);
router.patch("/:id/complete", completeWithdrawalAdmin);
router.patch("/:id/reject", rejectWithdrawalAdmin);
router.patch("/:id/cancel", cancelWithdrawalAdmin);
router.post("/bulk-process", bulkProcessWithdrawalsAdmin);

export default router;