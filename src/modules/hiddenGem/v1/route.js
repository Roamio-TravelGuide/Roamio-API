import { Router } from "express";
import hiddenGemController from "./controller.js";

const router = Router();

router.get('/guide/:guideId', hiddenGemController.getHiddenGemById);

export default router;