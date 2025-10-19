import { Router } from "express";
import multer from "multer";
import hiddenGemController from "./controller.js";
import authenticate from "../../../middleware/auth.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  }
});

router.get('/guide/:guideId', hiddenGemController.getHiddenGemById);

router.post('/create', authenticate, upload.array('images', 10), hiddenGemController.createNewHiddenGem);

router.get('/moderation', authenticate, hiddenGemController.getHiddenGemsForModeration);
router.patch('/:id/status', authenticate, hiddenGemController.updateHiddenGemStatus);
router.get('/moderation/stats', authenticate, hiddenGemController.getModerationStats);

export default router;