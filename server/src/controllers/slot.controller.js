import Slot from "../models/Slot.js";
import Business from "../models/Business.js";

// Helper: date string "YYYY-MM-DD"
const formatDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Time "09:00" → minutes
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Minutes → "09:30"
const minutesToTime = (min) => {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
};

// @desc    Generate slots
// @route   POST /api/slots/generate
export const generateSlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const {
      days,
      startTime,
      endTime,
      duration,
      weeksAhead = 4,
      staffId = null,
    } = req.body;

    if (!days || !days.length || !startTime || !endTime || !duration) {
      return res
        .status(400)
        .json({ message: "days, startTime, endTime, duration required" });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      return res.status(400).json({ message: "End time must be after start" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slotsToCreate = [];

    for (let i = 0; i < weeksAhead * 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];

      if (!days.includes(dayName)) continue;

      const dateStr = formatDate(d);

      for (let t = startMin; t < endMin; t += duration) {
        slotsToCreate.push({
          businessId: business._id,
          staffId: staffId || null,
          day: dayName,
          date: dateStr,
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + duration),
          isBooked: false,
        });
      }
    }

    let created = 0;
    for (const slot of slotsToCreate) {
      try {
        await Slot.create(slot);
        created++;
      } catch (e) {
        // duplicate skip
      }
    }

    res.json({ message: `${created} slots created`, created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my slots (grouped by date)
// @route   GET /api/slots/my
// @desc    Get my slots
// @route   GET /api/slots/my
export const getMySlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { staffId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const filter = {
      businessId: business._id,
      date: { $gte: todayStr },
    };

    if (staffId) filter.staffId = staffId;

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });

    const grouped = {};
    slots.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    });

    res.json({ slots, grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all unbooked future slots
// @route   DELETE /api/slots/clear
export const clearSlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const result = await Slot.deleteMany({
      businessId: business._id,
      date: { $gte: todayStr },
      isBooked: false,
    });

    res.json({ message: `${result.deletedCount} slots deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate slots
// @route   POST /api/slots/generate
