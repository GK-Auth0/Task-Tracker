import { Request, Response } from "express";
import {
  createPin,
  createSavedView,
  deletePin,
  deleteSavedView,
  listPins,
  listSavedViews,
  updateSavedView,
} from "../services/preferences";

const getUserId = (req: Request): string | null => {
  const user = (req as Request & { user?: { id?: string } }).user;
  return user?.id || null;
};

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

export const getPinnedItems = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const entityType = typeof req.query.entity_type === "string" ? req.query.entity_type : undefined;
    const data = await listPins(userId, entityType);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get pinned items",
      error: (error as Error).message,
    });
  }
};

export const addPinnedItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const entityType = String(req.body.entity_type || "");
    const entityId = String(req.body.entity_id || "");
    const note = req.body.note ? String(req.body.note) : undefined;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: "entity_type and entity_id are required",
      });
    }

    const data = await createPin(userId, entityType, entityId, note);
    return res.status(201).json({ success: true, data, message: "Item pinned" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to pin item",
      error: (error as Error).message,
    });
  }
};

export const removePinnedItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deletePin(
      userId,
      getParam(req.params.entityType),
      getParam(req.params.entityId),
    );
    return res.status(200).json({ success: true, message: "Pinned item removed" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to remove pinned item",
      error: (error as Error).message,
    });
  }
};

export const getSavedViews = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = typeof req.query.page === "string" ? req.query.page : undefined;
    const data = await listSavedViews(userId, page);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get saved views",
      error: (error as Error).message,
    });
  }
};

export const createView = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = String(req.body.page || "");
    const name = String(req.body.name || "").trim();
    const filters =
      req.body.filters && typeof req.body.filters === "object"
        ? (req.body.filters as Record<string, unknown>)
        : {};
    const isDefault = Boolean(req.body.is_default);

    if (!page || !name) {
      return res.status(400).json({
        success: false,
        message: "page and name are required",
      });
    }

    const data = await createSavedView(userId, page, name, filters, isDefault);
    return res.status(201).json({
      success: true,
      data,
      message: "Saved view created",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create saved view",
      error: (error as Error).message,
    });
  }
};

export const updateView = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updates: {
      name?: string;
      filters?: Record<string, unknown>;
      is_default?: boolean;
    } = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
    }
    if (req.body.filters && typeof req.body.filters === "object") {
      updates.filters = req.body.filters as Record<string, unknown>;
    }
    if (typeof req.body.is_default === "boolean") {
      updates.is_default = req.body.is_default;
    }

    const data = await updateSavedView(userId, getParam(req.params.id), updates);
    return res.status(200).json({ success: true, data, message: "Saved view updated" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update saved view",
      error: (error as Error).message,
    });
  }
};

export const removeView = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deleteSavedView(userId, getParam(req.params.id));
    return res.status(200).json({ success: true, message: "Saved view removed" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to remove saved view",
      error: (error as Error).message,
    });
  }
};
