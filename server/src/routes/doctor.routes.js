import express from "express";
import {
  addDoctor,
  getMyDoctors,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. Incoming request ko protect middleware se pehle log karne ke liye
router.use((req, res, next) => {
  console.log(`\n📥 [Doctor Route Incoming] ${req.method} ${req.originalUrl}`);
  console.log("🔑 [Headers Auth]:", req.headers.authorization ? "Token Present" : "No Token");
  console.log("📦 [Body]:", req.body);
  console.log("🆔 [Params]:", req.params);
  next();
});

// Auth Middleware
router.use(protect);

// 2. Protect middleware pass hone ke baad user verify karne ke liye
router.use((req, res, next) => {
  console.log("✅ [Auth Passed] User ID:", req.user?._id || req.user?.id, "| Role:", req.user?.role);
  next();
});

// Routes with Controller hit logs
router
  .route("/")
  .post((req, res, next) => {
    console.log("➡️ [Route Hit] POST / -> addDoctor");
    next();
  }, addDoctor)
  .get((req, res, next) => {
    console.log("➡️ [Route Hit] GET / -> getMyDoctors");
    next();
  }, getMyDoctors);

router
  .route("/:id")
  .patch((req, res, next) => {
    console.log(`➡️ [Route Hit] PATCH /${req.params.id} -> updateDoctor`);
    next();
  }, updateDoctor)
  .delete((req, res, next) => {
    console.log(`➡️ [Route Hit] DELETE /${req.params.id} -> deleteDoctor`);
    next();
  }, deleteDoctor);

export default router;