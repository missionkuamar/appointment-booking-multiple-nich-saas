import crypto from "crypto";
import Business from "../models/Business.js";
import Slot from "../models/Slot.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import {
  sendOwnerNotification,
  sendClientNotification,
  sendRescheduleNotification,
} from "../services/notify.service.js";

// @desc    Get business by slug
// @route   GET /api/public/:slug
export const getBusinessBySlug = async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    // Get active staff
    const staff = await User.find({
      businessId: business._id,
      role: "staff",
      isActive: true,
    }).select("name staffTitle _id");

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
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available dates
// @route   GET /api/public/:slug/dates
export const getAvailableDates = async (req, res) => {
  try {
    const { slug } = req.params;
    const { staffId } = req.query;

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const filter = {
      businessId: business._id,
      date: { $gte: todayStr },
      isBooked: false,
    };

    if (staffId) filter.staffId = staffId;

    const slots = await Slot.find(filter);

    const dateCount = {};
    slots.forEach((s) => {
      dateCount[s.date] = (dateCount[s.date] || 0) + 1;
    });

    const dates = Object.keys(dateCount)
      .sort()
      .map((date) => ({ date, count: dateCount[date] }));

    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available slots for date
// @route   GET /api/public/:slug/slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, staffId } = req.query;

    if (!date) return res.status(400).json({ message: "date required" });

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const filter = { businessId: business._id, date, isBooked: false };
    if (staffId) filter.staffId = staffId;

    const slots = await Slot.find(filter)
      .populate("staffId", "name staffTitle")
      .sort({ startTime: 1 });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book appointment
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

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.isBooked)
      return res.status(400).json({ message: "Slot already booked" });

    // Generate cancel token
    const cancelToken = crypto.randomBytes(20).toString("hex");

    const appointment = await Appointment.create({
      businessId: business._id,
      staffId: slot.staffId || null,
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

    slot.isBooked = true;
    await slot.save();

    // Notifications
    const owner = await User.findById(business.ownerId);
    if (owner?.email) {
      sendOwnerNotification(business, appointment, owner.email);
    }
    sendClientNotification(business, appointment);

    res.status(201).json({
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointment by cancel token
// @route   GET /api/public/manage/:token
export const getByToken = async (req, res) => {
  try {
    const appt = await Appointment.findOne({
      cancelToken: req.params.token,
    }).populate("businessId", "businessName slug labels");

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Get available slots (for reschedule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const filter = {
      businessId: appt.businessId._id,
      date: { $gte: todayStr },
      isBooked: false,
    };
    if (appt.staffId) filter.staffId = appt.staffId;

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

// @desc    Cancel appointment by token
// @route   POST /api/public/manage/:token/cancel
export const cancelByToken = async (req, res) => {
  try {
    const appt = await Appointment.findOne({ cancelToken: req.params.token });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    if (appt.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appt.status = "cancelled";
    await appt.save();

    await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });

    res.json({ message: "Appointment cancelled", appointment: appt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule appointment by token
// @route   POST /api/public/manage/:token/reschedule
export const rescheduleByToken = async (req, res) => {
  try {
    const { newSlotId } = req.body;

    const appt = await Appointment.findOne({ cancelToken: req.params.token });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    if (appt.status === "cancelled") {
      return res.status(400).json({ message: "Cannot reschedule cancelled" });
    }

    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) return res.status(404).json({ message: "New slot not found" });
    if (newSlot.isBooked)
      return res.status(400).json({ message: "New slot already booked" });

    // Free old slot
    await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });

    // Book new slot
    newSlot.isBooked = true;
    await newSlot.save();

    // Update appointment
    appt.slotId = newSlot._id;
    appt.date = newSlot.date;
    appt.time = newSlot.startTime;
    appt.status = "pending";
    await appt.save();

    // Notify
    const business = await Business.findById(appt.businessId);
    if (business && appt.clientEmail) {
      sendRescheduleNotification(business, appt);
    }

    res.json({ message: "Rescheduled!", appointment: appt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};