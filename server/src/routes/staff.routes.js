import express from "express";
import {
  addStaff,
  getMyStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, addStaff);
router.get("/", protect, getMyStaff);
router.patch("/:id", protect, updateStaff);
router.delete("/:id", protect, deleteStaff);

export default router;