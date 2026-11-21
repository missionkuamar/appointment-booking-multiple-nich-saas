import Doctor from "../models/Doctor.js";
import Business from "../models/Business.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { getPlanById } from "../config/planConfig.js";

// @desc    Add doctor
// @route   POST /api/doctors

export const addDoctor = async (req, res) => {
  console.log("\n🚀 [Controller: addDoctor] Started");
  console.log("👤 [addDoctor] req.user:", req.user);
  console.log("📦 [addDoctor] req.body:", { ...req.body, password: "***" });

  try {
    const ownerId = req.user?._id || req.user?.id;
    console.log("🔍 [addDoctor] Finding business for ownerId:", ownerId);

    const business = await Business.findOne({ ownerId });
    if (!business) {
      console.warn("⚠️ [addDoctor] Business not found for ownerId:", ownerId);
      return res.status(404).json({ message: "Business not found" });
    }
    console.log("✅ [addDoctor] Business found:", business._id);

    // 🔒 SUBSCRIPTION PLAN DOCTOR LIMIT CHECK
    const subscription = await Subscription.findOne({ businessId: business._id });
    const isPlanActive = subscription && subscription.status === "active";
    const activePlan = getPlanById(isPlanActive ? subscription.plan : "free");
    const maxDoctors = activePlan.limits.maxDoctors;

    const currentDoctorCount = await Doctor.countDocuments({
      businessId: business._id,
    });

    console.log(
      `📊 [addDoctor] Plan: ${activePlan.name} | Doctors: ${currentDoctorCount}/${maxDoctors}`
    );

    if (currentDoctorCount >= maxDoctors) {
      console.warn(
        `🚫 [addDoctor] Doctor limit reached for plan ${activePlan.name}`
      );
      return res.status(403).json({
        message: `You have reached the maximum limit of ${maxDoctors} doctor(s) on the ${activePlan.name} plan. Please upgrade your plan to add more doctors.`,
        code: "DOCTOR_LIMIT_REACHED",
        currentCount: currentDoctorCount,
        maxAllowed: maxDoctors,
        currentPlan: activePlan.id,
      });
    }

    const {
      name,
      email,
      password,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      department,
      bio,
      availability,
    } = req.body;

    if (!name || !email || !password) {
      console.warn("⚠️ [addDoctor] Missing required fields:", {
        name,
        email,
        hasPassword: !!password,
      });
      return res
        .status(400)
        .json({ message: "name, email, password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      console.warn("⚠️ [addDoctor] Email already exists:", normalizedEmail);
      return res.status(400).json({ message: "Email already exists" });
    }

    console.log("🛠️ [addDoctor] Creating User document...");
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "staff",
      staffTitle: specialization || "Doctor",
      businessId: business._id,
    });
    console.log("✅ [addDoctor] User created with ID:", user._id);

    console.log("🛠️ [addDoctor] Creating Doctor document...");
    const doctor = await Doctor.create({
      businessId: business._id,
      userId: user._id,
      name: name.trim(),
      specialization: specialization || "",
      qualification: qualification || "",
      experienceYears: experienceYears || 0,
      consultationFee: consultationFee || 0,
      department: department || "",
      bio: bio || "",
      availability: availability || [],
    });
    console.log("🎉 [addDoctor] Doctor created successfully:", doctor._id);

    res.status(201).json(doctor);
  } catch (error) {
    console.error("❌ [Controller: addDoctor] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my doctors
// @route   GET /api/doctors
export const getMyDoctors = async (req, res) => {
  console.log("\n🚀 [Controller: getMyDoctors] Started");
  try {
    const ownerId = req.user?._id || req.user?.id;
    console.log("🔍 [getMyDoctors] Finding business for ownerId:", ownerId);

    const business = await Business.findOne({ ownerId });
    if (!business) {
      console.warn("⚠️ [getMyDoctors] Business not found for ownerId:", ownerId);
      return res.status(404).json({ message: "Business not found" });
    }
    console.log("✅ [getMyDoctors] Business found:", business._id);

    const doctors = await Doctor.find({ businessId: business._id }).sort({
      createdAt: -1,
    });
    console.log(`📦 [getMyDoctors] Found ${doctors.length} doctors`);

    res.json(doctors);
  } catch (error) {
    console.error("❌ [Controller: getMyDoctors] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor
// @route   PATCH /api/doctors/:id
export const updateDoctor = async (req, res) => {
  console.log(`\n🚀 [Controller: updateDoctor] Started for ID: ${req.params.id}`);
  console.log("📦 [updateDoctor] Update Body:", req.body);

  try {
    const ownerId = req.user?._id || req.user?.id;
    const business = await Business.findOne({ ownerId });
    if (!business) {
      console.warn("⚠️ [updateDoctor] Business not found for ownerId:", ownerId);
      return res.status(404).json({ message: "Business not found" });
    }

    const doctor = await Doctor.findOne({
      _id: req.params.id,
      businessId: business._id,
    });
    if (!doctor) {
      console.warn("⚠️ [updateDoctor] Doctor not found:", req.params.id);
      return res.status(404).json({ message: "Doctor not found" });
    }

    const fields = [
      "name",
      "specialization",
      "qualification",
      "experienceYears",
      "consultationFee",
      "department",
      "bio",
      "avatarUrl",
      "isActive",
      "availability",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) doctor[f] = req.body[f];
    });

    await doctor.save();
    console.log("✅ [updateDoctor] Doctor updated successfully:", doctor._id);

    res.json(doctor);
  } catch (error) {
    console.error("❌ [Controller: updateDoctor] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  console.log(`\n🚀 [Controller: deleteDoctor] Started for ID: ${req.params.id}`);

  try {
    const ownerId = req.user?._id || req.user?.id;
    const business = await Business.findOne({ ownerId });
    if (!business) {
      console.warn("⚠️ [deleteDoctor] Business not found for ownerId:", ownerId);
      return res.status(404).json({ message: "Business not found" });
    }

    const doctor = await Doctor.findOneAndDelete({
      _id: req.params.id,
      businessId: business._id,
    });
    if (!doctor) {
      console.warn("⚠️ [deleteDoctor] Doctor not found:", req.params.id);
      return res.status(404).json({ message: "Doctor not found" });
    }
    console.log("🗑️ [deleteDoctor] Doctor deleted:", doctor._id);

    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
      console.log("🗑️ [deleteDoctor] Linked User deleted:", doctor.userId);
    }

    res.json({ message: "Doctor removed" });
  } catch (error) {
    console.error("❌ [Controller: deleteDoctor] Error:", error);
    res.status(500).json({ message: error.message });
  }
};