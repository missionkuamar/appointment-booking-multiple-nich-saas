import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null }, // null = clinic-wide
    date: { type: String, required: true }, // "YYYY-MM-DD"
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

holidaySchema.index({ businessId: 1, date: 1, doctorId: 1 });

export default mongoose.model("Holiday", holidaySchema);