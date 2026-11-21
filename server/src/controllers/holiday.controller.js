import Holiday from "../models/Holiday.js";
import Business from "../models/Business.js";
import Slot from "../models/Slot.js";

export const addHoliday = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { date, reason, doctorId } = req.body;
    if (!date) return res.status(400).json({ message: "date required" });

    const holiday = await Holiday.create({
      businessId: business._id,
      doctorId: doctorId || null,
      date,
      reason: reason || "",
    });

    // Block all unbooked slots on that date
    const filter = { businessId: business._id, date, isBooked: false };
    if (doctorId) filter.doctorId = doctorId;
    await Slot.updateMany(filter, { isBlocked: true });

    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHolidays = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const holidays = await Holiday.find({ businessId: business._id })
      .populate("doctorId", "name")
      .sort({ date: 1 });

    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const holiday = await Holiday.findOneAndDelete({
      _id: req.params.id,
      businessId: business._id,
    });
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });

    // Unblock slots
    const filter = {
      businessId: business._id,
      date: holiday.date,
      isBooked: false,
    };
    if (holiday.doctorId) filter.doctorId = holiday.doctorId;
    await Slot.updateMany(filter, { isBlocked: false });

    res.json({ message: "Holiday removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};