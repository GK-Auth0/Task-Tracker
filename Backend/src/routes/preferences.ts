import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  addPinnedItem,
  createView,
  getPinnedItems,
  getSavedViews,
  removePinnedItem,
  removeView,
  updateView,
} from "../controllers/preferences";

const router = express.Router();

router.use(authenticateToken);

router.get("/pins", getPinnedItems);
router.post("/pins", addPinnedItem);
router.delete("/pins/:entityType/:entityId", removePinnedItem);

router.get("/saved-views", getSavedViews);
router.post("/saved-views", createView);
router.patch("/saved-views/:id", updateView);
router.delete("/saved-views/:id", removeView);

export default router;
