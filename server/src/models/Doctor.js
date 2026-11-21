import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
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
      unique: true, // ek user = ek doctor profile
    },
    name: { type: String, required: true },
    specialization: { type: String, default: "" }, // e.g. "Cardiologist"
    qualification: { type: String, default: "" }, // MBBS, MD
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    department: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Doctor ki apni weekly availability
    availability: {
      type: [
        {
          day: { type: String, enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
          startTime: String,
          endTime: String,
          slotDuration: { type: Number, default: 30 }, // minutes
          bufferTime: { type: Number, default: 0 }, // gap between slots
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

doctorSchema.index({ businessId: 1, isActive: 1 });

export default mongoose.model("Doctor", doctorSchema);