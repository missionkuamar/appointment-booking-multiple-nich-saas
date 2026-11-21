import Notification from "./Notification.models.js";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100];

// @desc    Get user notifications
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { page = 1, limit = 10, isRead } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = parseInt(limit, 10);
    const limitNum = ALLOWED_LIMITS.includes(parsedLimit) ? parsedLimit : 10;

    const query = { user: userId };
    if (isRead === "true" || isRead === "false") {
      query.isRead = isRead === "true";
    }

    const [total, unreadCount] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const currentPage = Math.min(pageNum, totalPages);
    const skip = (currentPage - 1) * limitNum;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};