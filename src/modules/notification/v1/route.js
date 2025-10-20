import { Router } from "express";
import { NotificationController } from "./controller.js";

const router = Router();
const notificationController = new NotificationController();

// Get notifications for a specific guide
router.get("/guide/:userId", (req, res) =>
  notificationController.getGuideNotifications(req, res)
);

// Mark a notification as read
router.put("/:notificationId/read", (req, res) =>
  notificationController.markNotificationAsRead(req, res)
);

// Mark all notifications as read for a user
router.put("/guide/:userId/mark-all-read", (req, res) =>
  notificationController.markAllNotificationsAsRead(req, res)
);

// Get unread count for a user
router.get("/guide/:userId/unread-count", (req, res) =>
  notificationController.getUnreadCount(req, res)
);

// Create a notification (for internal use)
router.post("/", (req, res) =>
  notificationController.createNotification(req, res)
);

export default router;
