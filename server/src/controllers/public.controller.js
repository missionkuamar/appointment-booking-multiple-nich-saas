import crypto from "crypto";
import Business from "../models/Business.js";
import Slot from "../models/Slot.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Holiday from "../models/Holiday.js";
import mongoose from "mongoose";
import {
  sendOwnerNotification,
  sendClientNotification,
  sendRescheduleNotification,
} from "../services/notify.service.js";

// Helper
const todayStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// @desc    Get business by slug
// @route   GET /api/public/:slug
export const getBusinessBySlug = async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const doctors = await Doctor.find({
      businessId: business._id,
      isActive: true,
    }).select("name specialization qualification consultationFee department avatarUrl");

    res.json({
      _id: business._id,
      businessName: business.businessName,
      businessType: business.businessType,
      slug: business.slug,
      tagline: business.tagline,
      address: business.address,
      phone: business.phone,
      labels: business.labels,
      customFields: business.customFields.filter((f) => f.isActive),
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// / @desc    Get available dates (Doctor Specific or Any)
// @route   GET /api/public/:slug/dates
// 1. formatDate helper function file ke top par define karein
const formatDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getAvailableDates = async (req, res) => {
  try {
    const { slug } = req.params;
    const { doctorId } = req.query;

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const filter = {
      businessId: business._id,
      date: { $gte: todayStr },
      isBooked: false,
      isBlocked: false,
    };

    // 2. Aggregate mein ObjectId conversion zaroori hai
    if (
      doctorId &&
      doctorId !== "null" &&
      doctorId !== "undefined" &&
      mongoose.Types.ObjectId.isValid(doctorId)
    ) {
      filter.doctorId = new mongoose.Types.ObjectId(doctorId);
    }

    console.log(`📡 [API] Fetching dates for Doctor: ${doctorId || "Any"}`);

    const result = await Slot.aggregate([
      { $match: filter },
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dates = result.map((r) => ({ date: r._id, count: r.count }));
    console.log(`✅ [API] Found ${dates.length} dates`);

    res.json(dates);
  } catch (error) {
    console.error("❌ [API] getAvailableDates Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available slots (Doctor Specific or Any)
// @route   GET /api/public/:slug/slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, doctorId } = req.query;

    if (!date) return res.status(400).json({ message: "date required" });

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    let filter = {
      businessId: business._id,
      date: date,
      isBooked: false,
      isBlocked: false,
    };

    if (doctorId && doctorId !== "null" && doctorId !== "undefined") {
      filter.doctorId = doctorId;
    }

    console.log(`📡 [API] Fetching slots for Date: ${date}, Doctor: ${doctorId || 'Any'}`);

    const slots = await Slot.find(filter)
      .populate("doctorId", "name specialization")
      .sort({ startTime: 1 });

    console.log(`✅ [API] Found ${slots.length} slots`);
    res.json(slots);
  } catch (error) {
    console.error("❌ [API] getAvailableSlots Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book appointment (ATOMIC)
// @route   POST /api/public/:slug/book
export const bookAppointment = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      slotId,
      clientName,
      clientPhone,
      clientEmail,
      reason,
      customData = {},
    } = req.body;

    if (!slotId || !clientName || !clientPhone) {
      return res
        .status(400)
        .json({ message: "slotId, clientName, clientPhone required" });
    }

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    // Atomic slot reservation
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        businessId: business._id,
        isBooked: false,
        isBlocked: false,
      },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res
        .status(409)
        .json({ message: "Slot already booked or unavailable" });
    }

    // Holiday check
    const holiday = await Holiday.findOne({
      businessId: business._id,
      date: slot.date,
      $or: [{ doctorId: slot.doctorId }, { doctorId: null }],
    });
    if (holiday) {
      await Slot.findByIdAndUpdate(slot._id, { isBooked: false });
      return res.status(400).json({ message: "Clinic closed on this date" });
    }

    const cancelToken = crypto.randomBytes(20).toString("hex");

    try {
      const appointment = await Appointment.create({
        businessId: business._id,
        doctorId: slot.doctorId || null,
        slotId: slot._id,
        clientName,
        clientPhone,
        clientEmail: clientEmail || "",
        reason: reason || "",
        date: slot.date,
        time: slot.startTime,
        status: "pending",
        customData,
        cancelToken,
      });

      // Fire-and-forget notifications
      (async () => {
        try {
          const owner = await User.findById(business.ownerId);
          if (owner?.email) await sendOwnerNotification(business, appointment, owner.email);
          await sendClientNotification(business, appointment);
        } catch (e) {
          console.error("Notify error:", e.message);
        }
      })();

      return res.status(201).json({
        message: "Appointment booked!",
        appointment: {
          _id: appointment._id,
          date: appointment.date,
          time: appointment.time,
          clientName: appointment.clientName,
          status: appointment.status,
          cancelToken: appointment.cancelToken,
        },
      });
    } catch (err) {
      // Rollback
      await Slot.findByIdAndUpdate(slot._id, { isBooked: false });
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get by token
// @route   GET /api/public/manage/:token
export const getByToken = async (req, res) => {
  try {
    const appt = await Appointment.findOne({
      cancelToken: req.params.token,
    }).populate("businessId", "businessName slug labels");

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    const filter = {
      businessId: appt.businessId._id,
      date: { $gte: todayStr() },
      isBooked: false,
      isBlocked: false,
    };
    if (appt.doctorId) filter.doctorId = appt.doctorId;

    const availableSlots = await Slot.find(filter).sort({
      date: 1,
      startTime: 1,
    });

    res.json({
      appointment: {
        _id: appt._id,
        clientName: appt.clientName,
        date: appt.date,
        time: appt.time,
        status: appt.status,
        reason: appt.reason,
      },
      business: {
        name: appt.businessId.businessName,
        slug: appt.businessId.slug,
        labels: appt.businessId.labels,
      },
      availableSlots,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel by token
// @route   POST /api/public/manage/:token/cancel
export const cancelByToken = async (req, res) => {
  try {
    const appt = await Appointment.findOne({ cancelToken: req.params.token });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    if (appt.status === "cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    if (appt.date < todayStr())
      return res.status(400).json({ message: "Cannot cancel past appointment" });

    appt.status = "cancelled";
    await appt.save();

    await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });

    res.json({ message: "Appointment cancelled", appointment: appt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule by token (atomic)
// @route   POST /api/public/manage/:token/reschedule
export const rescheduleByToken = async (req, res) => {
  try {
    const { newSlotId } = req.body;

    const appt = await Appointment.findOne({ cancelToken: req.params.token });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    if (appt.status === "cancelled")
      return res.status(400).json({ message: "Cannot reschedule cancelled" });

    if (appt.date < todayStr())
      return res
        .status(400)
        .json({ message: "Cannot reschedule past appointment" });

    const newSlot = await Slot.findOneAndUpdate(
      { _id: newSlotId, isBooked: false, isBlocked: false },
      { isBooked: true },
      { new: true }
    );

    if (!newSlot)
      return res.status(400).json({ message: "New slot unavailable" });

    // Free old slot
    await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });

    appt.slotId = newSlot._id;
    appt.date = newSlot.date;
    appt.time = newSlot.startTime;
    appt.status = "pending";
    await appt.save();

    (async () => {
      try {
        const business = await Business.findById(appt.businessId);
        if (business && appt.clientEmail) {
          await sendRescheduleNotification(business, appt);
        }
      } catch (e) {
        console.error("Notify error:", e.message);
      }
    })();

    res.json({ message: "Rescheduled!", appointment: appt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


