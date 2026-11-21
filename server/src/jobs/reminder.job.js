import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import Business from "../models/Business.js";
import { sendReminderEmail } from "../services/notify.service.js";

const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const startReminderJob = () => {
  // Every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      const check = async (target, flag) => {
        const dateStr = formatDate(target);
        const timeStr = target.toTimeString().slice(0, 5);

        const appts = await Appointment.find({
          date: dateStr,
          time: timeStr,
          status: "confirmed",
          [`reminders.${flag}`]: false,
          clientEmail: { $ne: "" },
        });

        for (const appt of appts) {
          const business = await Business.findById(appt.businessId);
          try {
            await sendReminderEmail(business, appt, flag);
            appt.reminders[flag] = true;
            await appt.save();
          } catch (e) {
            console.error("Reminder fail:", e.message);
          }
        }
      };

      await check(in24h, "sent24h");
      await check(in1h, "sent1h");
    } catch (err) {
      console.error("Reminder job error:", err);
    }
  });
};