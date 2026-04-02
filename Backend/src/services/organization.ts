import { Organization } from "../models";
import {
  CreateOrganization,
  GetOrganizationsOptions,
  ServiceResponse,
} from "../types/organization";

const ORGANIZATION_ATTRIBUTES: string[] = [
  "id",
  "name",
  "org_code",
  "slug",
  "capacity",
  "status",
  "logo_url",
];

const MAX_SLUG_LENGTH = 255;

const normalizeSlug = (value: string) => {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalizedValue.slice(0, MAX_SLUG_LENGTH) || "organization";
};

const buildSlugCandidate = (baseSlug: string, index: number) => {
  if (index === 0) {
    return baseSlug;
  }

  const suffix = `-${index + 1}`;
  const trimmedBaseSlug = baseSlug
    .slice(0, MAX_SLUG_LENGTH - suffix.length)
    .replace(/-+$/g, "");

  return `${trimmedBaseSlug}${suffix}`;
};

export async function generateOrganizationSlug(name: string) {
  const baseSlug = normalizeSlug(name);
  let index = 0;

  while (true) {
    const slug = buildSlugCandidate(baseSlug, index);
    const existingOrganization = await Organization.findOne({
      where: { slug },
      attributes: ["id"],
    });

    if (!existingOrganization) {
      return slug;
    }

    index += 1;
  }
}

export async function getOrganization(id: string) {
  return Organization.findOne({
    where: { id },
    attributes: ORGANIZATION_ATTRIBUTES,
  });
}

export async function getOrganizations(options: GetOrganizationsOptions) {
  const safeLimit = Math.max(1, options.limit);
  const safeOffset = Math.max(0, options.offset);

  const { count, rows } = await Organization.findAndCountAll({
    attributes: ORGANIZATION_ATTRIBUTES,
    order: [["created_at", "ASC"]],
    limit: safeLimit,
    offset: safeOffset,
  });

  return {
    total: count,
    data: rows,
    page: Math.floor(safeOffset / safeLimit) + 1,
    limit: safeLimit,
    totalPages: Math.ceil(count / safeLimit),
  };
}

export async function createOrganization(
  dto: CreateOrganization,
): Promise<ServiceResponse<Awaited<ReturnType<typeof getOrganization>>>> {
  const name = dto.name.trim();
  const createdBy = dto.created_by.trim();
  const admin = dto.admin?.trim() || createdBy;

  if (!name) {
    throw new Error("Organization name is required");
  }

  if (!createdBy) {
    throw new Error("created_by is required");
  }

  const slug = await generateOrganizationSlug(name);

  const organization = await Organization.create({
    ...dto,
    name,
    slug,
    admin,
    created_by: createdBy,
  });

  return {
    statusCode: 201,
    data: await getOrganization(organization.id),
  };
}
