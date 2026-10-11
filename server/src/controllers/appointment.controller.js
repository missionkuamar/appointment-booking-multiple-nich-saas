import Appointment from "../models/Appointment.js";
import Business from "../models/Business.js";
import Slot from "../models/Slot.js";

// @desc    Get my appointments
// @route   GET /api/appointments/my
export const getMyAppointments = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { status, staffId } = req.query;

    const filter = { businessId: business._id };
    if (status && status !== "all") filter.status = status;
    if (staffId) filter.staffId = staffId;

    const appointments = await Appointment.find(filter)
      .populate("staffId", "name staffTitle")
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/appointments/stats
export const getStats = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    // This week (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = formatDate(weekAgo);

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = formatDate(monthStart);

    const [todayCount, weekCount, monthCount, pendingCount, totalCount] =
      await Promise.all([
        Appointment.countDocuments({
          businessId: business._id,
          date: todayStr,
          status: { $ne: "cancelled" },
        }),
        Appointment.countDocuments({
          businessId: business._id,
          date: { $gte: weekAgoStr },
          status: { $ne: "cancelled" },
        }),
        Appointment.countDocuments({
          businessId: business._id,
          date: { $gte: monthStartStr },
          status: { $ne: "cancelled" },
        }),
        Appointment.countDocuments({
          businessId: business._id,
          status: "pending",
        }),
        Appointment.countDocuments({
          businessId: business._id,
          status: { $ne: "cancelled" },
        }),
      ]);

    // Last 7 days trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const count = await Appointment.countDocuments({
        businessId: business._id,
        date: dateStr,
        status: { $ne: "cancelled" },
      });
      trend.push({ date: dateStr, count });
    }

    res.json({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      pending: pendingCount,
      total: totalCount,
      trend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id
export const updateAppointment = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { status, notes } = req.body;

    const appt = await Appointment.findOne({
      _id: req.params.id,
      businessId: business._id,
    });

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    if (status) appt.status = status;
    if (notes !== undefined) appt.notes = notes;

    await appt.save();

    if (status === "cancelled") {
      await Slot.findByIdAndUpdate(appt.slotId, { isBooked: false });
    }

    res.json(appt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};