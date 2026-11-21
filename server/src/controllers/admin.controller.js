// controllers/admin.controller.js
import User from "../models/user.js";
import Business from "../models/Business.js";
import Affiliate from "../affiliate/affiliate.models.js"; // Agar affiliate stats chahiye toh
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Subscription from "../models/Subscription.js";
import Holiday from "../models/Holiday.js";



// ─────────────────────────────────────────────
// 1. ADMIN DASHBOARD STATS
// ─────────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalBusinesses, totalDoctors, totalAppointments, activeSubs] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Subscription.find({ status: "active" }),
    ]);

    const monthlyRevenue = activeSubs.reduce((acc, sub) => acc + (sub.price || 0), 0);

    res.json({
      totalUsers,
      totalBusinesses,
      totalDoctors,
      totalAppointments,
      activeSubscriptions: activeSubs.length,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. USERS MANAGEMENT (Pagination + Search)
// ─────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    
    let query = { role: { $ne: "super_admin" } }; // Admin can't see Super Admins
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && role !== "all") query.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, staffTitle } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password required" });
    if (role === "super_admin") return res.status(403).json({ message: "Cannot create Super Admin" });
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, role: role || "owner", staffTitle: staffTitle || "" });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "super_admin") return res.status(403).json({ message: "Cannot modify Super Admin" });

    if (isActive !== undefined) user.isActive = isActive;
    if (role && role !== "super_admin") user.role = role;
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "super_admin") return res.status(403).json({ message: "Cannot delete Super Admin" });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. BUSINESSES, DOCTORS, APPOINTMENTS, SUBSCRIPTIONS
// ─────────────────────────────────────────────
// export const getAllBusinesses = async (req, res) => {
//   try {
//     const { search, page = 1, limit = 20 } = req.query;
//     let query = {};
//     if (search) query.businessName = { $regex: search, $options: "i" };

//     const skip = (Number(page) - 1) * Number(limit);
//     const [businesses, total] = await Promise.all([
//       Business.find(query).populate("ownerId", "name email").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
//       Business.countDocuments(query),
//     ]);

//     res.json({ businesses, pagination: { page: Number(page), total, totalPages: Math.ceil(total / Number(limit)) } });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllDoctors = async (req, res) => {
//   try {
//     const doctors = await Doctor.find().populate("businessId", "businessName").sort({ createdAt: -1 });
//     res.json({ doctors });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllAppointments = async (req, res) => {
//   try {
//     const appointments = await Appointment.find()
//       .populate("businessId", "businessName")
//       .populate("doctorId", "name")
//       .sort({ createdAt: -1 })
//       .limit(50);
//     res.json({ appointments });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllSubscriptions = async (req, res) => {
//   try {
//     const subscriptions = await Subscription.find()
//       .populate("businessId", "businessName")
//       .populate("userId", "name email")
//       .sort({ createdAt: -1 });
//     res.json({ subscriptions });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




// ==========================================
// 1. GET ALL BUSINESSES (Search + Pagination)
// ==========================================
export const getAllBusinesses = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    let query = {};
    if (search.trim()) {
      query.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate("ownerId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Business.countDocuments(query),
    ]);

    res.json({
      businesses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET SINGLE BUSINESS BY ID
// ==========================================
export const getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate("ownerId", "name email phone");

    if (!business) return res.status(404).json({ message: "Business not found" });

    // Get owner stats (no. of doctors, appointments)
    const { default: Doctor } = await import("../models/Doctor.js");
    const { default: Appointment } = await import("../models/Appointment.js");
    
    const [doctorCount, appointmentCount] = await Promise.all([
      Doctor.countDocuments({ businessId: business._id }),
      Appointment.countDocuments({ businessId: business._id }),
    ]);

    res.json({ business, stats: { doctorCount, appointmentCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. UPDATE BUSINESS STATUS / DETAILS
// ==========================================
export const updateBusiness = async (req, res) => {
  try {
    const { isActive, subscriptionStatus, businessName } = req.body;
    
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: "Business not found" });

    if (isActive !== undefined) business.isActive = isActive;
    if (subscriptionStatus) business.subscriptionStatus = subscriptionStatus;
    if (businessName) business.businessName = businessName;

    await business.save();
    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. DELETE BUSINESS (Permanently)
// ==========================================
export const deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndDelete(req.params.id);
    if (!business) return res.status(404).json({ message: "Business not found" });

    // (Optional) Delete related users? Usually, we keep them but unlink.
    await User.updateMany(
      { businessId: business._id },
      { $set: { businessId: null } }
    );

    res.json({ success: true, message: "Business deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};








// ==========================================
// 1. GET ALL DOCTORS (Search + Pagination)
// ==========================================
export const getAllDoctors = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    let query = {};
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { qualification: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate("businessId", "businessName slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(query),
    ]);

    res.json({
      doctors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET SINGLE DOCTOR BY ID
// ==========================================
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("businessId", "businessName slug address phone")
      .populate("userId", "email");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Appointment stats nikal lo
    const appointmentCount = await Appointment.countDocuments({ doctorId: doctor._id });

    res.json({ doctor, stats: { appointmentCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. TOGGLE DOCTOR ACTIVE STATUS
// ==========================================
export const toggleDoctorStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.isActive = isActive;
    await doctor.save();

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. DELETE DOCTOR
// ==========================================
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // (Optional) Delete related User if needed

    res.json({ success: true, message: "Doctor deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// ==========================================
// 1. GET ALL APPOINTMENTS (Filters + Pagination)
// ==========================================
export const getAllAppointments = async (req, res) => {
  try {
    const { 
      search = "", 
      status = "all", 
      page = 1, 
      limit = 10,
      fromDate,
      toDate
    } = req.query;

    let query = {};
    
    // 1. Status Filter
    if (status && status !== "all") {
      query.status = status;
    }

    // 2. Date Range Filter
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    // 3. Search Filter (Patient Name / Phone)
    if (search.trim()) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientPhone: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // Fetch Data + Count
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("businessId", "businessName slug")
        .populate("doctorId", "name specialization")
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(query),
    ]);

    res.json({
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET SINGLE APPOINTMENT BY ID
// ==========================================
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("businessId", "businessName address phone")
      .populate("doctorId", "name specialization consultationFee")
      .populate("slotId", "startTime endTime");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. UPDATE APPOINTMENT STATUS
// ==========================================
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["pending", "confirmed", "completed", "cancelled", "no_show"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = status;
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. DELETE APPOINTMENT
// ==========================================
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    res.json({ success: true, message: "Appointment deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// ==========================================
// 1. GET ALL SLOTS (Filters + Pagination)
// ==========================================
export const getAllSlots = async (req, res) => {
  try {
    const { 
      search = "", 
      doctorId = "", 
      status = "all", // all, booked, available, blocked
      page = 1, 
      limit = 20,
      date
    } = req.query;

    let query = {};
    
    // 1. Doctor Filter
    if (doctorId) {
      query.doctorId = doctorId;
    }

    // 2. Status Filter
    if (status === "booked") query.isBooked = true;
    if (status === "available") { query.isBooked = false; query.isBlocked = false; }
    if (status === "blocked") query.isBlocked = true;

    // 3. Date Filter
    if (date) query.date = date;

    // 4. Search Filter (Search by Date or Doctor Name requires populate, so we'll use aggregation or just filter by date string for now)
    if (search.trim()) {
      query.$or = [
        { date: { $regex: search, $options: "i" } },
        { startTime: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // Fetch Data + Count
    const [slots, total] = await Promise.all([
      Slot.find(query)
        .populate("doctorId", "name specialization")
        .populate("businessId", "businessName")
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Slot.countDocuments(query),
    ]);

    res.json({
      slots,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET SINGLE SLOT BY ID
// ==========================================
export const getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id)
      .populate("doctorId", "name specialization consultationFee")
      .populate("businessId", "businessName address phone");

    if (!slot) return res.status(404).json({ message: "Slot not found" });

    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. DELETE SLOT
// ==========================================
export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    // Prevent deletion if booked
    if (slot.isBooked) {
      return res.status(400).json({ message: "Cannot delete a booked slot. Please cancel the appointment first." });
    }

    await Slot.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Slot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. BULK DELETE UNBOOKED FUTURE SLOTS
// ==========================================
export const deleteUnbookedSlots = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    
    const result = await Slot.deleteMany({
      date: { $gte: todayStr },
      isBooked: false,
    });

    res.json({ success: true, message: `${result.deletedCount} unbooked slots cleared` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// 1. GET ALL HOLIDAYS (Filters + Pagination)
// ==========================================
export const getAllHolidays = async (req, res) => {
  try {
    const { 
      search = "", 
      page = 1, 
      limit = 10,
      fromDate,
      toDate
    } = req.query;

    let query = {};

    // 1. Date Range Filter
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    // 2. Search Filter (By Reason or Date)
    if (search.trim()) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { date: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // Fetch Data + Count
    const [holidays, total] = await Promise.all([
      Holiday.find(query)
        .populate("businessId", "businessName")
        .populate("doctorId", "name specialization")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Holiday.countDocuments(query),
    ]);

    res.json({
      holidays,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. CREATE NEW HOLIDAY (Admin can add global holiday)
// ==========================================
export const createHoliday = async (req, res) => {
  try {
    const { date, reason, businessId, doctorId } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const holiday = await Holiday.create({
      date,
      reason: reason || "Admin Holiday",
      businessId: businessId || null, // null = Global Holiday for all
      doctorId: doctorId || null,     // null = Clinic-wide holiday
    });

    res.status(201).json({ success: true, holiday });
  } catch (error) {
    // Handle Duplicate Error (if unique index exists)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Holiday already exists for this date/clinic" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. DELETE HOLIDAY
// ==========================================
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });

    res.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
















// ==========================================
// 1. GET ALL SUBSCRIPTIONS (Filters + Pagination)
// ==========================================
export const getAllSubscriptions = async (req, res) => {
  try {
    const { 
      search = "", 
      plan = "all", 
      status = "all",
      page = 1, 
      limit = 10,
    } = req.query;

    let query = {};
    
    // 1. Plan Filter
    if (plan && plan !== "all") query.plan = plan;
    
    // 2. Status Filter
    if (status && status !== "all") query.status = status;

    // 3. Search Filter (Requires populate first, so we can use $lookup or manually filter later)
    // For simplicity, we'll search by business name using a populate-based query
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate("businessId", "businessName slug")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(query),
    ]);

    // Manual search filter (Business Name)
    let finalSubs = subscriptions;
    if (search.trim()) {
      const q = search.toLowerCase();
      finalSubs = subscriptions.filter(s => 
        s.businessId?.businessName?.toLowerCase().includes(q) ||
        s.userId?.email?.toLowerCase().includes(q)
      );
    }

    res.json({
      subscriptions: finalSubs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET SUBSCRIPTION STATS (Revenue, Active, etc.)
// ==========================================
export const getSubscriptionStats = async (req, res) => {
  try {
    const [totalSubs, activeSubs, revenueResult] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ])
    ]);

    const monthlyRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalSubscriptions: totalSubs,
      activeSubscriptions: activeSubs,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. UPDATE SUBSCRIPTION STATUS
// ==========================================
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["active", "cancelled", "expired", "past_due"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = status;
    await sub.save();

    // Update Business model too
    await Business.findByIdAndUpdate(sub.businessId, {
      subscriptionStatus: status
    });

    res.json({ success: true, subscription: sub });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};