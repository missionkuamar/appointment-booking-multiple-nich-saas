import mongoose from "mongoose";
import AffiliateWithdrawal from "./AffiliateWithdrawal.models.js";
import Affiliate from "./affiliate.models.js";
import User from "../models/user.js";
import Notification from "./Notification.models.js";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100, 200];

const computeWithdrawalStats = async () => {
  const rows = await AffiliateWithdrawal.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const stats = {
    breakdown: rows,
    pendingCount: 0,
    pendingTotal: 0,
    approvedCount: 0,
    approvedTotal: 0,
    completedCount: 0,
    completedTotal: 0,
    failedCount: 0,
    failedTotal: 0,
    totalRequests: 0,
    totalWithdrawn: 0,
  };

  for (const r of rows) {
    stats.totalRequests += r.count || 0;
    if (r._id === "pending") {
      stats.pendingCount = r.count || 0;
      stats.pendingTotal = r.totalAmount || 0;
    } else if (r._id === "approved") {
      stats.approvedCount = r.count || 0;
      stats.approvedTotal = r.totalAmount || 0;
    } else if (r._id === "completed") {
      stats.completedCount = r.count || 0;
      stats.completedTotal = r.totalAmount || 0;
      stats.totalWithdrawn = r.totalAmount || 0;
    } else if (r._id === "failed") {
      stats.failedCount = r.count || 0;
      stats.failedTotal = r.totalAmount || 0;
    }
  }

  return stats;
};

const createWithdrawalNotification = async ({
  userId,
  type,
  title,
  message,
  withdrawal,
  priority = "medium",
}) => {
  if (!userId) return;
  await Notification.create({
    user: userId,
    type,
    title,
    message,
    priority,
    data: {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      transactionId: withdrawal.transactionId || null,
    },
  });
};

// GET /api/admin/withdrawals
export const getAllWithdrawalsAdmin = async (req, res) => {
  try {
    const { status, search = "", page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const requestedLimit = parseInt(limit, 10);
    const limitNum = ALLOWED_LIMITS.includes(requestedLimit)
      ? requestedLimit
      : 20;

    const query = {};
    if (status) {
      query.status = status;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select("_id")
        .lean();

      const userIds = matchingUsers.map((u) => u._id);
      const orConditions = [{ transactionId: regex }];
      if (userIds.length > 0) {
        orConditions.push({ user: { $in: userIds } });
      }
      if (mongoose.Types.ObjectId.isValid(String(search).trim())) {
        orConditions.push({ _id: String(search).trim() });
      }
      query.$or = orConditions;
    }

    const total = await AffiliateWithdrawal.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limitNum;

    const [withdrawals, stats] = await Promise.all([
      AffiliateWithdrawal.find(query)
        .populate("user", "name email role")
        .populate("affiliate", "affiliateCode commissionRate status")
        .populate("processedBy", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      computeWithdrawalStats(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        withdrawals,
        stats,
        pagination: {
          page: currentPage,
          limit: limitNum,
          total,
          pages: totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch withdrawals",
    });
  }
};

// GET /api/admin/withdrawals/stats
export const getWithdrawalStatsAdmin = async (req, res) => {
  try {
    const stats = await computeWithdrawalStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch withdrawal stats",
    });
  }
};

// GET /api/admin/withdrawals/:id
export const getWithdrawalByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const withdrawal = await AffiliateWithdrawal.findById(id)
      .populate("user", "name email role")
      .populate("affiliate", "affiliateCode commissionRate totalEarnings totalWithdrawn")
      .populate("processedBy", "name email");

    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    return res.status(200).json({
      success: true,
      data: { withdrawal },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch withdrawal",
    });
  }
};

// PATCH /api/admin/withdrawals/:id/approve
export const approveWithdrawalAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    const withdrawal = await AffiliateWithdrawal.findById(id).populate(
      "user",
      "name email"
    );
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve withdrawal with status "${withdrawal.status}"`,
      });
    }

    withdrawal.status = "approved";
    if (notes) withdrawal.notes = notes;
    withdrawal.processedBy = req.user?._id || req.user?.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await createWithdrawalNotification({
      userId: withdrawal.user?._id || withdrawal.user,
      type: "withdrawal_approved",
      title: "Withdrawal Approved",
      message: `Your withdrawal request of ₹${Number(
        withdrawal.amount || 0
      ).toFixed(2)} has been approved.`,
      withdrawal,
    });

    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve withdrawal",
    });
  }
};

// PATCH /api/admin/withdrawals/:id/complete
export const completeWithdrawalAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, notes } = req.body || {};

    const withdrawal = await AffiliateWithdrawal.findById(id).populate(
      "user",
      "name email"
    );
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    if (!["pending", "approved", "processing"].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete withdrawal with status "${withdrawal.status}"`,
      });
    }

    const wasCompleted = withdrawal.status === "completed";
    withdrawal.status = "completed";
    if (transactionId) withdrawal.transactionId = transactionId;
    if (notes) withdrawal.notes = notes;
    withdrawal.processedBy = req.user?._id || req.user?.id;
    withdrawal.processedAt = withdrawal.processedAt || new Date();
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    if (!wasCompleted && withdrawal.affiliate) {
      await Affiliate.findByIdAndUpdate(withdrawal.affiliate, {
        $inc: { totalWithdrawn: Number(withdrawal.amount || 0) },
      });
    }

    await createWithdrawalNotification({
      userId: withdrawal.user?._id || withdrawal.user,
      type: "withdrawal_completed",
      title: "Withdrawal Completed",
      message: `Your withdrawal of ₹${Number(
        withdrawal.amount || 0
      ).toFixed(2)} has been completed${
        transactionId ? ` (Txn ID: ${transactionId})` : ""
      }.`,
      withdrawal,
      priority: "high",
    });

    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete withdrawal",
    });
  }
};

// PATCH /api/admin/withdrawals/:id/reject
export const rejectWithdrawalAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    const withdrawal = await AffiliateWithdrawal.findById(id).populate(
      "user",
      "name email"
    );
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed withdrawal cannot be rejected",
      });
    }

    withdrawal.status = "failed";
    if (notes) withdrawal.notes = notes;
    withdrawal.processedBy = req.user?._id || req.user?.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await createWithdrawalNotification({
      userId: withdrawal.user?._id || withdrawal.user,
      type: "withdrawal_rejected",
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of ₹${Number(
        withdrawal.amount || 0
      ).toFixed(2)} was rejected${notes ? `: ${notes}` : "."}`,
      withdrawal,
      priority: "high",
    });

    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject withdrawal",
    });
  }
};

// PATCH /api/admin/withdrawals/:id/cancel
export const cancelWithdrawalAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await AffiliateWithdrawal.findById(id);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });
    }

    withdrawal.status = "cancelled";
    withdrawal.processedBy = req.user?._id || req.user?.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel withdrawal",
    });
  }
};

// POST /api/admin/withdrawals/bulk-process
export const bulkProcessWithdrawalsAdmin = async (req, res) => {
  try {
    const { withdrawalIds = [], status, notes } = req.body || {};
    if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "withdrawalIds array is required" });
    }

    const allowedStatuses = ["approved", "completed", "failed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid target status" });
    }

    const updateFields = {
      status,
      processedBy: req.user?._id || req.user?.id,
      processedAt: new Date(),
    };
    if (notes) updateFields.notes = notes;
    if (status === "completed") updateFields.completedAt = new Date();

    const result = await AffiliateWithdrawal.updateMany(
      { _id: { $in: withdrawalIds } },
      { $set: updateFields }
    );

    return res.status(200).json({
      success: true,
      data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk process withdrawals",
    });
  }
};

// GET /api/admin/withdrawals/export
export const exportWithdrawalsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const list = await AffiliateWithdrawal.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const header = "ID,User Name,User Email,Amount,Method,Status,Transaction ID,Created At\n";
    const rows = list
      .map((w) =>
        [
          w._id,
          `"${(w.user?.name || "").replace(/"/g, '""')}"`,
          `"${(w.user?.email || "").replace(/"/g, '""')}"`,
          w.amount || 0,
          w.paymentMethod || "",
          w.status || "",
          w.transactionId || "",
          w.createdAt ? new Date(w.createdAt).toISOString() : "",
        ].join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=withdrawals.csv");
    return res.status(200).send(header + rows);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to export withdrawals",
    });
  }
};