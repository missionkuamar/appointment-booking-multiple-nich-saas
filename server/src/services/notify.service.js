// services/notify.service.js
import nodemailer from "nodemailer";
import Appointment from "../models/Appointment.js";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// 1. Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. 🔴 Connection Verification on Startup
transporter.verify((error, success) => {
  if (error) {
    console.error("\n❌ ================= SMTP CONNECTION FAILED ================= ❌");
    console.error("Gmail server se connect nahi ho paya. Check karo:");
    console.error("1. Kya EMAIL_USER .env mein sahi hai?");
    console.error("2. Kya EMAIL_PASS mein 16-digit App Password daala hai? (Normal password nahi chalega)");
    console.error("Error Details:", error.message);
    console.error("===============================================================\n");
  } else {
    console.log("\n✅ ================= SMTP CONNECTED ================= ✅");
    console.log("Gmail server is ready to send emails!");
    console.log("=====================================================\n");
  }
});

// 3. Helper: Update DB Status
const updateNotificationStatus = async (appointmentId, field, status) => {
  try {
    await Appointment.findByIdAndUpdate(appointmentId, {
      [`notificationStatus.${field}`]: status,
    });
  } catch (err) {
    console.error("DB Status update failed:", err.message);
  }
};

// ─────────────────────────────────────────────
// 4. OWNER NOTIFICATION (new booking)
// ─────────────────────────────────────────────
export const sendOwnerNotification = async (business, appointment, ownerEmail) => {
  try {
    console.log(`\n📡 [Email] Sending Owner Notification to: ${ownerEmail}...`);
    
    const info = await transporter.sendMail({
      from: `"BookEasy" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `🎉 New Appointment - ${appointment.clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Appointment Booked!</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <p><strong>Business:</strong> ${business.businessName}</p>
            <p><strong>Client:</strong> ${appointment.clientName}</p>
            <p><strong>Phone:</strong> ${appointment.clientPhone}</p>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ""}
          </div>
        </div>
      `,
    });

    await updateNotificationStatus(appointment._id, "owner", "sent");
    console.log(`✅ [Email] Owner Notification Sent! (ID: ${info.messageId})`);
  } catch (error) {
    await updateNotificationStatus(appointment._id, "owner", "failed");
    console.error(`❌ [Email] Owner Notification Failed! Reason: ${error.message}`);
  }
};

// ─────────────────────────────────────────────
// 5. CLIENT NOTIFICATION (booking confirmation)
// ─────────────────────────────────────────────
export const sendClientNotification = async (business, appointment) => {
  if (!appointment.clientEmail) {
    console.log("⏭️ [Email] Client email skipped (Email not provided by user)");
    return;
  }

  try {
    console.log(`📡 [Email] Sending Client Notification to: ${appointment.clientEmail}...`);
    const manageLink = `${CLIENT_URL}/manage/${appointment.cancelToken}`;

    const info = await transporter.sendMail({
      from: `"${business.businessName}" <${process.env.EMAIL_USER}>`,
      to: appointment.clientEmail,
      subject: `✅ Appointment Confirmed - ${business.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Your Appointment is Booked!</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <p><strong>${business.businessName}</strong></p>
            ${business.address ? `<p>${business.address}</p>` : ""}
            ${business.phone ? `<p>📞 ${business.phone}</p>` : ""}
            <hr/>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            <p><strong>Name:</strong> ${appointment.clientName}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${manageLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Manage Appointment
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">
            Need to cancel or reschedule? Click above.
          </p>
        </div>
      `,
    });

    await updateNotificationStatus(appointment._id, "client", "sent");
    console.log(`✅ [Email] Client Notification Sent! (ID: ${info.messageId})`);
  } catch (error) {
    await updateNotificationStatus(appointment._id, "client", "failed");
    console.error(`❌ [Email] Client Notification Failed! Reason: ${error.message}`);
  }
};

// ─────────────────────────────────────────────
// 6. RESCHEDULE NOTIFICATION
// ─────────────────────────────────────────────
export const sendRescheduleNotification = async (business, appointment) => {
  if (!appointment.clientEmail) return;

  try {
    console.log(`📡 [Email] Sending Reschedule Notification to: ${appointment.clientEmail}...`);
    const manageLink = `${CLIENT_URL}/manage/${appointment.cancelToken}`;

    await transporter.sendMail({
      from: `"${business.businessName}" <${process.env.EMAIL_USER}>`,
      to: appointment.clientEmail,
      subject: `🔄 Appointment Rescheduled - ${business.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Appointment Rescheduled</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <p><strong>New Date:</strong> ${appointment.date}</p>
            <p><strong>New Time:</strong> ${appointment.time}</p>
            <p><strong>Name:</strong> ${appointment.clientName}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${manageLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View Appointment
            </a>
          </div>
        </div>
      `,
    });
    console.log("✅ [Email] Reschedule Notification Sent!");
  } catch (error) {
    console.error(`❌ [Email] Reschedule Notification Failed! Reason: ${error.message}`);
  }
};

// ─────────────────────────────────────────────
// 7. REMINDER EMAIL (24h / 1h)
// ─────────────────────────────────────────────
export const sendReminderEmail = async (business, appointment, flag) => {
  if (!appointment.clientEmail) return;

  const is24h = flag === "sent24h";
  const label = is24h ? "24 hours" : "1 hour";
  const emoji = is24h ? "⏰" : "🔔";
  const manageLink = `${CLIENT_URL}/manage/${appointment.cancelToken}`;

  try {
    console.log(`📡 [Email] Sending ${label} Reminder to: ${appointment.clientEmail}...`);
    
    await transporter.sendMail({
      from: `"${business.businessName}" <${process.env.EMAIL_USER}>`,
      to: appointment.clientEmail,
      subject: `${emoji} Reminder: Appointment in ${label} - ${business.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">${emoji} Appointment Reminder</h2>
          <p>Hi <strong>${appointment.clientName}</strong>,</p>
          <p>This is a friendly reminder that your appointment with <strong>${business.businessName}</strong> is in <strong>${label}</strong>.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
          </div>
        </div>
      `,
    });
    console.log(`✅ [Email] Reminder (${label}) Sent!`);
  } catch (error) {
    console.error(`❌ [Email] Reminder Failed! Reason: ${error.message}`);
    throw error; 
  }
};



// ─────────────────────────────────────────────
// 8. APPOINTMENT UPDATE NOTIFICATION (status / notes change)
// ─────────────────────────────────────────────
export const sendAppointmentUpdateNotification = async (
  business,
  appointment,
  previousStatus
) => {
  if (!appointment?.clientEmail) {
    console.log("⏭️ [Email] Update email skipped (Client email not provided)");
    return;
  }

  const statusText = String(appointment.status || "updated");
  const statusUpper = statusText.toUpperCase();
  const manageLink = appointment.cancelToken
    ? `${CLIENT_URL}/manage/${appointment.cancelToken}`
    : `${CLIENT_URL}/book/${business.slug}`;

  try {
    console.log(
      `📡 [Email] Sending Update Notification (${statusUpper}) to: ${appointment.clientEmail}...`
    );

    const info = await transporter.sendMail({
      from: `"${business.businessName}" <${process.env.EMAIL_USER}>`,
      to: appointment.clientEmail,
      subject: `📌 Appointment ${statusUpper} - ${business.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Appointment ${statusUpper}</h2>
          <p>Hi <strong>${appointment.clientName}</strong>,</p>
          <p>Your appointment status has been updated${
            previousStatus && previousStatus !== statusText
              ? ` from <strong>${previousStatus}</strong>`
              : ""
          } to <strong>${statusUpper}</strong>.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Business:</strong> ${business.businessName}</p>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            <p><strong>Status:</strong> ${statusUpper}</p>
            ${
              appointment.notes
                ? `<p><strong>Notes:</strong> ${appointment.notes}</p>`
                : ""
            }
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${manageLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Manage Appointment
            </a>
          </div>
        </div>
      `,
    });

    console.log(
      `✅ [Email] Update Notification (${statusUpper}) Sent! (ID: ${info.messageId})`
    );
  } catch (error) {
    console.error(
      `❌ [Email] Update Notification Failed! Reason: ${error.message}`
    );
  }
};