import api from "./auth";
import type { OrganizationSummary } from "./auth";

export const organizationAPI = {
  createOrganization: async (data: { name: string }) => {
    const response = await api.post("/api/organizations", data);
    return response.data as {
      success: boolean;
      message: string;
      data: OrganizationSummary;
    };
  },

  joinOrganizationByCode: async (orgCode: string) => {
    const response = await api.post("/api/organizations/join-by-code", {
      org_code: orgCode,
    });
    return response.data as {
      success: boolean;
      message: string;
      data: OrganizationSummary;
    };
  },
};
