import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import slotRoutes from "./routes/slot.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import publicRoutes from "./routes/public.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";
import { startReminderJob } from "./jobs/reminder.job.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import planRoutes from "./routes/plan.routes.js";
import affiliateRoutes from "./affiliate/affiliate.routes.js";
import session from "express-session";
import adminRouter from "./routes/admin.routes.js"
import adminRoutes from "./routes/admin.routes.js";



const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);
// Public affiliate redirect route MUST be before other routes
// This handles /r/:slug redirects
app.get('/r/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { ref } = req.query;

    // console.log("\n");
    // console.log("==============================================");
    // console.log("🌐 GET /r/:slug HIT");
    // console.log("==============================================");

    // console.log("📍 Full URL:", req.originalUrl);
    // console.log("📍 Method:", req.method);
    // console.log("📍 Slug:", slug);
    // console.log("📍 Ref:", ref);
    // console.log("📍 IP:", req.ip);
    // console.log(
    //   "📍 User-Agent:",
    //   req.headers["user-agent"]
    // );

    // console.log(
    //   "🍪 Session ID:",
    //   req.sessionID || "NO SESSION"
    // );

    // console.log(
    //   "🍪 Session affiliateReferral:",
    //   req.session?.affiliateReferral || "NONE"
    // );

    // console.log(
    //   "📦 Importing trackAffiliateClick..."
    // );

    const {
      trackAffiliateClick
    } = await import(
      './affiliate/affiliate.controllers.js'
    );

    console.log(
      "✅ trackAffiliateClick imported"
    );

    console.log(
      "🚀 Calling trackAffiliateClick..."
    );

    return trackAffiliateClick(req, res);

  } catch (error) {

    console.error(
      "\n❌ AFFILIATE ROUTE ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "URL:",
      req.originalUrl
    );

    console.error(
      "Params:",
      req.params
    );

    console.error(
      "Query:",
      req.query
    );

    return res.redirect('/');
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Appointment SaaS API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api", adminRouter);
app.use("/api/admin", adminRoutes);






app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

startReminderJob();

export default app;