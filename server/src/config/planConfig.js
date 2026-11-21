export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Starter plan active immediately after signup/login",
    price: 0, // INR
    currency: "INR",
    period: "monthly",
    interval: 1,
    isFree: true,
    features: [
      "Up to 1 Doctor",
      "1 Staff Account",
      "30 Appointments / month",
      "Public booking page",
      "Basic email notifications",
    ],
    limits: {
      maxDoctors: 1,
      maxStaff: 1,
      maxAppointmentsPerMonth: 30,
      customFields: false,
      walkInBooking: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    razorpayPlanId: null,
    popular: false,
  },

  basic: {
    id: "basic",
    name: "Basic",
    description: "Perfect for solo doctors & small clinics",
    price: 499, // INR
    currency: "INR",
    period: "monthly",
    interval: 1,
    isFree: false,
    features: [
      "Up to 2 Doctors",
      "2 Front-Desk Staff Accounts",
      "150 Appointments / month",
      "Public booking page",
      "Email notifications",
      "Basic reports",
    ],
    limits: {
      maxDoctors: 2,
      maxStaff: 2,
      maxAppointmentsPerMonth: 150,
      customFields: false,
      walkInBooking: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    razorpayPlanId: process.env.RAZORPAY_PLAN_BASIC || null,
    popular: false,
  },

  pro: {
    id: "pro",
    name: "Pro",
    description: "Best for growing clinics & polyclinics",
    price: 1999, // INR
    currency: "INR",
    period: "monthly",
    interval: 1,
    isFree: false,
    features: [
      "Up to 10 Doctors",
      "8 Staff Accounts",
      "1,000 Appointments / month",
      "Custom booking fields",
      "Walk-in / Emergency bookings",
      "Advanced analytics",
      "Priority email support",
    ],
    limits: {
      maxDoctors: 10,
      maxStaff: 8,
      maxAppointmentsPerMonth: 1000,
      customFields: true,
      walkInBooking: true,
      prioritySupport: true,
      whiteLabel: false,
    },
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO || null,
    popular: true,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For multi-specialty hospitals & large centers",
    price: 4999, // INR
    currency: "INR",
    period: "monthly",
    interval: 1,
    isFree: false,
    features: [
      "Up to 50 Doctors",
      "30 Reception & Coordinator Staff",
      "Unlimited Appointments",
      "Custom booking fields",
      "Walk-in / Emergency bookings",
      "White-label booking page",
      "24/7 WhatsApp & Dedicated support",
    ],
    limits: {
      maxDoctors: 50,
      maxStaff: 30,
      maxAppointmentsPerMonth: 999999,
      customFields: true,
      walkInBooking: true,
      prioritySupport: true,
      whiteLabel: true,
    },
    razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE || null,
    popular: false,
  },
};

export const getPlanById = (planId) => {
  return PLANS[planId] || PLANS.free;
};

export const getPlanByRazorpayId = (razorpayPlanId) => {
  return Object.values(PLANS).find((p) => p.razorpayPlanId === razorpayPlanId) || null;
};