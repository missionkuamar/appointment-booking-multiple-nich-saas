import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null }, // 👈 staff→doctor

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = owner
    },
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false }, // holiday/break
  },
  { timestamps: true }
);

// Ek staff ke ek date+time pe ek hi slot
slotSchema.index(
  { businessId: 1, staffId: 1, doctorId: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Query performance
slotSchema.index({ businessId: 1, date: 1, isBooked: 1 });
slotSchema.index({ doctorId: 1, date: 1, isBooked: 1 });
 
export default mongoose.model("Slot", slotSchema);