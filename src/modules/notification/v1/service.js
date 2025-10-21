import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class NotificationService {
  // Create a notification
  async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedId: data.relatedId || null,
        },
      });
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Get notifications for a specific user (guide)
  async getNotificationsByUserId(userId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: parseInt(userId),
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: parseInt(notificationId),
        },
        data: {
          read: true,
        },
      });
      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: parseInt(userId),
          read: false,
        },
        data: {
          read: true,
        },
      });
      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: parseInt(userId),
          read: false,
        },
      });
      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  // Create notification for tour moderation (approve/reject)
  async createTourModerationNotification(
    guideId,
    tourTitle,
    status,
    moderatorName
  ) {
    const data = {
      userId: guideId,
      type: status === "published" ? "tour_approved" : "tour_rejected",
      title:
        status === "published"
          ? "Tour Package Approved"
          : "Tour Package Rejected",
      message:
        status === "published"
          ? `Your tour package "${tourTitle}" has been approved by ${moderatorName} and is now published!`
          : `Your tour package "${tourTitle}" has been rejected by ${moderatorName}. Please review and resubmit.`,
    };

    return this.createNotification(data);
  }
}

export default NotificationService;
