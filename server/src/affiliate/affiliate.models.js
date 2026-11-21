import mongoose from 'mongoose';

const affiliateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    affiliateCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    commissionType: {
      type: String,
      enum: ['one_time', 'recurring'],
      default: 'one_time',
    },
    commissionRate: {
      type: Number,
      default: 10,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    totalConversions: {
      type: Number,
      default: 0,
    },
    monthlyEarnings: [
      {
        month: Number,
        year: Number,
        amount: Number,
      },
    ],
    paymentEmail: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['bank', 'paypal', 'razorpay'],
      default: 'razorpay',
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolder: String,
    },
    paypalEmail: String,
  },
  { timestamps: true }
);

affiliateSchema.pre('save', function () {
  if (!this.affiliateCode) {
    this.affiliateCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Affiliate = mongoose.models.Affiliate || mongoose.model('Affiliate', affiliateSchema);

export default Affiliate;