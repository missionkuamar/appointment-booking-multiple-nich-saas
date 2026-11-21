import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    clientEmail: { type: String, default: "" },
    reason: { type: String, default: "" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      default: "pending",
    },
    notes: { type: String, default: "" },
    // Custom fields values
    customData: { type: Map, of: String, default: {} },
    // For client reschedule/cancel without login
    cancelToken: { type: String, unique: true, sparse: true },
    notificationStatus: {
      owner: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      client: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
    },
    reminders: {
      sent24h: { type: Boolean, default: false },
      sent1h: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ businessId: 1, date: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

export default mongoose.model("Appointment", appointmentSchema);