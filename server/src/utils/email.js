import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[email.js] SMTP credentials missing in .env (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged to console in dev mode."
    );
    return null;
  }

  const port = Number(SMTP_PORT) || 587;
  const secure =
    typeof SMTP_SECURE === "string"
      ? SMTP_SECURE === "true"
      : port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    console.warn("[email.js] Missing recipient 'to' address. Skipping sendEmail.");
    return { skipped: true };
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    '"Appointment Booking" <no-reply@example.com>';

  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    // console.log("[email.js][DEV PREVIEW]", {
    //   from,
    //   to,
    //   subject,
    //   text,
    // });
    return { previewOnly: true };
  }

  const info = await activeTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  // console.log("[email.js] Email sent:", {
  //   messageId: info.messageId,
  //   to,
  //   subject,
  // });

  return info;
};

export default sendEmail;