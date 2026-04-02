import {
  createOrganization,
  generateOrganizationSlug,
  getOrganizations,
} from "../services/organization";
import { Organization } from "../models";

jest.mock("../models", () => ({
  Organization: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
}));

const mockedOrganization = Organization as jest.Mocked<typeof Organization>;

describe("organization service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateOrganizationSlug", () => {
    it("generates a normalized slug when available", async () => {
      mockedOrganization.findOne.mockResolvedValueOnce(null as never);

      const slug = await generateOrganizationSlug("Task Tracker Labs");

      expect(slug).toBe("task-tracker-labs");
      expect(mockedOrganization.findOne).toHaveBeenCalledWith({
        where: { slug: "task-tracker-labs" },
        attributes: ["id"],
      });
    });

    it("adds a numeric suffix when the slug already exists", async () => {
      mockedOrganization.findOne
        .mockResolvedValueOnce({ id: "org-1" } as never)
        .mockResolvedValueOnce(null as never);

      const slug = await generateOrganizationSlug("Task Tracker Labs");

      expect(slug).toBe("task-tracker-labs-2");
      expect(mockedOrganization.findOne).toHaveBeenNthCalledWith(1, {
        where: { slug: "task-tracker-labs" },
        attributes: ["id"],
      });
      expect(mockedOrganization.findOne).toHaveBeenNthCalledWith(2, {
        where: { slug: "task-tracker-labs-2" },
        attributes: ["id"],
      });
    });
  });

  describe("getOrganizations", () => {
    it("sanitizes pagination values and returns metadata", async () => {
      mockedOrganization.findAndCountAll.mockResolvedValueOnce({
        count: 3,
        rows: [{ id: "org-1" }],
      } as never);

      const result = await getOrganizations({ limit: 0, offset: -10 });

      expect(mockedOrganization.findAndCountAll).toHaveBeenCalledWith({
        attributes: ["id", "name", "org_code", "slug", "capacity", "status", "logo_url"],
        order: [["created_at", "ASC"]],
        limit: 1,
        offset: 0,
      });
      expect(result).toEqual({
        total: 3,
        data: [{ id: "org-1" }],
        page: 1,
        limit: 1,
        totalPages: 3,
      });
    });
  });

  describe("createOrganization", () => {
    it("creates an organization, defaults admin, and returns service response", async () => {
      mockedOrganization.findOne
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce({
          id: "org-123",
          name: "Task Tracker Labs",
          slug: "task-tracker-labs",
        } as never);
      mockedOrganization.create.mockResolvedValueOnce({ id: "org-123" } as never);

      const result = await createOrganization({
        name: "  Task Tracker Labs  ",
        created_by: "user-123",
        description: "Workspace",
      });

      expect(mockedOrganization.create).toHaveBeenCalledWith({
        name: "Task Tracker Labs",
        created_by: "user-123",
        admin: "user-123",
        description: "Workspace",
        slug: "task-tracker-labs",
      });
      expect(result).toEqual({
        statusCode: 201,
        data: {
          id: "org-123",
          name: "Task Tracker Labs",
          slug: "task-tracker-labs",
        },
      });
    });

    it("throws when name is empty after trimming", async () => {
      await expect(
        createOrganization({
          name: "   ",
          created_by: "user-123",
        }),
      ).rejects.toThrow("Organization name is required");
    });

    it("throws when created_by is empty after trimming", async () => {
      await expect(
        createOrganization({
          name: "Task Tracker Labs",
          created_by: "   ",
        }),
      ).rejects.toThrow("created_by is required");
    });
  });
});
