import NotificationService from "./service.js";

const notificationService = new NotificationService();

export class NotificationController {
  // Get notifications for a guide
  async getGuideNotifications(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const notifications = await notificationService.getNotificationsByUserId(
        userId
      );

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Error fetching guide notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Mark a notification as read
  async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "Notification ID is required",
        });
      }

      const notification = await notificationService.markAsRead(notificationId);

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const result = await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: `${result.count} notifications marked as read`,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get unread count for a user
  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const count = await notificationService.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Create a notification (for internal use)
  async createNotification(req, res) {
    try {
      const { userId, type, title, message, relatedId } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "userId, type, title, and message are required",
        });
      }

      const notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        relatedId,
      });

      return res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
