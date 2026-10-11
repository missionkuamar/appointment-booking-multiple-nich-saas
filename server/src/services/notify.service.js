import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Owner notification
export const sendOwnerNotification = async (
  business,
  appointment,
  ownerEmail
) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
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
            ${
              appointment.reason
                ? `<p><strong>Reason:</strong> ${appointment.reason}</p>`
                : ""
            }
          </div>
        </div>
      `,
    });
    console.log("✅ Owner notification sent");
  } catch (error) {
    console.error("❌ Owner email error:", error.message);
  }
};

// Client notification with cancel/reschedule link
export const sendClientNotification = async (business, appointment) => {
  if (!appointment.clientEmail) return;

  try {
    const transporter = createTransporter();
    const manageLink = `${CLIENT_URL}/manage/${appointment.cancelToken}`;

    await transporter.sendMail({
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
            <a href="${manageLink}" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Manage Appointment
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">
            Need to cancel or reschedule? Click above.
          </p>
        </div>
      `,
    });
    console.log("✅ Client notification sent");
  } catch (error) {
    console.error("❌ Client email error:", error.message);
  }
};

// Reschedule notification
export const sendRescheduleNotification = async (business, appointment) => {
  try {
    const transporter = createTransporter();
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
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Reschedule email error:", error.message);
  }
};