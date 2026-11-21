// backend/src/controllers/affiliateWithdrawalController.js
import Affiliate from './affiliate.models.js';
import AffiliateWithdrawal from './AffiliateWithdrawal.models.js';
import User from '../models/user.js';
import Notification from './Notification.models.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import AffiliateReferral from './AffiliateReferral.models.js';
import AffiliateLink from './AffiliateLink.models.js';



export const getWithdrawals = async (req, res) => {
  try {
    console.log("[getWithdrawals] Request received:", {
      userId: req.user?._id || req.user?.id,
      query: req.query,
    });

    const userId = req.user?._id || req.user?.id;

    // ==========================================================
    // FIND AFFILIATE
    // ==========================================================

    console.log("[getWithdrawals] Looking up affiliate for userId:", userId);
    const affiliate = await Affiliate.findOne({
      user: userId,
    }).select("_id");
    console.log("[getWithdrawals] Affiliate lookup result:", affiliate?._id || null);

    if (!affiliate) {
      console.warn("[getWithdrawals] Affiliate not found for userId:", userId);
      return res.status(404).json({
        success: false,
        message: "Affiliate not found",
      });
    }

    // ==========================================================
    // QUERY PARAMS
    // ==========================================================

    const {
      status,
      page = 1,
      limit = 5,
    } = req.query;

    // ==========================================================
    // PAGE VALIDATION
    // ==========================================================

    const pageNum = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    // ==========================================================
    // ALLOWED ITEMS PER PAGE
    // ==========================================================

    const ALLOWED_LIMITS = [
      5,
      10,
      20,
      50,
      100,
      200,
    ];

    const requestedLimit = parseInt(limit, 10);

    const limitNum = ALLOWED_LIMITS.includes(
      requestedLimit
    )
      ? requestedLimit
      : 20;

    console.log("[getWithdrawals] Parsed pagination params:", {
      rawPage: page,
      rawLimit: limit,
      pageNum,
      requestedLimit,
      limitNum,
      status: status || "ALL",
    });

    // ==========================================================
    // BUILD QUERY
    // ==========================================================

    const query = {
      affiliate: affiliate._id,
    };

    if (status) {
      query.status = status;
    }

    console.log("[getWithdrawals] Built Mongo query:", query);

    // ==========================================================
    // TOTAL COUNT
    // ==========================================================

    const total = await AffiliateWithdrawal.countDocuments(
      query
    );

    // ==========================================================
    // TOTAL PAGES
    // ==========================================================

    const totalPages = Math.max(
      1,
      Math.ceil(total / limitNum)
    );

    // ==========================================================
    // SAFE PAGE
    // ==========================================================

    const currentPage = Math.min(
      pageNum,
      totalPages
    );

    // ==========================================================
    // SKIP
    // ==========================================================

    const skip =
      (currentPage - 1) * limitNum;

    console.log("[getWithdrawals] Pagination math:", {
      total,
      totalPages,
      currentPage,
      skip,
    });

    // ==========================================================
    // FETCH ONLY REQUIRED RECORDS
    // ==========================================================

    const withdrawals =
      await AffiliateWithdrawal.find(query)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limitNum)
        .lean();

    console.log("[getWithdrawals] Fetched withdrawals count:", withdrawals.length);

    // ==========================================================
    // ITEM RANGE
    // ==========================================================

    const startItem =
      total === 0
        ? 0
        : skip + 1;

    const endItem =
      total === 0
        ? 0
        : Math.min(
          skip + withdrawals.length,
          total
        );

    const pagination = {
      page: currentPage,
      limit: limitNum,
      total,
      pages: totalPages,
      startItem,
      endItem,
      firstPage: 1,
      lastPage: totalPages,
      previousPage:
        currentPage > 1
          ? currentPage - 1
          : null,
      nextPage:
        currentPage < totalPages
          ? currentPage + 1
          : null,
      hasNextPage:
        currentPage < totalPages,
      hasPreviousPage:
        currentPage > 1,
      hasData: total > 0,
    };

    console.log("[getWithdrawals] Final pagination object:", pagination);

    // ==========================================================
    // PAGINATION RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination,
      },
    });
  } catch (error) {
    console.error("[getWithdrawals] ❌ Get Withdrawals Error:", {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch withdrawals",
    });
  }
};

// ============================================================
// GET REFERRALS (paginated + filterable)
// ============================================================

export const getReferrals = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    console.log('[getReferrals] userId:', userId);

    if (!userId) {
      console.log('[getReferrals] Warning: userId missing from req.user', req.user);
    }

    const affiliate = await Affiliate.findOne({
      user: userId,
    });
    console.log('[getReferrals] affiliate found:', affiliate ? affiliate._id : null);

    if (!affiliate) {
      console.log('[getReferrals] Affiliate not found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'Not an affiliate member',
      });
    }

    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;
    console.log('[getReferrals] req.query:', { status, page, limit });

    const pageNum = Math.max(Number(page) || 1, 1);

    const limitNum = Math.min(
      Math.max(Number(limit) || 20, 1),
      200
    );

    const query = {
      affiliate: affiliate._id,
    };

    if (status) query.status = status;
    console.log('[getReferrals] MongoDB query:', query, { pageNum, limitNum });

    const skip = (pageNum - 1) * limitNum;

    const [referrals, total] = await Promise.all([
      AffiliateReferral.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('referredUser', 'name email')
        .lean(),

      AffiliateReferral.countDocuments(query),
    ]);

    console.log('[getReferrals] fetched referrals count:', referrals.length, '| total matching docs:', total);

    const totalPages = Math.max(
      1,
      Math.ceil(total / limitNum)
    );

    return res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('[getReferrals] Get referrals error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create affiliate link
// @route   POST /api/affiliate/links
export const createAffiliateLink = async (req, res) => {
  try {
    console.log("[createAffiliateLink] Request received:", {
      userId: req.user?._id,
      body: req.body,
    });

    const { name, destination, slug } = req.body;
    const userId = req.user._id;

    console.log("[createAffiliateLink] Looking up affiliate for userId:", userId);
    const affiliate = await Affiliate.findOne({ user: userId });
    console.log("[createAffiliateLink] Affiliate lookup result:", affiliate?._id || null);

    if (!affiliate) {
      console.warn("[createAffiliateLink] User is not an affiliate member:", userId);
      return res.status(404).json({
        success: false,
        message: 'Not an affiliate member',
      });
    }

    if (slug) {
      console.log("[createAffiliateLink] Checking existing slug:", slug);
      const existing = await AffiliateLink.findOne({ slug });
      console.log("[createAffiliateLink] Existing slug lookup:", existing?._id || null);

      if (existing) {
        console.warn("[createAffiliateLink] Slug already taken:", slug);
        return res.status(400).json({
          success: false,
          message: 'Slug already taken. Please choose another.',
        });
      }
    } else {
      console.log("[createAffiliateLink] No custom slug provided; will generate random slug");
    }

    const payload = {
      affiliate: affiliate._id,
      name,
      destination: destination || '/',
      slug: slug || Math.random().toString(36).substring(2, 10),
      status: 'active',
    };
    console.log("[createAffiliateLink] Creating AffiliateLink with payload:", payload);

    const link = await AffiliateLink.create(payload);
    console.log("[createAffiliateLink] Created link:", link._id, link);

    // Generate full link URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkUrl = `${baseUrl}/r/${link.slug}?ref=${affiliate.affiliateCode}`;
    console.log("[createAffiliateLink] Generated fullUrl:", {
      FRONTEND_URL: process.env.FRONTEND_URL,
      baseUrl,
      linkUrl,
    });

    const responseData = {
      ...link.toObject(),
      fullUrl: linkUrl,
    };
    console.log("[createAffiliateLink] Sending 201 response:", responseData);

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("[createAffiliateLink] Error creating affiliate link:", {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteAffiliateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        //  message: 'Not an affiliate member',
      });
    }

    const link = await AffiliateLink.findOneAndDelete({
      _id: id,
      affiliate: affiliate._id
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Link deleted successfully',
    });
  } catch (error) {
    //  console.error('Delete affiliate link error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





// =============

// @desc    Track affiliate conversion (called when user subscribes)
// @route   POST /api/affiliate/track-conversion
export const trackAffiliateConversion = async (req, res) => {
  try {
    console.log("[trackAffiliateConversion] Request received:", {
      userId: req.user?._id,
      body: req.body,
    });

    const { plan, amount } = req.body;
    const userId = req.user._id;

    // Check if user came from affiliate link
    console.log("[trackAffiliateConversion] Searching registered referral for userId:", userId);
    const referral = await AffiliateReferral.findOne({
      referredUser: userId,
      status: 'registered',
    }).sort({ createdAt: -1 });

    console.log("[trackAffiliateConversion] Referral lookup result:", referral?._id || null, referral);

    if (!referral) {
      console.warn("[trackAffiliateConversion] No 'registered' affiliate referral found for userId:", userId);
      return res.status(200).json({ success: true, message: 'No affiliate referral found' });
    }

    // Update referral
    console.log("[trackAffiliateConversion] Updating referral status to 'converted':", {
      referralId: referral._id,
      plan,
      amount,
    });

    referral.status = 'converted';
    referral.subscriptionPlan = plan;
    referral.subscriptionAmount = amount;
    referral.convertedAt = new Date();
    await referral.save();
    console.log("[trackAffiliateConversion] Referral saved with converted status:", referral._id);

    // Update affiliate stats
    console.log("[trackAffiliateConversion] Fetching affiliate:", referral.affiliate);
    const affiliate = await Affiliate.findById(referral.affiliate);
    console.log("[trackAffiliateConversion] Affiliate found:", affiliate?._id || null);

    if (affiliate) {
      const numericAmount = Number(amount) || 0;
      const commissionRate = Number(affiliate.commissionRate) || 0;
      const commission = (numericAmount * commissionRate) / 100;

      console.log("[trackAffiliateConversion] Before affiliate update:", {
        affiliateId: affiliate._id,
        totalReferrals: affiliate.totalReferrals,
        totalConversions: affiliate.totalConversions,
        totalEarnings: affiliate.totalEarnings,
        commissionRate,
        amount: numericAmount,
        calculatedCommission: commission,
      });

      affiliate.totalReferrals += 1;
      affiliate.totalConversions += 1;
      affiliate.totalEarnings += commission;

      referral.commission = commission;

      await Promise.all([referral.save(), affiliate.save()]);

      console.log("[trackAffiliateConversion] After affiliate update:", {
        affiliateId: affiliate._id,
        referralCommission: referral.commission,
        totalReferrals: affiliate.totalReferrals,
        totalConversions: affiliate.totalConversions,
        totalEarnings: affiliate.totalEarnings,
      });
    } else {
      console.warn("[trackAffiliateConversion] Affiliate document not found for id:", referral.affiliate);
    }

    console.log("[trackAffiliateConversion] Conversion tracked successfully for userId:", userId);
    res.status(200).json({
      success: true,
      message: 'Conversion tracked successfully',
    });
  } catch (error) {
    console.error("[trackAffiliateConversion] Track conversion error:", {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const trackAffiliateClick = async (req, res) => {
  const START_TIME = Date.now();

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          🚀 TRACK AFFILIATE CLICK - START                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  try {
    // =========================================================
    // STEP 1: REQUEST INFORMATION
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📥 STEP 1: REQUEST INFORMATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const { slug } = req.params;
    const { ref } = req.query;

    const ip =
      req.ip ||
      req.connection?.remoteAddress ||
      req.headers["x-forwarded-for"] ||
      "unknown";

    const userAgent =
      req.headers["user-agent"] || "unknown";

    const referrer =
      req.headers.referer ||
      req.headers.referrer ||
      "direct";

    console.log("🌐 Request Information:");
    console.log("   Method        :", req.method);
    console.log("   Original URL  :", req.originalUrl);
    console.log("   Protocol      :", req.protocol);
    console.log("   Host          :", req.get("host"));
    console.log("   Slug          :", slug);
    console.log("   Ref           :", ref || "EMPTY");
    console.log("   IP            :", ip);
    console.log("   User-Agent    :", userAgent);
    console.log("   Browser Ref   :", referrer);

    // =========================================================
    // STEP 2: SESSION INFORMATION
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🍪 STEP 2: SESSION INFORMATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("🍪 Session exists        :", !!req.session);
    console.log("🍪 Session ID            :", req.sessionID || "NO SESSION ID");
    console.log(
      "🍪 Session cookie exists :",
      !!req.headers.cookie
    );

    console.log(
      "🍪 Existing referral     :",
      req.session?.affiliateReferral || "NONE"
    );

    if (req.session?.affiliateReferral) {
      console.log("⚠️ Existing affiliate referral already exists:");
      console.log(
        JSON.stringify(
          req.session.affiliateReferral,
          null,
          2
        )
      );
    }

    // =========================================================
    // STEP 3: VALIDATE SLUG
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 STEP 3: VALIDATING SLUG");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!slug) {
      console.error("❌ SLUG IS MISSING");
      console.error("❌ Request params:", req.params);

      return res.redirect("/");
    }

    console.log("✅ Slug received:", slug);

    // =========================================================
    // STEP 4: VALIDATE REF
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 STEP 4: VALIDATING AFFILIATE REF");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!ref) {
      console.error("❌ AFFILIATE REF IS MISSING");

      console.log("⚠️ Expected URL format:");
      console.log(
        `   /r/${slug}?ref=AFFILIATE_CODE`
      );

      console.log("📦 Query received:");
      console.log(req.query);

      return res.redirect("/");
    }

    console.log("✅ Affiliate ref received:", ref);
    console.log("✅ Ref length:", ref.length);

    // =========================================================
    // STEP 5: FIND AFFILIATE LINK
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔎 STEP 5: FINDING AFFILIATE LINK");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log(
      "🔎 Searching AffiliateLink with slug:",
      slug
    );

    const link = await AffiliateLink.findOne({
      slug,
    });

    if (!link) {
      console.error("❌ AFFILIATE LINK NOT FOUND");
      console.error("❌ Requested slug:", slug);

      console.log("⚠️ Possible reason:");
      console.log("   - Slug does not exist");
      console.log("   - Affiliate link was deleted");
      console.log("   - Wrong affiliate URL");

      return res.redirect("/");
    }

    console.log("✅ AFFILIATE LINK FOUND");

    console.log("🔗 Link Information:");
    console.log("   Link ID       :", link._id);
    console.log("   Slug          :", link.slug);
    console.log("   Affiliate ID  :", link.affiliate);
    console.log("   Destination   :", link.destination || "/");
    console.log("   Current clicks:", link.clicks);

    // =========================================================
    // STEP 6: FIND AFFILIATE
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 STEP 6: FINDING AFFILIATE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("🔎 Searching Affiliate with:");
    console.log({
      affiliateId: link.affiliate,
      affiliateCode: ref,
    });

    const affiliate = await Affiliate.findOne({
      _id: link.affiliate,
      affiliateCode: ref,
    });

    if (!affiliate) {
      console.error("❌ AFFILIATE NOT FOUND");

      console.error("❌ Search values:");
      console.error("   Affiliate ID :", link.affiliate);
      console.error("   Affiliate Ref:", ref);

      console.log("⚠️ Possible reasons:");
      console.log("   1. Affiliate code is incorrect");
      console.log("   2. Affiliate belongs to another link");
      console.log("   3. Affiliate was deleted");
      console.log("   4. URL contains wrong ref");

      return res.redirect("/");
    }

    console.log("✅ AFFILIATE FOUND");

    console.log("👤 Affiliate Information:");
    console.log("   Affiliate ID  :", affiliate._id);
    console.log("   Affiliate Code:", affiliate.affiliateCode);
    console.log("   Affiliate User:", affiliate.user);
    console.log("   Status        :", affiliate.status);
    console.log("   Total Clicks  :", affiliate.totalClicks);

    // =========================================================
    // STEP 7: UPDATE AFFILIATE LINK CLICK
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📈 STEP 7: UPDATING AFFILIATE LINK CLICKS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const linkClicksBefore = Number(link.clicks || 0);

    console.log(
      "📊 Link clicks BEFORE:",
      linkClicksBefore
    );

    link.clicks = linkClicksBefore + 1;

    await link.save();

    console.log(
      "📊 Link clicks AFTER :",
      link.clicks
    );

    console.log("✅ AffiliateLink click saved");

    // =========================================================
    // STEP 8: UPDATE AFFILIATE TOTAL CLICKS
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 STEP 8: UPDATING AFFILIATE TOTAL CLICKS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const affiliateClicksBefore =
      Number(affiliate.totalClicks || 0);

    console.log(
      "📊 Affiliate clicks BEFORE:",
      affiliateClicksBefore
    );

    affiliate.totalClicks =
      affiliateClicksBefore + 1;

    await affiliate.save();

    console.log(
      "📊 Affiliate clicks AFTER :",
      affiliate.totalClicks
    );

    console.log("✅ Affiliate totalClicks saved");

    // =========================================================
    // STEP 9: CREATE REFERRAL RECORD
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 STEP 9: CREATING AFFILIATE REFERRAL");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("📝 Referral data:");

    console.log({
      affiliate: affiliate._id,
      affiliateLink: link._id,
      ip,
      userAgent,
      referrer,
      status: "clicked",
    });

    const referral = await AffiliateReferral.create({
      affiliate: affiliate._id,
      affiliateLink: link._id,
      ip,
      userAgent,
      referrer,
      status: "clicked",
    });

    console.log("✅ REFERRAL CREATED");

    console.log("📝 Referral Information:");
    console.log("   Referral ID :", referral._id);
    console.log("   Affiliate    :", referral.affiliate);
    console.log("   Link         :", referral.affiliateLink);
    console.log("   Status       :", referral.status);
    console.log("   IP           :", referral.ip);
    console.log("   Referrer     :", referral.referrer);

    // =========================================================
    // STEP 10: SAVE REFERRAL TO SESSION
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🍪 STEP 10: SAVING REFERRAL TO SESSION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!req.session) {
      console.error(
        "❌ req.session DOES NOT EXIST"
      );

      console.error(
        "❌ Session middleware may not be configured correctly."
      );

      return res.redirect("/");
    }

    req.session.affiliateReferral = {
      referralId: referral._id.toString(),
      affiliateId: affiliate._id.toString(),
      linkId: link._id.toString(),
      affiliateCode: affiliate.affiliateCode,
      slug: link.slug,
    };

    console.log(
      "💾 Session referral data prepared:"
    );

    console.log(
      JSON.stringify(
        req.session.affiliateReferral,
        null,
        2
      )
    );

    // =========================================================
    // STEP 11: SAVE SESSION
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💾 STEP 11: SAVING SESSION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error(
            "❌ SESSION SAVE ERROR"
          );

          console.error(
            "❌ Error message:",
            err.message
          );

          console.error(
            "❌ Error stack:",
            err.stack
          );

          reject(err);

          return;
        }

        console.log(
          "✅ SESSION SAVED SUCCESSFULLY"
        );

        console.log(
          "🍪 Session ID:",
          req.sessionID
        );

        console.log(
          "🍪 Session affiliateReferral:"
        );

        console.log(
          JSON.stringify(
            req.session.affiliateReferral,
            null,
            2
          )
        );

        resolve();
      });
    });

    // =========================================================
    // STEP 12: VERIFY SESSION
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 STEP 12: VERIFYING SESSION DATA");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log(
      "🍪 Session ID:",
      req.sessionID
    );

    console.log(
      "🍪 Referral ID:",
      req.session?.affiliateReferral?.referralId
    );

    console.log(
      "👤 Affiliate ID:",
      req.session?.affiliateReferral?.affiliateId
    );

    console.log(
      "🔗 Link ID:",
      req.session?.affiliateReferral?.linkId
    );

    console.log(
      "🎯 Affiliate Code:",
      req.session?.affiliateReferral?.affiliateCode
    );

    if (req.session?.affiliateReferral?.referralId) {
      console.log(
        "✅ SESSION VERIFICATION PASSED"
      );
    } else {
      console.error(
        "❌ SESSION VERIFICATION FAILED"
      );
    }

    // =========================================================
    // STEP 13: REDIRECT TO LOGIN
    // =========================================================

    console.log("\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 STEP 13: REDIRECTING TO FRONTEND LOGIN");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const frontendUrl =
      process.env.CLIENT_URL ||
      "http://localhost:3000";

    const loginUrl =
      `${frontendUrl}/login?ref=${encodeURIComponent(ref)}`;

    console.log(
      "🌐 Frontend URL:",
      frontendUrl
    );

    console.log(
      "🎯 Affiliate Ref:",
      ref
    );

    console.log(
      "🔗 Login URL:",
      loginUrl
    );

    // =========================================================
    // FINAL SUCCESS LOG
    // =========================================================

    const duration =
      Date.now() - START_TIME;

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       ✅ TRACK AFFILIATE CLICK - SUCCESS                   ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");

    console.log("📊 SUMMARY");
    console.log("   Slug          :", slug);
    console.log("   Affiliate Code:", ref);
    console.log("   Affiliate ID  :", affiliate._id);
    console.log("   Link ID       :", link._id);
    console.log("   Referral ID   :", referral._id);
    console.log("   Link Clicks   :", link.clicks);
    console.log("   Affiliate Clicks:", affiliate.totalClicks);
    console.log("   Session ID    :", req.sessionID);
    console.log("   Redirect      :", loginUrl);
    console.log("   Duration      :", `${duration}ms`);

    console.log("==============================================================");
    console.log("➡️ REDIRECTING USER NOW");
    console.log("==============================================================\n");

    return res.redirect(loginUrl);

  } catch (error) {

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const duration =
      Date.now() - START_TIME;

    console.error("\n");
    console.error("╔══════════════════════════════════════════════════════════════╗");
    console.error("║          ❌ TRACK AFFILIATE CLICK - ERROR                  ║");
    console.error("╚══════════════════════════════════════════════════════════════╝");

    console.error("\n❌ ERROR INFORMATION");

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Stack:",
      error?.stack
    );

    console.error("\n📍 REQUEST INFORMATION");

    console.error(
      "URL:",
      req?.originalUrl
    );

    console.error(
      "Method:",
      req?.method
    );

    console.error(
      "Params:",
      req?.params
    );

    console.error(
      "Query:",
      req?.query
    );

    console.error("\n🍪 SESSION INFORMATION");

    console.error(
      "Session ID:",
      req?.sessionID
    );

    console.error(
      "Session:",
      req?.session
    );

    console.error(
      "Affiliate Referral:",
      req?.session?.affiliateReferral
    );

    console.error(
      "\n⏱️ Duration:",
      `${duration}ms`
    );

    console.error("\n");
    console.error("==============================================================");
    console.error("❌ AFFILIATE TRACKING FAILED");
    console.error("➡️ Redirecting user to home");
    console.error("==============================================================\n");

    return res.redirect("/");
  }
};


export const requestWithdrawal = async (req, res) => {
  const traceId = `wdr_${Date.now()}`;
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const {
      amount,
      paymentMethod = "bank",
      paymentDetails = {},
      notes = "",
    } = req.body;

    const userId = req.user?._id || req.user?.id;

    console.log(`🚀 [${traceId}][requestWithdrawal] START`, {
      userId,
      rawAmount: amount,
      paymentMethod,
      hasPaymentDetails: !!paymentDetails,
      notesLength: notes ? String(notes).length : 0,
    });

    // ==========================
    // Validate User
    // ==========================
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn(`⚠️ [${traceId}][requestWithdrawal] Invalid userId:`, userId);
      await session.abortTransaction();

      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    // ==========================
    // Validate Amount
    // ==========================
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      console.warn(`⚠️ [${traceId}][requestWithdrawal] Invalid amount:`, {
        rawAmount: amount,
        parsedAmount: withdrawAmount,
      });
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    const MIN_WITHDRAWAL = 100;

    if (withdrawAmount < MIN_WITHDRAWAL) {
      console.warn(`⚠️ [${traceId}][requestWithdrawal] Below minimum withdrawal:`, {
        withdrawAmount,
        MIN_WITHDRAWAL,
      });
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`,
      });
    }

    // ==========================
    // Validate Payment Details
    // ==========================
    if (paymentMethod === "bank") {
      const hasHolder = !!paymentDetails.accountHolderName;
      const hasAccount = !!paymentDetails.accountNumber;
      const hasIfsc = !!paymentDetails.ifsc;

      console.log(`🔍 [${traceId}][requestWithdrawal] Checking bank details:`, {
        hasHolder,
        hasAccount,
        hasIfsc,
      });

      if (!hasHolder || !hasAccount || !hasIfsc) {
        console.warn(`⚠️ [${traceId}][requestWithdrawal] Incomplete bank details`);
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Complete bank details are required.",
        });
      }
    } else if (paymentMethod === "upi") {
      const hasUpi = !!paymentDetails.upiId;
      console.log(`🔍 [${traceId}][requestWithdrawal] Checking UPI details:`, { hasUpi });

      if (!hasUpi) {
        console.warn(`⚠️ [${traceId}][requestWithdrawal] Missing UPI ID`);
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "UPI ID is required.",
        });
      }
    } else {
      console.warn(`⚠️ [${traceId}][requestWithdrawal] Unhandled paymentMethod:`, paymentMethod);
    }

    // ==========================
    // Find User
    // ==========================
    const user = await User.findById(userId).session(session);

    if (!user) {
      console.warn(`⚠️ [${traceId}][requestWithdrawal] User not found in DB:`, userId);
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`✅ [${traceId}][requestWithdrawal] User found:`, {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // ==========================
    // Atomic Balance Update
    // ==========================
    console.log(`💸 [${traceId}][requestWithdrawal] Attempting atomic balance deduction:`, {
      userId,
      withdrawAmount,
    });

    const affiliate = await Affiliate.findOneAndUpdate(
      {
        user: userId,
        totalEarnings: { $gte: withdrawAmount },
      },
      {
        $inc: {
          totalEarnings: -withdrawAmount,
          totalWithdrawn: withdrawAmount,
        },
      },
      {
        new: true,
        session,
      }
    );

    if (!affiliate) {
      const existingAffiliate = await Affiliate.findOne({ user: userId })
        .select("_id totalEarnings totalWithdrawn status")
        .session(session)
        .lean();

      console.warn(`⚠️ [${traceId}][requestWithdrawal] Atomic update failed:`, {
        userId,
        withdrawAmount,
        existingAffiliate: existingAffiliate || "NO_AFFILIATE_DOC",
      });

      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient balance or affiliate not found",
      });
    }

    console.log(`💾 [${traceId}][requestWithdrawal] Affiliate balance updated:`, {
      affiliateId: affiliate._id,
      remainingEarnings: affiliate.totalEarnings,
      totalWithdrawn: affiliate.totalWithdrawn,
    });

    // ==========================
    // Create Withdrawal
    // ==========================
    const [withdrawal] = await AffiliateWithdrawal.create(
      [
        {
          affiliate: affiliate._id,
          user: userId,
          amount: withdrawAmount,
          paymentMethod,
          paymentDetails: {
            ...paymentDetails,
            userName: user.name,
            userEmail: user.email,
          },
          notes,
          status: "pending",
        },
      ],
      { session }
    );

    console.log(`📝 [${traceId}][requestWithdrawal] Withdrawal created:`, {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      status: withdrawal.status,
    });

    // ==========================
    // Find Admins
    // ==========================
    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] },
    })
      .select("_id")
      .lean();

    console.log(`👥 [${traceId}][requestWithdrawal] Admins found for notification:`, admins.length);

    // ==========================
    // Notifications
    // ==========================
    const notifications = [];

    admins.forEach((admin) => {
      notifications.push({
        user: admin._id,
        type: "withdrawal_request",
        title: `💰 New Withdrawal Request - ₹${withdrawAmount}`,
        message: `${user.name} requested ₹${withdrawAmount}`,
        priority: "high",
        data: {
          withdrawalId: withdrawal._id,
        },
      });
    });

    notifications.push({
      user: user._id,
      type: "withdrawal_request",
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request of ₹${withdrawAmount} has been submitted successfully.`,
      priority: "medium",
      data: {
        withdrawalId: withdrawal._id,
      },
    });

    await Notification.insertMany(notifications, { session });
    console.log(`🔔 [${traceId}][requestWithdrawal] Notifications inserted:`, notifications.length);

    // ==========================
    // Commit
    // ==========================
    await session.commitTransaction();
    console.log(`✅ [${traceId}][requestWithdrawal] TRANSACTION COMMITTED SUCCESSFULLY`);

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        withdrawal,
        remainingEarnings: affiliate.totalEarnings,
      },
    });
  } catch (error) {
    console.error(`❌ [${traceId}][requestWithdrawal] FATAL ERROR:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    try {
      await session.abortTransaction();
      console.log(`↩️ [${traceId}][requestWithdrawal] Transaction aborted`);
    } catch (abortErr) {
      console.error(`⚠️ [${traceId}][requestWithdrawal] Abort transaction failed:`, abortErr.message);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  } finally {
    await session.endSession();
    console.log(`🔒 [${traceId}][requestWithdrawal] Session ended`);
  }
};


// @desc    Get withdrawal history
// @route   GET /api/affiliate/withdrawals



export const getAffiliateDashboard = async (req, res) => {
  try {
    console.log("[getAffiliateDashboard] Request received:", {
      userId: req.user?._id,
      query: req.query,
    });

    const userId = req.user._id;

    // ==========================================
    // FIND AFFILIATE
    // ==========================================

    const affiliate = await Affiliate.findOne({
      user: userId,
    });
    console.log("[getAffiliateDashboard] Affiliate lookup result:", affiliate?._id || null);

    if (!affiliate) {
      console.warn("[getAffiliateDashboard] User is not an affiliate member:", userId);
      return res.status(404).json({
        success: false,
        message: 'Not an affiliate member',
      });
    }

    // ==========================================
    // LINK PAGINATION
    // ==========================================

    const linkPage = Math.max(
      Number(req.query.linkPage) || 1,
      1
    );

    const linkLimit = Math.min(
      Math.max(
        Number(req.query.linkLimit) || 10,
        1
      ),
      200
    );

    const linkSkip = (linkPage - 1) * linkLimit;

    console.log("[getAffiliateDashboard] Pagination calculated:", {
      linkPage,
      linkLimit,
      linkSkip,
    });

    // ==========================================
    // START OF CURRENT MONTH
    // ==========================================

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    console.log("[getAffiliateDashboard] startOfMonth:", startOfMonth.toISOString());

    // ==========================================
    // FETCH LINKS + COUNT + REFERRALS + EARNINGS
    // ==========================================

    console.log("[getAffiliateDashboard] Running parallel queries for affiliate:", affiliate._id);
    const [
      links,
      totalLinks,
      referrals,
      monthlyEarnings,
    ] = await Promise.all([
      // paginated links
      AffiliateLink.find({
        affiliate: affiliate._id,
      })
        .sort({ createdAt: -1 })
        .skip(linkSkip)
        .limit(linkLimit)
        .lean(),

      // total links count
      AffiliateLink.countDocuments({
        affiliate: affiliate._id,
      }),

      // all referrals for this affiliate
      AffiliateReferral.find({
        affiliate: affiliate._id,
      }).lean(),

      // monthly earnings
      AffiliateReferral.aggregate([
        {
          $match: {
            affiliate: new mongoose.Types.ObjectId(
              affiliate._id
            ),
            createdAt: {
              $gte: startOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$commission',
            },
          },
        },
      ]),
    ]);

    console.log("[getAffiliateDashboard] Parallel query counts:", {
      fetchedLinksCount: links.length,
      totalLinks,
      totalReferralsDocs: referrals.length,
      monthlyEarningsAgg: monthlyEarnings,
    });

    // ==========================================
    // TOTAL PAGES
    // ==========================================

    const totalPages = Math.max(
      1,
      Math.ceil(totalLinks / linkLimit)
    );

    // ==========================================
    // ACTIVE LINKS
    // ==========================================

    const activeLinks =
      await AffiliateLink.countDocuments({
        affiliate: affiliate._id,
        status: 'active',
      });
    console.log("[getAffiliateDashboard] activeLinks count:", activeLinks);

    // ==========================================
    // RECENT REFERRALS
    // ==========================================

    const recentReferrals =
      await AffiliateReferral.find({
        affiliate: affiliate._id,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('referredUser', 'name email')
        .lean();
    console.log("[getAffiliateDashboard] recentReferrals count:", recentReferrals.length);

    // ==========================================
    // SAFE NUMBERS
    // ==========================================

    const totalClicks =
      Number(affiliate.totalClicks) || 0;

    const totalConversions =
      Number(affiliate.totalConversions) || 0;

    const conversionRate =
      totalClicks > 0
        ? ((totalConversions / totalClicks) * 100).toFixed(2)
        : 0;

    // ==========================================
    // RESPONSE DATA
    // ==========================================

    const data = {
      affiliate,

      stats: {
        totalClicks,

        totalReferrals:
          Number(affiliate.totalReferrals) || 0,

        totalConversions,

        totalEarnings:
          Number(affiliate.totalEarnings) || 0,

        monthlyEarnings:
          monthlyEarnings[0]?.total || 0,

        activeLinks,

        conversionRate,
      },

      recentReferrals,

      // current page links
      links,

      // ==========================================
      // PAGINATION (matches frontend `linkPagination`)
      // ==========================================
      linkPagination: {
        page: linkPage,
        limit: linkLimit,
        total: totalLinks,
        pages: totalPages,

        hasNextPage: linkPage < totalPages,
        hasPreviousPage: linkPage > 1,
      },

      // ==========================================
      // BACKWARD COMPAT (optional alias)
      // ==========================================
      linksPagination: {
        page: linkPage,
        limit: linkLimit,
        total: totalLinks,
        pages: totalPages,

        hasNextPage: linkPage < totalPages,
        hasPreviousPage: linkPage > 1,
      },
    };

    // ==========================================
    // DEBUG
    // ==========================================

    console.log("[getAffiliateDashboard] Stats payload:", data.stats);
    console.log("[getAffiliateDashboard] Pagination payload:", data.linkPagination);
    console.log("[getAffiliateDashboard] Links returned:", data.links.length);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[getAffiliateDashboard] Error:", {
      message: error?.message,
      stack: error?.stack,
      error,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const joinAffiliateProgram = async (req, res) => {
  try {
    console.log("[joinAffiliateProgram] Request received");
    console.log("[joinAffiliateProgram] req.user:", req.user);

    const userId = req.user?._id;
    console.log("[joinAffiliateProgram] userId:", userId);

    if (!userId) {
      console.log("[joinAffiliateProgram] Missing userId on req.user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user ID missing",
      });
    }

    const existing = await Affiliate.findOne({ user: userId });
    console.log("[joinAffiliateProgram] Existing affiliate check:", existing);

    if (existing) {
      console.log("[joinAffiliateProgram] User is already an affiliate:", existing._id);
      return res.status(400).json({
        success: false,
        message: "Already an affiliate member",
      });
    }

    const affiliateCode = "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log("[joinAffiliateProgram] Generated affiliateCode:", affiliateCode);

    const affiliate = await Affiliate.create({
      user: userId,
      affiliateCode,
      status: "active",
      commissionRate: 10,
    });
    console.log("[joinAffiliateProgram] Created affiliate:", affiliate);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isAffiliate: true,
        affiliateId: affiliate._id,
      },
      { new: true }
    );
    console.log("[joinAffiliateProgram] Updated user:", updatedUser);

    res.status(201).json({
      success: true,
      message: "Joined affiliate program successfully",
      data: affiliate,
    });
  } catch (error) {
    console.error("[joinAffiliateProgram] Caught error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

