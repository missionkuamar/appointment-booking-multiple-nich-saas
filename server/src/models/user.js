import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    picture: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "local",
    },
    role: {
      type: String,
      enum: ["owner", "staff", "user", "admin", "super_admin"],
      default: "owner",
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
    // Staff specific
    staffTitle: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Affiliate / Referral tracking fields
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      default: null,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      default: null,
    },
    referralCodeUsed: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await this.matchPassword(candidatePassword);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;