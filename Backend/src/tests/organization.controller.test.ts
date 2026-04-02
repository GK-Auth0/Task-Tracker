import { Request, Response } from "express";
import { createOrg } from "../controllers/organization";
import { createOrganization } from "../services/organization";

jest.mock("../helpers/validation", () => ({
  handleValidationErrors: jest.fn(() => false),
}));

jest.mock("../services/organization", () => ({
  createOrganization: jest.fn(),
}));

const mockedCreateOrganization = createOrganization as jest.MockedFunction<
  typeof createOrganization
>;

const createResponseMock = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    status,
    json,
    response: { status, json } as unknown as Response,
  };
};

describe("createOrg controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 201 and created organization data", async () => {
    mockedCreateOrganization.mockResolvedValue({
      statusCode: 201,
      data: {
        id: "org-123",
        name: "Task Tracker Labs",
        slug: "task-tracker-labs",
        status: "active",
      } as any,
    });

    const req = {
      user: { id: "user-123" },
      body: {
        name: "Task Tracker Labs",
        description: "Internal workspace",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await createOrg(req, response);

    expect(mockedCreateOrganization).toHaveBeenCalledWith({
      name: "Task Tracker Labs",
      created_by: "user-123",
      admin: "user-123",
      description: "Internal workspace",
      logo_url: undefined,
      capacity: undefined,
      status: undefined,
      industry: undefined,
      website_url: undefined,
      contact_email: undefined,
      phone_number: undefined,
      address_line_1: undefined,
      address_line_2: undefined,
      city: undefined,
      state: undefined,
      country: undefined,
      postal_code: undefined,
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Organization created successfully",
      data: {
        id: "org-123",
        name: "Task Tracker Labs",
        slug: "task-tracker-labs",
        status: "active",
      },
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    const req = {
      body: {
        name: "Task Tracker Labs",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await createOrg(req, response);

    expect(mockedCreateOrganization).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "User not authenticated",
    });
  });

  it("returns 400 when service throws", async () => {
    mockedCreateOrganization.mockRejectedValue(new Error("Organization already exists"));

    const req = {
      user: { id: "user-123" },
      body: {
        name: "Task Tracker Labs",
      },
    } as unknown as Request;
    const { response, status, json } = createResponseMock();

    await createOrg(req, response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to create organization",
      error: "Organization already exists",
    });
  });
});
