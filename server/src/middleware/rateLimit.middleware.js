import rateLimit from "express-rate-limit";

export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 bookings per IP per 15 min
  message: { message: "Too many booking attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60, // 60 req/min for public reads
});