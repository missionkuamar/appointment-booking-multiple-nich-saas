// routes/admin.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getAdminStats, getAllUsers, createUser, updateUser, deleteUser,
  getAllBusinesses, getAllDoctors, getAllAppointments, getAllSubscriptions,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getDoctorById,
  toggleDoctorStatus,
  deleteDoctor,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getAllSlots,
  getSlotById,
  deleteSlot,
  deleteUnbookedSlots,
   getAllHolidays,
  createHoliday,
  deleteHoliday,
 
  getSubscriptionStats,
  updateSubscriptionStatus,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Auth Middleware
router.use(protect);

// 🔴 Admin / Super Admin Check
const adminOnly = (req, res, next) => {
  if (req.user && ["admin", "super_admin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

router.use(adminOnly); // Neeche ke saare routes sirf admin/super_admin ke liye hain

// Stats
router.get("/stats", getAdminStats);

// Users CRUD
router.route("/users")
  .get(getAllUsers)
  .post(createUser);

router.route("/users/:id")
  .patch(updateUser)
  .delete(deleteUser);

// Other Data
router.get("/businesses", getAllBusinesses);
router.get("/doctors", getAllDoctors);
router.get("/appointments", getAllAppointments);
router.get("/subscriptions", getAllSubscriptions);
router.get("/businesses/:id", getBusinessById);
router.patch("/businesses/:id", updateBusiness);
router.delete("/businesses/:id", deleteBusiness);
router.get("/doctors/:id", getDoctorById);
router.patch("/doctors/:id", toggleDoctorStatus);
router.delete("/doctors/:id", deleteDoctor);
router.get("/appointments/:id", getAppointmentById);
router.patch("/appointments/:id", updateAppointmentStatus);
router.delete("/appointments/:id", deleteAppointment);

// Slots
router.get("/slots", getAllSlots);
router.get("/slots/:id", getSlotById);
router.delete("/slots/:id", deleteSlot);
router.delete("/slots/bulk/clear", deleteUnbookedSlots);

// Holidays
router.get("/holidays", getAllHolidays);
router.post("/holidays", createHoliday);
router.delete("/holidays/:id", deleteHoliday);

router.get("/subscriptions/stats", getSubscriptionStats);
router.patch("/subscriptions/:id", updateSubscriptionStatus);


export default router;