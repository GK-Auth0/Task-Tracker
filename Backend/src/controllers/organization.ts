import { Request, Response } from "express";
import { handleValidationErrors } from "../helpers/validation";
import { createOrganization } from "../services/organization";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    name?: string;
  };
};

export const createOrg = async (req: AuthenticatedRequest, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    const response = await createOrganization({
      name,
      created_by: userId,
      admin: typeof req.body.admin === "string" ? req.body.admin : userId,
      description:
        typeof req.body.description === "string" ? req.body.description.trim() : undefined,
      logo_url: typeof req.body.logo_url === "string" ? req.body.logo_url.trim() : undefined,
      capacity: typeof req.body.capacity === "number" ? req.body.capacity : undefined,
      status:
        req.body.status === "active" || req.body.status === "inactive"
          ? req.body.status
          : undefined,
      industry: typeof req.body.industry === "string" ? req.body.industry.trim() : undefined,
      website_url:
        typeof req.body.website_url === "string" ? req.body.website_url.trim() : undefined,
      contact_email:
        typeof req.body.contact_email === "string" ? req.body.contact_email.trim() : undefined,
      phone_number:
        typeof req.body.phone_number === "string" ? req.body.phone_number.trim() : undefined,
      address_line_1:
        typeof req.body.address_line_1 === "string" ? req.body.address_line_1.trim() : undefined,
      address_line_2:
        typeof req.body.address_line_2 === "string" ? req.body.address_line_2.trim() : undefined,
      city: typeof req.body.city === "string" ? req.body.city.trim() : undefined,
      state: typeof req.body.state === "string" ? req.body.state.trim() : undefined,
      country: typeof req.body.country === "string" ? req.body.country.trim() : undefined,
      postal_code:
        typeof req.body.postal_code === "string" ? req.body.postal_code.trim() : undefined,
    });

    return res.status(response.statusCode).json({
      success: true,
      message: "Organization created successfully",
      data: response.data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create organization",
      error: (error as Error).message,
    });
  }
};
