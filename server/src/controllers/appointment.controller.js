import Appointment from "../models/Appointment.js";
import Business from "../models/Business.js";
import Slot from "../models/Slot.js";
import { isValidTransition } from "../utils/appointmentStatus.js";
import Doctor from "../models/Doctor.js";
import { sendAppointmentUpdateNotification } from "../services/notify.service.js";


// @desc    Doctor adds a walk-in / emergency patient
// @route   POST /api/appointments/walk-in
export const addWalkInAppointment = async (req, res) => {
  try {
    const { slotId, clientName, clientPhone, reason, date } = req.body;

    if (!slotId || !clientName?.trim() || !clientPhone?.trim()) {
      return res.status(400).json({
        message: "slotId, clientName, and clientPhone are required",
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Atomically lock slot only if free and not blocked
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        doctorId: doctor._id,
        isBooked: false,
        isBlocked: false,
      },
      { $set: { isBooked: true } },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: "Slot is already booked, blocked, or unavailable",
      });
    }

    if (date && slot.date !== date) {
      // Revert slot lock if date doesn't match selected slot
      await Slot.findByIdAndUpdate(slot._id, { $set: { isBooked: false } });
      return res.status(400).json({
        message: "Selected slot date does not match the requested date",
      });
    }

    const appointment = await Appointment.create({
      businessId: doctor.businessId,
      doctorId: doctor._id,
      slotId: slot._id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      reason: reason?.trim() || "Walk-in / Emergency",
      date: slot.date,
      time: slot.startTime,
      status: "confirmed",
    });

    return res.status(201).json({
      message: "Walk-in added successfully",
      appointment,
    });
  } catch (error) {
    console.error("❌ [addWalkIn] ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};



// @desc    Get my appointments (paginated)
// @route   GET /api/appointments/my
export const getMyAppointments = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const {
      status,
      doctorId,
      page = 1,
      limit = 20,
      from,
      to,
    } = req.query;

    const filter = { businessId: business._id };
    if (status && status !== "all") filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("doctorId", "name specialization")
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      data: appointments,
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

// @desc    Get dashboard stats (aggregate)
// @route   GET /api/appointments/stats
// @desc    Get dashboard stats
// @route   GET /api/appointments/stats
export const getStats = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    // 🔴 New: Range parameter (default 7 days)
    const { range = "7" } = req.query; 
    const daysCount = parseInt(range); // 7, 15, 30, 60, 90, 180

    const formatDate = (d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    // Trend dates calculate karo
    const trendStart = new Date(today);
    trendStart.setDate(today.getDate() - (daysCount - 1)); // e.g., 7 days means last 7 days including today
    const trendStartStr = formatDate(trendStart);

    const [
      todayCount, pendingCount, totalCount, trendRaw
    ] = await Promise.all([
      Appointment.countDocuments({ businessId: business._id, date: todayStr, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ businessId: business._id, status: "pending" }),
      Appointment.countDocuments({ businessId: business._id, status: { $ne: "cancelled" } }),
      Appointment.aggregate([
        {
          $match: {
            businessId: business._id,
            date: { $gte: trendStartStr }, // Filter by selected range
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: "$date", count: { $sum: 1 } } },
      ]),
    ]);

    // Trend Array create karo
    const trendMap = Object.fromEntries(trendRaw.map((r) => [r._id, r.count]));
    const trend = [];
    
    // Backend logic: Agar range bada hai (jaise 30 days), toh data points kam karne ke liye step calculate karo
    const step = daysCount > 30 ? Math.floor(daysCount / 15) : 1; // Max 15-20 bars on chart

    for (let i = 0; i < daysCount; i += step) {
      const d = new Date(trendStart);
      d.setDate(trendStart.getDate() + i);
      const ds = formatDate(d);
      
      // Agar step laga hai, toh bich ke dinon ka data add karo
      let count = 0;
      for(let j=0; j<step; j++) {
        const subD = new Date(d);
        subD.setDate(d.getDate() + j);
        count += trendMap[formatDate(subD)] || 0;
      }

      trend.push({ date: ds, count });
    }

    res.json({
      today: todayCount,
      week: 0,  // Aap chaho toh week ka alag logic rakh sakte ho
      month: 0, // Aap chaho toh month ka alag logic rakh sakte ho
      pending: pendingCount,
      total: totalCount,
      trend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PATCH /api/appointments/:id
export const updateAppointment = async (req, res) => {
  console.log("[updateAppointment] Request received:", {
    userId: req.user?.id,
    appointmentId: req.params.id,
    body: req.body,
  });

  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      console.warn("[updateAppointment] Business not found for user:", req.user?.id);
      return res.status(404).json({ message: "Business not found" });
    }
    console.log("[updateAppointment] Business found:", business._id);

    const { status, notes } = req.body;

    const appt = await Appointment.findOne({
      _id: req.params.id,
      businessId: business._id,
    });
    if (!appt) {
      console.warn("[updateAppointment] Appointment not found:", req.params.id);
      return res.status(404).json({ message: "Appointment not found" });
    }

    const previousStatus = appt.status;
    const previousNotes = appt.notes;
    console.log("[updateAppointment] Current appointment status:", previousStatus);

    if (status) {
      if (!isValidTransition(appt.status, status)) {
        return res.status(400).json({
          message: `Cannot change status from ${appt.status} to ${status}`,
        });
      }
      appt.status = status;
      console.log("[updateAppointment] Status updated to:", status);
    }

    if (notes !== undefined) {
      appt.notes = notes;
      console.log("[updateAppointment] Notes updated to:", notes);
    }

    await appt.save();
    console.log("[updateAppointment] Appointment saved:", appt._id);

    if (["cancelled", "rejected", "no_show"].includes(status) && appt.slotId) {
      await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });
      console.log("[updateAppointment] Slot released:", appt.slotId);
    }

    const hasChange =
      (status && status !== previousStatus) ||
      (notes !== undefined && notes !== previousNotes);

    if (hasChange && appt.clientEmail) {
      (async () => {
        try {
          await sendAppointmentUpdateNotification(business, appt, previousStatus);
        } catch (e) {
          console.error("[updateAppointment] Notify error:", e.message);
        }
      })();
    }

    console.log("[updateAppointment] Success response sent for appointment:", appt._id);
    res.json(appt);
  } catch (error) {
    console.error("[updateAppointment] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get logged-in doctor's own appointments
// @route   GET /api/appointments/my-appointments


export const getDoctorOwnAppointments = async (req, res) => {
  try {
    // 1. Find doctor by logged-in user ID
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    // 2. Fetch appointments for this doctor
    const appointments = await Appointment.find({ 
      doctorId: doctor._id,
      status: { $ne: "cancelled" } 
    }).sort({ date: 1, time: 1 });

    res.json({ data: appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};