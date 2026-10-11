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
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    notes: { type: String, default: "" },
    // Custom fields values
    customData: { type: Map, of: String, default: {} },
    // For client reschedule/cancel without login
    cancelToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);