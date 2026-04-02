import { Op } from "sequelize";
import { Invite, Organization, User } from "../models";
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
const ORG_CODE_PREFIX = "TT";
const ORG_CODE_DIGITS = 4;

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

const buildOrgCodeCandidate = (value: number) =>
  `${ORG_CODE_PREFIX}${String(value).padStart(ORG_CODE_DIGITS, "0")}`;

export async function generateOrganizationCode() {
  const maxCodeValue = 10 ** ORG_CODE_DIGITS - 1;

  for (let attempt = 0; attempt < maxCodeValue; attempt += 1) {
    const candidate = buildOrgCodeCandidate(Math.floor(Math.random() * maxCodeValue) + 1);
    const existingOrganization = await Organization.findOne({
      where: { org_code: candidate },
      attributes: ["id"],
    });

    if (!existingOrganization) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique organization code");
}

export async function getOrganization(id: string) {
  return Organization.findOne({
    where: { id },
    attributes: ORGANIZATION_ATTRIBUTES,
  });
}

export async function getOrganizationByCode(orgCode: string) {
  return Organization.findOne({
    where: { org_code: orgCode.trim().toUpperCase() },
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

  const creator = await User.findByPk(createdBy, {
    attributes: ["id", "organization_id"],
  });

  if (!creator) {
    throw new Error("Creator not found");
  }

  if (creator.organization_id) {
    throw new Error("User is already linked to an organization");
  }

  const slug = await generateOrganizationSlug(name);
  const orgCode = await generateOrganizationCode();

  const organization = await Organization.create({
    ...dto,
    name,
    org_code: orgCode,
    slug,
    admin,
    created_by: createdBy,
  });

  creator.organization_id = organization.id;
  await creator.save();

  return {
    statusCode: 201,
    data: await getOrganization(organization.id),
  };
}

export async function joinOrganizationByCode(userId: string, orgCode: string) {
  const normalizedCode = orgCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("Organization code is required");
  }

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.organization_id) {
    throw new Error("User is already linked to an organization");
  }

  const invite = await Invite.findOne({
    where: {
      org_code: normalizedCode,
      status: "pending",
      [Op.or]: [
        { invitee_id: user.id },
        { invitee_email: user.email },
      ],
    },
    attributes: ["id", "inviter_id", "invitee_id", "expires_at"],
  });

  if (!invite) {
    throw new Error("Invitation code not found for this user");
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    await invite.update({ status: "expired" });
    throw new Error("Invitation code has expired");
  }

  const inviter = await User.findByPk(invite.inviter_id, {
    attributes: ["id", "organization_id"],
  });

  if (!inviter?.organization_id) {
    throw new Error("Inviter organization not found");
  }

  user.organization_id = inviter.organization_id;
  await user.save();

  await invite.update({
    invitee_id: invite.invitee_id || user.id,
    status: "accepted",
    accepted_at: new Date(),
  });

  return getOrganization(inviter.organization_id);
}
