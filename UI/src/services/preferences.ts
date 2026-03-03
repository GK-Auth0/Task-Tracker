import api from "./auth";

export type PinEntityType = "task" | "project";
export type SavedViewPage = "tasks" | "projects";

export interface PinnedItem {
  id: string;
  user_id: string;
  entity_type: PinEntityType;
  entity_id: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedView {
  id: string;
  user_id: string;
  page: SavedViewPage;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const preferencesAPI = {
  getPins: async (entityType?: PinEntityType): Promise<PinnedItem[]> => {
    const params = entityType ? `?entity_type=${entityType}` : "";
    const response = await api.get(`/api/preferences/pins${params}`);
    return response.data.data || [];
  },

  addPin: async (
    entityType: PinEntityType,
    entityId: string,
    note?: string,
  ): Promise<PinnedItem> => {
    const response = await api.post("/api/preferences/pins", {
      entity_type: entityType,
      entity_id: entityId,
      note,
    });
    return response.data.data;
  },

  removePin: async (entityType: PinEntityType, entityId: string): Promise<void> => {
    await api.delete(`/api/preferences/pins/${entityType}/${entityId}`);
  },

  getSavedViews: async (page: SavedViewPage): Promise<SavedView[]> => {
    const response = await api.get(`/api/preferences/saved-views?page=${page}`);
    return response.data.data || [];
  },

  createSavedView: async (payload: {
    page: SavedViewPage;
    name: string;
    filters: Record<string, unknown>;
    is_default?: boolean;
  }): Promise<SavedView> => {
    const response = await api.post("/api/preferences/saved-views", payload);
    return response.data.data;
  },

  deleteSavedView: async (id: string): Promise<void> => {
    await api.delete(`/api/preferences/saved-views/${id}`);
  },
};

export default preferencesAPI;
