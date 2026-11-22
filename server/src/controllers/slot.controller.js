import Holiday from "../models/Holiday.js";
import Slot from "../models/Slot.js";
import Business from "../models/Business.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Subscription from "../models/Subscription.js";
import { getPlanById } from "../config/planConfig.js";


const formatDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (min) => {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
};


export const generateSlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const {
      doctorId,
      weeksAhead = 4,
      days,
      startTime,
      endTime,
      duration,
      bufferTime = 0,
    } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId required" });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      businessId: business._id,
    });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // 🔒 SUBSCRIPTION PLAN SLOT LIMITS
    const subscription = await Subscription.findOne({ businessId: business._id });
    const isPlanActive = subscription && subscription.status === "active";
    const activePlan = getPlanById(isPlanActive ? subscription.plan : "free");

    const maxAllowedWeeks = activePlan.limits.maxWeeksAhead || 2;
    const maxFutureSlots = activePlan.limits.maxFutureSlotsPerBusiness || 100;

    const requestedWeeks = Math.min(Math.max(Number(weeksAhead) || 1, 1), 12);
    const parsedWeeks = Math.min(requestedWeeks, maxAllowedWeeks);
    const totalDays = parsedWeeks * 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const existingFutureSlotsCount = await Slot.countDocuments({
      businessId: business._id,
      date: { $gte: todayStr },
    });

    const remainingSlotQuota = maxFutureSlots - existingFutureSlotsCount;

    if (remainingSlotQuota <= 0) {
      return res.status(403).json({
        message: `You have reached your ${activePlan.name} plan limit of ${maxFutureSlots} future slots. Please upgrade your plan to generate more slots.`,
        code: "SLOT_LIMIT_REACHED",
        currentPlan: activePlan.id,
        maxFutureSlots,
        existingFutureSlotsCount,
      });
    }

    // Agar form se days + startTime + endTime + duration aaye hain, toh unhe priority do
    let availability = [];
    if (days && days.length > 0 && startTime && endTime && duration) {
      availability = days.map((day) => ({
        day,
        startTime,
        endTime,
        slotDuration: Number(duration),
        bufferTime: Number(bufferTime) || 0,
      }));
    } else if (doctor.availability && doctor.availability.length > 0) {
      availability = doctor.availability;
    } else {
      return res.status(400).json({
        message: "Please select days and slot timing or set doctor availability.",
      });
    }

    const holidays = await Holiday.find({
      businessId: business._id,
      $or: [{ doctorId: doctor._id }, { doctorId: null }],
    }).lean();
    const holidaySet = new Set(holidays.map((h) => h.date));

    const slotsToCreate = [];

    for (let i = 0; i < totalDays; i++) {
      if (slotsToCreate.length >= remainingSlotQuota) break;

      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateStr = formatDate(d);

      if (holidaySet.has(dateStr)) continue;
      if (days && days.length > 0 && !days.includes(dayName)) continue;

      const dayConfig = availability.find((a) => a.day === dayName);
      if (!dayConfig) continue;

      const startMin = timeToMinutes(dayConfig.startTime);
      const endMin = timeToMinutes(dayConfig.endTime);
      const slotDur = Number(dayConfig.slotDuration);
      const buffer = Number(dayConfig.bufferTime) || 0;
      const step = slotDur + buffer;

      if (step <= 0 || startMin >= endMin) continue;

      for (let t = startMin; t + slotDur <= endMin; t += step) {
        if (slotsToCreate.length >= remainingSlotQuota) break;

        slotsToCreate.push({
          businessId: business._id,
          doctorId: doctor._id,
          staffId: null,
          day: dayName,
          date: dateStr,
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + slotDur),
          isBooked: false,
          isBlocked: false,
        });
      }
    }

    if (slotsToCreate.length === 0) {
      return res.json({
        message: "No new slots to create for the selected criteria.",
        created: 0,
      });
    }

    const bulkOps = slotsToCreate.map((slot) => ({
      updateOne: {
        filter: {
          businessId: slot.businessId,
          staffId: slot.staffId,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
        },
        update: { $setOnInsert: slot },
        upsert: true,
      },
    }));

    const result = await Slot.bulkWrite(bulkOps, { ordered: false });

    const cappedByPlan =
      requestedWeeks > maxAllowedWeeks ||
      slotsToCreate.length >= remainingSlotQuota;

    res.json({
      message: `${result.upsertedCount} new slots created (existing skipped)${
        cappedByPlan ? ` — capped to ${activePlan.name} plan limits.` : "."
      }`,
      created: result.upsertedCount,
      appliedWeeks: parsedWeeks,
      plan: activePlan.id,
    });
  } catch (error) {
    console.error("❌ [generateSlots] FATAL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};




// @desc    Doctor generates their own slots
// @route   POST /api/slots/my-generate
export const generateMySlots = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    console.log("generate ", doctor)
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const businessId = doctor.businessId;
    if (!businessId) {
      return res.status(404).json({ message: "Business not associated with doctor" });
    }

    const {
      weeksAhead = 2,
      days,
      startTime,
      endTime,
      duration,
      bufferTime = 0,
    } = req.body;

    // Subscription plan slot limits
    const subscription = await Subscription.findOne({ businessId });
    const isPlanActive = subscription && subscription.status === "active";
    const activePlan = getPlanById(isPlanActive ? subscription.plan : "free");

    const maxAllowedWeeks = activePlan.limits.maxWeeksAhead || 2;
    const maxFutureSlots = activePlan.limits.maxFutureSlotsPerBusiness || 100;

    const requestedWeeks = Math.min(Math.max(Number(weeksAhead) || 1, 1), 12);
    const parsedWeeks = Math.min(requestedWeeks, maxAllowedWeeks);
    const totalDays = parsedWeeks * 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const existingFutureSlotsCount = await Slot.countDocuments({
      businessId,
      date: { $gte: todayStr },
    });

    const remainingSlotQuota = maxFutureSlots - existingFutureSlotsCount;
    if (remainingSlotQuota <= 0) {
      return res.status(403).json({
        message: `You have reached your ${activePlan.name} plan limit of ${maxFutureSlots} future slots.`,
        code: "SLOT_LIMIT_REACHED",
      });
    }

    let availability = [];
    if (days && days.length > 0 && startTime && endTime && duration) {
      availability = days.map((day) => ({
        day,
        startTime,
        endTime,
        slotDuration: Number(duration),
        bufferTime: Number(bufferTime) || 0,
      }));
    } else if (doctor.availability && doctor.availability.length > 0) {
      availability = doctor.availability;
    } else {
      return res.status(400).json({
        message: "Please select days, start/end time, and duration.",
      });
    }

    const holidays = await Holiday.find({
      businessId,
      $or: [{ doctorId: doctor._id }, { doctorId: null }],
    }).lean();
    const holidaySet = new Set(holidays.map((h) => h.date));

    const slotsToCreate = [];

    for (let i = 0; i < totalDays; i++) {
      if (slotsToCreate.length >= remainingSlotQuota) break;

      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateStr = formatDate(d);

      if (holidaySet.has(dateStr)) continue;
      if (days && days.length > 0 && !days.includes(dayName)) continue;

      const dayConfig = availability.find((a) => a.day === dayName);
      if (!dayConfig) continue;

      const startMin = timeToMinutes(dayConfig.startTime);
      const endMin = timeToMinutes(dayConfig.endTime);
      const slotDur = Number(dayConfig.slotDuration);
      const buffer = Number(dayConfig.bufferTime) || 0;
      const step = slotDur + buffer;

      if (step <= 0 || startMin >= endMin) continue;

      for (let t = startMin; t + slotDur <= endMin; t += step) {
        if (slotsToCreate.length >= remainingSlotQuota) break;

        slotsToCreate.push({
          businessId,
          doctorId: doctor._id,
          staffId: null,
          day: dayName,
          date: dateStr,
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + slotDur),
          isBooked: false,
          isBlocked: false,
        });
      }
    }

    if (slotsToCreate.length === 0) {
      return res.json({
        message: "No new slots to create for the selected criteria.",
        created: 0,
      });
    }

    const bulkOps = slotsToCreate.map((slot) => ({
      updateOne: {
        filter: {
          businessId: slot.businessId,
          staffId: slot.staffId,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
        },
        update: { $setOnInsert: slot },
        upsert: true,
      },
    }));

    const result = await Slot.bulkWrite(bulkOps, { ordered: false });

    res.json({
      message: `${result.upsertedCount} new slots created.`,
      created: result.upsertedCount,
      appliedWeeks: parsedWeeks,
    });
  } catch (error) {
    console.error("❌ [generateMySlots] ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
export const getMySlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { doctorId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const filter = { businessId: business._id, date: { $gte: todayStr } };
    if (doctorId) filter.doctorId = doctorId;

    const slots = await Slot.find(filter)
      .populate("doctorId", "name specialization")
      .sort({ date: 1, startTime: 1 });

    const grouped = {};
    slots.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    });

    res.json({ slots, grouped });
  } catch (error) {
    console.error("❌ [getMySlots] ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const clearSlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { doctorId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const filter = {
      businessId: business._id,
      date: { $gte: todayStr },
      isBooked: false,
    };
    if (doctorId) filter.doctorId = doctorId;

    const result = await Slot.deleteMany(filter);
    res.json({ message: `${result.deletedCount} slots deleted` });
  } catch (error) {
    console.error("❌ [clearSlots] ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Generate slots
// @route   POST /api/slots/generate
export const generateDoctorSlots = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { doctorId, weeksAhead = 4 } = req.body;

    const doctor = await Doctor.findOne({ _id: doctorId, businessId: business._id });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (!doctor.availability?.length) {
      return res.status(400).json({ message: "Doctor availability not set" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotsToCreate = [];

    for (let i = 0; i < weeksAhead * 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateStr = formatDate(d);

      const dayConfig = doctor.availability.find((a) => a.day === dayName);
      if (!dayConfig) continue;

      const startMin = timeToMinutes(dayConfig.startTime);
      const endMin = timeToMinutes(dayConfig.endTime);
      const step = dayConfig.slotDuration + (dayConfig.bufferTime || 0);

      for (let t = startMin; t + dayConfig.slotDuration <= endMin; t += step) {
        slotsToCreate.push({
          businessId: business._id,
          doctorId: doctor._id,
          date: dateStr,
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + dayConfig.slotDuration),
          isBooked: false,
          isBlocked: false,
        });
      }
    }

    // ⚡ bulk insert with duplicate skip
    let created = 0;
    if (slotsToCreate.length) {
      const result = await Slot.insertMany(slotsToCreate, { ordered: false }).catch(
        (e) => e
      );
      created = Array.isArray(result) ? result.length : result?.insertedCount || 0;
    }

    res.json({ message: `${created} slots created`, created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Get doctor's own schedule for a specific date
// @route   GET /api/slots/my-schedule
export const getDoctorSchedule = async (req, res) => {
  console.log("\n========== 🚀 GET DOCTOR SCHEDULE START ==========");
  console.log("📥 [getDoctorSchedule] Query:", req.query, "| User:", req.user?._id || req.user?.id);

  try {
    const userId = req.user?._id || req.user?.id;

    // 1. Find doctor by logged-in user
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      console.warn("⚠️ [getDoctorSchedule] Doctor profile not found for userId:", userId);
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    console.log("✅ [getDoctorSchedule] Doctor Found:", doctor.name, "| ID:", doctor._id);

    // 2. Aaj ki local date aur future ke saare available dates nikalo
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const availableDates = await Slot.distinct("date", {
      doctorId: doctor._id,
      date: { $gte: todayStr },
      isBlocked: false,
    });
    availableDates.sort();
    console.log("📅 [getDoctorSchedule] Doctor's Available Dates:", availableDates);

    // 3. Agar query mein date nahi aayi, to aaj ki date ya next available date select karo
    let targetDate = req.query.date;
    if (!targetDate) {
      targetDate = availableDates.includes(todayStr)
        ? todayStr
        : availableDates[0] || todayStr;
      console.log("🎯 [getDoctorSchedule] Auto-selected targetDate:", targetDate);
    }

    // 4. Get all slots for targetDate
    const slots = await Slot.find({
      doctorId: doctor._id,
      date: targetDate,
      isBlocked: false,
    }).sort({ startTime: 1 });
    console.log(`📦 [getDoctorSchedule] Slots found for ${targetDate}:`, slots.length);

    // 5. Fetch appointments for these slots
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: targetDate,
      status: { $ne: "cancelled" },
    });
    console.log(`📋 [getDoctorSchedule] Appointments found for ${targetDate}:`, appointments.length);

    // 6. Map appointments to slots
    const schedule = slots.map((slot) => {
      const appt = appointments.find(
        (a) => a.slotId && a.slotId.toString() === slot._id.toString()
      );
      return {
        slotId: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
        patient: appt
          ? {
              id: appt._id,
              name: appt.clientName,
              phone: appt.clientPhone,
              reason: appt.reason,
              status: appt.status,
            }
          : null,
      };
    });

    console.log("========== 🏁 GET DOCTOR SCHEDULE END ==========\n");

    res.json({
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
      activeDate: targetDate,
      availableDates,
      schedule,
    });
  } catch (error) {
    console.error("❌ [getDoctorSchedule] ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};








const CHUNK_SIZE = 500;

const FULL_TO_SHORT_DAY = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

const normalizeDay = (d) =>
  FULL_TO_SHORT_DAY[String(d || "").trim().toLowerCase()] || d;

export const generateSlotByDocter = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const doctor =
      (await Doctor.findOne({ userId })) ||
      (req.user?.doctorId ? await Doctor.findById(req.user.doctorId) : null);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const businessId = doctor.businessId;
    if (!businessId) {
      return res
        .status(404)
        .json({ message: "Business not associated with doctor" });
    }

    const {
      weeksAhead = 2,
      days,
      startTime,
      endTime,
      duration,
      bufferTime = 0,
    } = req.body;

    const normalizedDays = Array.isArray(days)
      ? days.map(normalizeDay).filter(Boolean)
      : [];

    const subscription = await Subscription.findOne({ businessId });
    const isPlanActive = subscription && subscription.status === "active";
    const activePlan = getPlanById(isPlanActive ? subscription.plan : "free");

    const maxAllowedWeeks = activePlan.limits.maxWeeksAhead || 2;
    const maxFutureSlots = activePlan.limits.maxFutureSlotsPerBusiness || 100;

    const requestedWeeks = Math.min(Math.max(Number(weeksAhead) || 1, 1), 12);
    const parsedWeeks = Math.min(requestedWeeks, maxAllowedWeeks);
    const totalDays = parsedWeeks * 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const existingFutureSlotsCount = await Slot.countDocuments({
      businessId,
      date: { $gte: todayStr },
    });

    const remainingSlotQuota = maxFutureSlots - existingFutureSlotsCount;
    if (remainingSlotQuota <= 0) {
      return res.status(403).json({
        message: `You have reached your ${activePlan.name} plan limit of ${maxFutureSlots} future slots.`,
        code: "SLOT_LIMIT_REACHED",
      });
    }

    let availability = [];
    if (normalizedDays.length > 0 && startTime && endTime && duration) {
      availability = normalizedDays.map((day) => ({
        day,
        startTime,
        endTime,
        slotDuration: Number(duration),
        bufferTime: Number(bufferTime) || 0,
      }));
    } else if (Array.isArray(doctor.availability) && doctor.availability.length > 0) {
      availability = doctor.availability.map((a) => ({
        ...a,
        day: normalizeDay(a.day),
      }));
    } else {
      return res.status(400).json({
        message: "Please select days, start/end time, and duration.",
      });
    }

    const holidays = await Holiday.find({
      businessId,
      $or: [{ doctorId: doctor._id }, { doctorId: null }],
    }).lean();
    const holidaySet = new Set(holidays.map((h) => h.date));

    const slotsToCreate = [];

    for (let i = 0; i < totalDays; i++) {
      if (slotsToCreate.length >= remainingSlotQuota) break;

      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()]; // "Sun", "Mon", ...
      const dateStr = formatDate(d);

      if (holidaySet.has(dateStr)) continue;
      if (normalizedDays.length > 0 && !normalizedDays.includes(dayName)) continue;

      const dayConfig = availability.find((a) => a.day === dayName);
      if (!dayConfig) continue;

      const startMin = timeToMinutes(dayConfig.startTime);
      const endMin = timeToMinutes(dayConfig.endTime);
      const slotDur = Number(dayConfig.slotDuration);
      const buffer = Number(dayConfig.bufferTime) || 0;
      const step = slotDur + buffer;

      if (step <= 0 || startMin >= endMin) continue;

      for (let min = startMin; min + slotDur <= endMin; min += step) {
        if (slotsToCreate.length >= remainingSlotQuota) break;

        slotsToCreate.push({
          businessId,
          doctorId: doctor._id,
          staffId: null,
          day: dayName,
          date: dateStr,
          startTime: minutesToTime(min),
          endTime: minutesToTime(min + slotDur),
          isBooked: false,
          isBlocked: false,
        });
      }
    }

    if (slotsToCreate.length === 0) {
      return res.json({
        message: "No new slots to create for the selected criteria.",
        created: 0,
      });
    }

    const bulkOps = slotsToCreate.map((slot) => ({
      updateOne: {
        filter: {
          businessId: slot.businessId,
          staffId: slot.staffId,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
        },
        update: { $setOnInsert: slot },
        upsert: true,
      },
    }));

    let upsertedCount = 0;
    for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
      const chunk = bulkOps.slice(i, i + CHUNK_SIZE);
      const chunkResult = await Slot.bulkWrite(chunk, { ordered: false });
      upsertedCount += chunkResult.upsertedCount || 0;
    }

    return res.json({
      message: `${upsertedCount} new slots created.`,
      created: upsertedCount,
      appliedWeeks: parsedWeeks,
    });
  } catch (error) {
    console.error("❌ [generateSlotByDocter] ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};