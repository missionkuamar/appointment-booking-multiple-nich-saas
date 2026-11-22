import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import AffiliateReferral from '../affiliate/AffiliateReferral.models.js';
import Affiliate from '../affiliate/affiliate.models.js';
// @desc    Register new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const traceId = `reg_${Date.now()}`;
  try {
    const { name, email, password, ref } = req.body;
    console.log("name , email, password", name, email, password);
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    console.log(`🚀 [${traceId}][register] START`, {
      name,
      rawEmail: email,
      normalizedEmail,
      hasPassword: !!password,
      ref: ref || "(EMPTY)",
      queryRef: req.query?.ref || "(EMPTY)",
      sessionReferral: req.session?.affiliateReferral || "(EMPTY)",
    });

    if (!name || !normalizedEmail || !password) {
      console.warn(`⚠️ [${traceId}][register] Missing required fields:`, {
        hasName: !!name,
        hasEmail: !!normalizedEmail,
        hasPassword: !!password,
      });
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.warn(`⚠️ [${traceId}][register] Email already registered:`, normalizedEmail);
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });
    console.log(`✅ [${traceId}][register] New user created:`, {
      userId: user._id,
      email: user.email,
    });

    // ============================================================
    // AFFILIATE TRACKING
    // ============================================================
    try {
      let affiliateReferral = null;
      const cleanRef = (ref || req.query?.ref || "").trim();

      console.log(`🤝 [${traceId}][register:affiliate] Starting affiliate tracking:`, {
        userId: user._id,
        cleanRef: cleanRef || "NONE",
        hasSessionReferral: !!req.session?.affiliateReferral?.referralId,
      });

      // 1. Check session referral first
      if (req.session?.affiliateReferral?.referralId) {
        const { referralId, affiliateId } = req.session.affiliateReferral;
        console.log(`🔍 [${traceId}][register:affiliate] Checking session referral:`, {
          referralId,
          affiliateId,
        });

        const referral = await AffiliateReferral.findById(referralId);
        console.log(`📄 [${traceId}][register:affiliate] Session referral doc:`, referral ? {
          id: referral._id,
          referredUser: referral.referredUser,
          status: referral.status,
        } : "NOT_FOUND");

        if (referral && !referral.referredUser) {
          referral.referredUser = user._id;
          referral.status = "registered";
          await referral.save();
          affiliateReferral = referral;
          console.log(`💾 [${traceId}][register:affiliate] Updated session referral to registered:`, referral._id);

          const affiliate = await Affiliate.findById(affiliateId);
          if (affiliate) {
            affiliate.totalReferrals = Number(affiliate.totalReferrals || 0) + 1;
            await affiliate.save();
            console.log(`💾 [${traceId}][register:affiliate] Incremented affiliate totalReferrals (session):`, {
              affiliateId: affiliate._id,
              totalReferrals: affiliate.totalReferrals,
            });
          } else {
            console.warn(`⚠️ [${traceId}][register:affiliate] Session affiliate not found:`, affiliateId);
          }
        } else if (referral?.referredUser) {
          console.warn(`⚠️ [${traceId}][register:affiliate] Session referral already has referredUser:`, referral.referredUser);
        }

        delete req.session.affiliateReferral;
        await req.session.save();
        console.log(`🧹 [${traceId}][register:affiliate] Cleared session.affiliateReferral`);
      }

      // 2. Fallback to ref from req.body (localStorage ref)
      if (!affiliateReferral && cleanRef) {
        console.log(`🔍 [${traceId}][register:affiliate] Checking fallback ref:`, cleanRef);
        const affiliate = await Affiliate.findOne({
          affiliateCode: cleanRef,
          status: "active",
        });

        if (affiliate) {
          console.log(`✅ [${traceId}][register:affiliate] Active affiliate found:`, {
            affiliateId: affiliate._id,
            affiliateCode: affiliate.affiliateCode,
            affiliateUserId: affiliate.user,
          });

          // Avoid self-referral
          if (String(affiliate.user) === String(user._id)) {
            console.warn(`⚠️ [${traceId}][register:affiliate] Self-referral skipped for user:`, user._id);
          } else {
            const existingClickReferral = await AffiliateReferral.findOne({
              affiliate: affiliate._id,
              referredUser: null,
              status: "clicked",
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).sort({ createdAt: -1 });

            if (existingClickReferral) {
              existingClickReferral.referredUser = user._id;
              existingClickReferral.status = "registered";
              await existingClickReferral.save();
              affiliateReferral = existingClickReferral;
              console.log(`💾 [${traceId}][register:affiliate] Linked existing clicked referral to registered:`, existingClickReferral._id);
            } else {
              affiliateReferral = await AffiliateReferral.create({
                affiliate: affiliate._id,
                referredUser: user._id,
                status: "registered",
              });
              console.log(`💾 [${traceId}][register:affiliate] Created new registered referral:`, affiliateReferral._id);
            }

            affiliate.totalReferrals = Number(affiliate.totalReferrals || 0) + 1;
            await affiliate.save();
            console.log(`💾 [${traceId}][register:affiliate] Incremented affiliate totalReferrals (fallback):`, {
              affiliateId: affiliate._id,
              totalReferrals: affiliate.totalReferrals,
            });
          }
        } else {
          console.warn(`⚠️ [${traceId}][register:affiliate] Active affiliate not found for ref:`, cleanRef);
        }
      }

      if (!affiliateReferral) {
        console.log(`ℹ️ [${traceId}][register:affiliate] No affiliate referral linked for user:`, user._id);
      }
    } catch (affError) {
      // Affiliate tracking error should not fail user registration
      console.error(`❌ [${traceId}][register:affiliate] TRACKING ERROR:`, {
        message: affError.message,
        name: affError.name,
        stack: affError.stack,
      });
    }

    const token = generateToken(user._id);
    console.log(`✅ [${traceId}][register] COMPLETE for userId:`, user._id);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    console.error(`❌ [${traceId}][register] FATAL ERROR:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Login
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const traceId = `lgn_${Date.now()}`;
  try {
    const { email, password } = req.body;

    console.log("name , email, password", email, password);

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    console.log(`🚀 [${traceId}][login] START`, {
      rawEmail: email,
      normalizedEmail,
      hasPassword: !!password,
      passwordLength: typeof password === "string" ? password.length : 0,
    });

    if (!normalizedEmail || !password) {
      console.warn(`⚠️ [${traceId}][login] Missing email or password`);
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      console.warn(
        `⚠️ [${traceId}][login] User not found in DB for email:`,
        normalizedEmail
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(`✅ [${traceId}][login] User found:`, {
      userId: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPasswordHash: !!user.password,
    });

    // 🔴 Block deactivated user/staff from logging in
    if (user.isActive === false) {
      console.warn(
        `🚫 [${traceId}][login] Account is deactivated for userId:`,
        user._id
      );
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact your admin or business owner.",
      });
    }

    if (typeof user.matchPassword !== "function") {
      console.error(
        `❌ [${traceId}][login] user.matchPassword is not a function on User model`
      );
      return res
        .status(500)
        .json({ message: "Password verification method missing" });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`🔐 [${traceId}][login] Password match result:`, isMatch);

    if (!isMatch) {
      console.warn(
        `⚠️ [${traceId}][login] Password mismatch for userId:`,
        user._id
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    console.log(
      `✅ [${traceId}][login] Login success, token generated for userId:`,
      user._id
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(`❌ [${traceId}][login] FATAL ERROR:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ message: error.message });
  }
};



// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  const traceId = `me_${Date.now()}`;
  try {
    const userId = req.user?.id || req.user?._id;
    console.log(`🚀 [${traceId}][getMe] START`, {
      hasReqUser: !!req.user,
      userId,
      reqUserId: req.user?.id,
      reqUserUnderscoreId: req.user?._id,
    });

    if (!userId) {
      console.warn(`⚠️ [${traceId}][getMe] Missing user ID on req.user:`, req.user);
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.warn(`⚠️ [${traceId}][getMe] User not found in DB for id:`, userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ [${traceId}][getMe] User found:`, {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return res.json(user);
  } catch (error) {
    console.error(`❌ [${traceId}][getMe] FATAL ERROR:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ message: error.message });
  }
};