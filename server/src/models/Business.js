import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessType: {
      type: String,
      enum: ["clinic", "salon", "tutor", "physio", "lawyer", "other"],
      required: true,
    },
    businessName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    labels: {
      clientLabel: { type: String, default: "Client" },
      serviceLabel: { type: String, default: "Service" },
    },
    razorpaySubscriptionId: { type: String, default: null },
subscriptionPlan: { type: String, enum: ["basic", "pro", "enterprise", null], default: null },
subscriptionStatus: { 
  type: String, 
  enum: ["created", "active", "cancelled", "expired", "halted"], 
  default: null 
},
subscriptionEndDate: { type: Date, default: null },

    // Custom fields for booking form
    customFields: [
      {
        label: { type: String, required: true },
        key: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "number", "email", "tel", "select", "textarea"],
          default: "text",
        },
        options: [{ type: String }], // for select type
        required: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
      },
    ],
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Business", businessSchema);