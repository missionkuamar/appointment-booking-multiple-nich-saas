import express from "express";
import {
  addHoliday,
  getHolidays,
  deleteHoliday,
} from "../controllers/holiday.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);
router.route("/").post(addHoliday).get(getHolidays);
router.delete("/:id", deleteHoliday);

export default router;