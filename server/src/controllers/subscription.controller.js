import crypto from "crypto";
import Business from "../models/Business.js";
import Subscription from "../models/Subscription.js";
import Affiliate from "../affiliate/affiliate.models.js";
import AffiliateReferral from "../affiliate/AffiliateReferral.models.js";
import { razorpay } from "../utils/razorpay.js";
import { PLANS, getPlanById } from "../config/planConfig.js";

const PLAN_RANK = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

const getTransactionType = (previousPlan, newPlan, hasActiveSubscription) => {
  if (!hasActiveSubscription) return "new";
  if (previousPlan === newPlan) return "renewal";
  return (PLAN_RANK[newPlan] || 0) > (PLAN_RANK[previousPlan] || 0)
    ? "upgrade"
    : "downgrade";
};

const addDays = (date, days = 30) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 30));
  return d;
};

// @desc    Create Razorpay order (one-time/monthly order flow like product checkout)
// @route   POST /api/subscriptions/create-order
export const createOrder = async (req, res) => {
  const traceId = `ord_${Date.now()}`;
  try {
    const userId = req.user?.id || req.user?._id;
    const planKey = req.body.planName || req.body.plan;
    const plan = PLANS[planKey];

    // console.log(`🚀 [${traceId}][createOrder] START`, {
    //   userId,
    //   rawBody: req.body,
    //   planKey,
    //   planFound: !!plan,
    //   planDetails: plan ? { id: plan.id, price: plan.price, isFree: plan.isFree } : null,
    // });

    if (!userId) {
      console.error(`❌ [${traceId}][createOrder] Missing req.user id:`, req.user);
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    if (!plan || plan.isFree || !plan.price || plan.price <= 0) {
      console.warn(`⚠️ [${traceId}][createOrder] Invalid/Free plan rejected:`, {
        planKey,
        availablePlans: Object.keys(PLANS),
      });
      return res
        .status(400)
        .json({ message: "Invalid or non-paid plan selected" });
    }

    const business = await Business.findOne({ ownerId: userId });
    if (!business) {
      console.warn(`⚠️ [${traceId}][createOrder] Business not found for ownerId:`, userId);
      return res.status(404).json({ message: "Business not found" });
    }

    const currentPlan = business.subscriptionPlan || "free";
    const isCurrentlyActive =
      business.subscriptionStatus === "active" &&
      (!business.subscriptionEndDate ||
        new Date(business.subscriptionEndDate) > new Date());

    // console.log(`ℹ️ [${traceId}][createOrder] Business state:`, {
    //   businessId: business._id,
    //   currentPlan,
    //   subscriptionStatus: business.subscriptionStatus,
    //   subscriptionEndDate: business.subscriptionEndDate,
    //   isCurrentlyActive,
    // });

    if (currentPlan === plan.id && isCurrentlyActive) {
      console.warn(`⚠️ [${traceId}][createOrder] Duplicate active plan blocked:`, plan.id);
      return res.status(400).json({
        message: `Aapka ${plan.name} plan pehle se active hai.`,
      });
    }

    const orderPayload = {
      amount: Math.round(plan.price * 100),
      currency: plan.currency || "INR",
      receipt: `sub_${Date.now()}_${business._id.toString().slice(-6)}`,
      notes: {
        businessId: business._id.toString(),
        userId: String(userId),
        planName: plan.id,
        previousPlan: currentPlan,
      },
    };

    // console.log(`📡 [${traceId}][createOrder] Creating Razorpay order with payload:`, orderPayload);
    const order = await razorpay.orders.create(orderPayload);

    // console.log(`✅ [${traceId}][createOrder] SUCCESS:`, {
    //   orderId: order.id,
    //   amount: order.amount,
    //   currency: order.currency,
    //   keyIdPresent: !!process.env.RAZORPAY_KEY_ID,
    // });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: plan.id,
      durationDays: plan.durationDays || 30,
    });
  } catch (error) {
    console.error(`❌ [${traceId}][createOrder] FATAL ERROR:`, {
      message: error.message,
      razorpayError: error?.error,
      stack: error.stack,
    });
    res.status(500).json({
      message: error?.error?.description || error.message || "Order creation failed",
    });
  }
};

// @desc    Verify payment & activate plan for durationDays + track affiliate commission
// @route   POST /api/subscriptions/verify-payment
export const verifyPayment = async (req, res) => {
  const traceId = `ver_${Date.now()}`;
  try {
    const { orderId, paymentId, signature, plan } = req.body;
    const planKey = plan || req.body.planName;
    const selectedPlan = PLANS[planKey];
    const userId = req.user?.id || req.user?._id;

    // console.log(`🚀 [${traceId}][verifyPayment] START`, {
    //   userId,
    //   orderId,
    //   paymentId,
    //   signatureReceived: signature ? `${signature.slice(0, 10)}...` : null,
    //   planKey,
    //   selectedPlanFound: !!selectedPlan,
    // });

    if (!orderId || !paymentId || !signature || !selectedPlan) {
      console.warn(`⚠️ [${traceId}][verifyPayment] Missing required fields:`, {
        hasOrderId: !!orderId,
        hasPaymentId: !!paymentId,
        hasSignature: !!signature,
        hasValidPlan: !!selectedPlan,
        planKey,
      });
      return res.status(400).json({
        message: "orderId, paymentId, signature, and valid plan are required",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error(`❌ [${traceId}][verifyPayment] RAZORPAY_KEY_SECRET is missing in .env!`);
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn(`⚠️ [${traceId}][verifyPayment] Signature mismatch:`, {
        orderId,
        paymentId,
        expectedPrefix: expectedSignature.slice(0, 10),
        receivedPrefix: signature.slice(0, 10),
      });
      return res.status(400).json({
        message: "Payment verification failed. Invalid signature.",
      });
    }
    // console.log(`🔐 [${traceId}][verifyPayment] Signature verified`);

    const razorpayOrder = await razorpay.orders.fetch(orderId);
    const expectedAmount = Math.round(selectedPlan.price * 100);
    // console.log(`📡 [${traceId}][verifyPayment] Fetched Razorpay order:`, {
    //   orderId: razorpayOrder.id,
    //   status: razorpayOrder.status,
    //   orderAmount: razorpayOrder.amount,
    //   expectedAmount,
    //   notes: razorpayOrder.notes,
    // });

    if (Number(razorpayOrder.amount) !== expectedAmount) {
      console.warn(`⚠️ [${traceId}][verifyPayment] Amount mismatch:`, {
        orderAmount: razorpayOrder.amount,
        expectedAmount,
      });
      return res.status(400).json({ message: "Payment amount mismatch" });
    }

    const business = await Business.findOne({ ownerId: userId });
    if (!business) {
      console.warn(`⚠️ [${traceId}][verifyPayment] Business not found for userId:`, userId);
      return res.status(404).json({ message: "Business not found" });
    }

    const previousPlan = business.subscriptionPlan || "free";
    const hasActiveSubscription =
      business.subscriptionStatus === "active" &&
      business.subscriptionEndDate &&
      new Date(business.subscriptionEndDate) > new Date();

    const transactionType = getTransactionType(
      previousPlan,
      selectedPlan.id,
      hasActiveSubscription
    );

    const startDate = new Date();
    const durationDays = selectedPlan.durationDays || 30;
    const endDate = addDays(startDate, durationDays);

    business.subscriptionPlan = selectedPlan.id;
    business.subscriptionStatus = "active";
    business.subscriptionStartDate = startDate;
    business.subscriptionEndDate = endDate;
    await business.save();

    // console.log(`💾 [${traceId}][verifyPayment] Business updated:`, {
    //   businessId: business._id,
    //   previousPlan,
    //   newPlan: selectedPlan.id,
    //   transactionType,
    //   startDate,
    //   endDate,
    // });

    const subRecord = await Subscription.findOneAndUpdate(
      { businessId: business._id },
      {
        $set: {
          businessId: business._id,
          userId,
          plan: selectedPlan.id,
          status: "active",
          price: selectedPlan.price,
          currency: selectedPlan.currency || "INR",
          startDate,
          endDate,
          razorpayPaymentId: paymentId,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    // console.log(`💾 [${traceId}][verifyPayment] Subscription upserted:`, {
    //   subscriptionId: subRecord?._id,
    //   plan: subRecord?.plan,
    // });

    // ============================================================
    // AFFILIATE COMMISSION TRACKING
    // ============================================================
    let affiliateData = {
      earned: false,
      commission: 0,
      rate: 0,
      commissionType: null,
      message: "No affiliate referral found",
    };

    try {
      // console.log(`🤝 [${traceId}][verifyPayment:affiliate] Searching referral for userId:`, userId);

      const referral = await AffiliateReferral.findOne({
        referredUser: userId,
      }).sort({ createdAt: -1 });

      if (!referral) {
        // console.log(`ℹ️ [${traceId}][verifyPayment:affiliate] No referral doc found for referredUser:`, userId);
      } else {
        // console.log(`🔍 [${traceId}][verifyPayment:affiliate] Referral doc found:`, {
        //   referralId: referral._id,
        //   affiliateId: referral.affiliate,
        //   status: referral.status,
        //   lastPaymentId: referral.lastPaymentId,
        //   commissionCount: referral.commissionCount || 0,
        // });

        const affiliate = await Affiliate.findById(referral.affiliate);

        if (!affiliate) {
          console.warn(`⚠️ [${traceId}][verifyPayment:affiliate] Affiliate ID missing in DB:`, referral.affiliate);
          affiliateData.message = "Affiliate not found";
        } else if (affiliate.status !== "active") {
          console.warn(`⚠️ [${traceId}][verifyPayment:affiliate] Affiliate inactive:`, {
            affiliateId: affiliate._id,
            status: affiliate.status,
          });
          affiliateData.message = "Affiliate is not active";
        } else {
          const commissionType = affiliate.commissionType || "one_time";
          const commissionRate = Number(affiliate.commissionRate ?? 10);
          const alreadyCreditedForPayment = referral.lastPaymentId === paymentId;

          if (alreadyCreditedForPayment) {
            // console.log(`ℹ️ [${traceId}][verifyPayment:affiliate] Duplicate paymentId skipped:`, paymentId);
            affiliateData.message = "Affiliate commission already credited";
          } else {
            const alreadyHadCommission = Number(referral.commissionCount || 0) > 0;
            const shouldPayCommission =
              commissionType === "recurring" ? true : !alreadyHadCommission;

            // console.log(`🧮 [${traceId}][verifyPayment:affiliate] Eligibility check:`, {
            //   commissionType,
            //   commissionRate,
            //   alreadyHadCommission,
            //   shouldPayCommission,
            // });

            if (!shouldPayCommission) {
              // console.log(`ℹ️ [${traceId}][verifyPayment:affiliate] One-time commission already paid earlier`);
              affiliateData = {
                earned: false,
                commission: 0,
                rate: commissionRate,
                commissionType,
                message: "One-time commission already credited",
                affiliateCode: affiliate.affiliateCode,
                commissionCount: referral.commissionCount,
              };
            } else {
              const planAmount = Number(selectedPlan.price || 0);
              const commissionAmount = Number(
                ((planAmount * commissionRate) / 100).toFixed(2)
              );

              // console.log(`💰 [${traceId}][verifyPayment:affiliate] Crediting commission:`, {
              //   plan: selectedPlan.id,
              //   planAmount,
              //   commissionRate,
              //   commissionAmount,
              // });

              referral.status = "subscribed";
              referral.subscriptionPlan = selectedPlan.id;
              referral.subscriptionAmount = planAmount;
              referral.subscriptionStartDate = startDate;
              referral.subscriptionEndDate = endDate;
              referral.commission = commissionAmount;
              referral.totalCommissionPaid =
                Number(referral.totalCommissionPaid || 0) + commissionAmount;
              referral.lastCommissionDate = new Date();
              referral.lastPaymentId = paymentId;
              referral.commissionCount = Number(referral.commissionCount || 0) + 1;
              referral.isRecurring = commissionType === "recurring";
              if (!referral.convertedAt) {
                referral.convertedAt = new Date();
              }
              await referral.save();
              // console.log(`💾 [${traceId}][verifyPayment:affiliate] Referral saved:`, referral._id);

              affiliate.totalEarnings =
                Number(affiliate.totalEarnings || 0) + commissionAmount;
              if (!alreadyHadCommission) {
                affiliate.totalConversions = Number(affiliate.totalConversions || 0) + 1;
              }

              if (!Array.isArray(affiliate.monthlyEarnings)) {
                affiliate.monthlyEarnings = [];
              }

              const now = new Date();
              const currentMonth = now.getMonth() + 1;
              const currentYear = now.getFullYear();

              const monthlyEarning = affiliate.monthlyEarnings.find(
                (item) => item.month === currentMonth && item.year === currentYear
              );

              if (monthlyEarning) {
                monthlyEarning.amount =
                  Number(monthlyEarning.amount || 0) + commissionAmount;
              } else {
                affiliate.monthlyEarnings.push({
                  month: currentMonth,
                  year: currentYear,
                  amount: commissionAmount,
                });
              }

              await affiliate.save();
              // console.log(`💾 [${traceId}][verifyPayment:affiliate] Affiliate saved:`, {
              //   affiliateId: affiliate._id,
              //   totalEarnings: affiliate.totalEarnings,
              //   totalConversions: affiliate.totalConversions,
              // });

              affiliateData = {
                earned: true,
                commission: commissionAmount,
                rate: commissionRate,
                commissionType,
                message: `Commission credited: ₹${commissionAmount}`,
                affiliateCode: affiliate.affiliateCode,
                referralUserId: userId,
                businessId: business._id,
                businessName: business.name,
                referralStatus: referral.status,
                commissionCount: referral.commissionCount,
                totalAffiliateEarnings: affiliate.totalEarnings,
              };
            }
          }
        }
      }
    } catch (affError) {
      console.error(`❌ [${traceId}][verifyPayment:affiliate] COMMISSION ERROR:`, {
        message: affError.message,
        stack: affError.stack,
      });
      affiliateData = {
        earned: false,
        commission: 0,
        message:
          "Subscription successful, but affiliate commission processing failed",
      };
    }

    // console.log(`✅ [${traceId}][verifyPayment] COMPLETE`);
    res.status(200).json({
      success: true,
      message: "Payment verified and plan activated",
      data: {
        plan: selectedPlan.id,
        status: "active",
        transactionType,
        previousPlan,
        startDate,
        endDate,
        subscriptionId: subRecord._id,
        affiliate: affiliateData,
      },
    });
  } catch (error) {
    console.error(`❌ [${traceId}][verifyPayment] FATAL ERROR:`, {
      message: error.message,
      razorpayError: error?.error,
      stack: error.stack,
    });
    res.status(500).json({
      message: error?.error?.description || error.message || "Verification failed",
    });
  }
};

// @desc    Get subscription status + auto-revert if endDate passed
// @route   GET /api/subscriptions/status
export const getSubscriptionStatus = async (req, res) => {
  const traceId = `sts_${Date.now()}`;
  try {
    const userId = req.user?.id || req.user?._id;
    // console.log(`🚀 [${traceId}][getSubscriptionStatus] START for userId:`, userId);

    const business = await Business.findOne({ ownerId: userId });
    if (!business) {
      console.warn(`⚠️ [${traceId}][getSubscriptionStatus] Business not found for userId:`, userId);
      return res.status(404).json({ message: "Business not found" });
    }

    let currentPlan = business.subscriptionPlan || "free";
    let currentStatus = business.subscriptionStatus || "active";

    // console.log(`ℹ️ [${traceId}][getSubscriptionStatus] Current DB values:`, {
    //   businessId: business._id,
    //   currentPlan,
    //   currentStatus,
    //   subscriptionEndDate: business.subscriptionEndDate,
    //   now: new Date(),
    // });

    // Auto-expire paid plan if endDate is in the past
    if (
      currentPlan !== "free" &&
      currentStatus === "active" &&
      business.subscriptionEndDate &&
      new Date(business.subscriptionEndDate) <= new Date()
    ) {
      // console.log(`⏳ [${traceId}][getSubscriptionStatus] Expiring plan to free:`, {
      //   businessId: business._id,
      //   expiredPlan: currentPlan,
      //   endDate: business.subscriptionEndDate,
      // });

      currentPlan = "free";
      currentStatus = "active";
      business.subscriptionPlan = "free";
      business.subscriptionStatus = "active";
      await business.save();

      await Subscription.findOneAndUpdate(
        { businessId: business._id },
        { $set: { plan: "free", status: "active", price: 0 } }
      );
      // console.log(`💾 [${traceId}][getSubscriptionStatus] Reverted to free in Business & Subscription`);
    }

    const planObj = getPlanById(currentPlan);
    if (!planObj) {
      console.warn(`⚠️ [${traceId}][getSubscriptionStatus] getPlanById returned null/undefined for:`, currentPlan);
    }

    res.json({
      plan: currentPlan,
      status: currentStatus,
      startDate: business.subscriptionStartDate || null,
      endDate: business.subscriptionEndDate || null,
      features: planObj?.features || [],
      limits: planObj?.limits || {},
    });
  } catch (error) {
    console.error(`❌ [${traceId}][getSubscriptionStatus] FATAL ERROR:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message });
  }
};




// ubscriptionHistory from "../models/SubscriptionHistory.js";

export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const business = await Business.findOne({ ownerId: userId }).select("_id");

    const filter = business
      ? { $or: [{ businessId: business._id }, { userId }] }
      : { userId };

    const [history, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      data: history,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[getSubscriptionHistory] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subscription history",
    });
  }
};