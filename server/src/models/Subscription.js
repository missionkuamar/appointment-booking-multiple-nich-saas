import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "active",
        "authenticated",
        "past_due",
        "halted",
        "cancelled",
        "expired",
      ],
      default: "active",
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    // Razorpay fields (optional for free plan)
    razorpaySubscriptionId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPlanId: {
      type: String,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ek business ka ek primary subscription record
subscriptionSchema.index({ businessId: 1 }, { unique: true });

export default mongoose.model("Subscription", subscriptionSchema);