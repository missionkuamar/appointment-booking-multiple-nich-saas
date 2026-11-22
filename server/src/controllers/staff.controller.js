import User from "../models/User.js";
import Business from "../models/Business.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { isValidTransition } from "../utils/appointmentStatus.js";
import Subscription from "../models/Subscription.js";
import { getPlanById } from "../config/planConfig.js";



// @desc    Add staff
// @route   POST /api/staff

export const addStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // 🔒 SUBSCRIPTION PLAN STAFF LIMIT CHECK
    const subscription = await Subscription.findOne({ businessId: business._id });
    const isPlanActive = subscription && subscription.status === "active";
    const activePlan = getPlanById(isPlanActive ? subscription.plan : "free");
    const maxStaff = activePlan.limits.maxStaff;

    const currentStaffCount = await User.countDocuments({
      businessId: business._id,
      role: "staff",
    });

    if (currentStaffCount >= maxStaff) {
      return res.status(403).json({
        message: `You have reached the maximum limit of ${maxStaff} staff account(s) on the ${activePlan.name} plan. Please upgrade your plan to add more staff.`,
        code: "STAFF_LIMIT_REACHED",
        currentCount: currentStaffCount,
        maxAllowed: maxStaff,
        currentPlan: activePlan.id,
      });
    }

    const { name, email, password, staffTitle } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "staff",
      staffTitle: staffTitle?.trim() || "",
      businessId: business._id,
      isActive: true,
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      staffTitle: staff.staffTitle,
      role: staff.role,
      businessId: staff.businessId,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my staff (with business-scoped filters & pagination)
// @route   GET /api/staff
export const getMyStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const {
      status = "all", // "all" | "active" | "inactive"
      title = "",
      search = "",
      page = 1,
      limit = 6,
    } = req.query;

    const baseFilter = {
      businessId: business._id,
      role: "staff",
    };

    const filter = { ...baseFilter };

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    if (title && title !== "all") {
      filter.staffTitle = title.trim();
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { staffTitle: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 6, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    const [staff, total, rawTitles] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
      User.distinct("staffTitle", baseFilter),
    ]);

    const availableTitles = rawTitles
      .map((t) => (t || "").trim())
      .filter(Boolean);

    res.json({
      data: staff,
      availableTitles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(Math.ceil(total / limitNum), 1),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Update staff
// @route   PATCH /api/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const { name, email, staffTitle, isActive } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      businessId: business._id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (email !== undefined && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== staff.email) {
        const emailExists = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: staff._id },
        });
        if (emailExists) {
          return res.status(400).json({ message: "Email already in use" });
        }
        staff.email = normalizedEmail;
      }
    }

    if (name !== undefined && name.trim()) staff.name = name.trim();
    if (staffTitle !== undefined) staff.staffTitle = staffTitle.trim();

    if (isActive !== undefined) {
      staff.isActive =
        typeof isActive === "string"
          ? isActive.toLowerCase() === "true"
          : Boolean(isActive);
    }

    await staff.save();

    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      staffTitle: staff.staffTitle,
      role: staff.role,
      businessId: staff.businessId,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const deleted = await User.findOneAndDelete({
      _id: req.params.id,
      businessId: business._id,
      role: "staff",
    });

    if (!deleted) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ message: "Staff removed", id: deleted._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PATCH /api/appointments/:id
// @desc    Doctor updates their own appointment status
// @route   PATCH /api/appointments/bydoctor/:id
export const updateAppointmentByDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const { status, notes } = req.body;

    const appt = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    });
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (status) {
      if (!isValidTransition(appt.status, status)) {
        return res.status(400).json({
          message: `Cannot change status from ${appt.status} to ${status}`,
        });
      }
      appt.status = status;
    }

    if (notes !== undefined) appt.notes = notes;

    await appt.save();

    if (["cancelled", "no_show"].includes(status) && appt.slotId) {
      await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });
    }

    res.json(appt);
  } catch (error) {
    console.error("❌ [updateAppointmentByDoctor] ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};