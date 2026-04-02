export const createOrganizationSchema = {
  name: {
    trim: true,
    notEmpty: {
      errorMessage: "Organization name is required",
    },
    isLength: {
      options: { min: 2, max: 255 },
      errorMessage: "Organization name must be between 2 and 255 characters",
    },
  },
  admin: {
    optional: true,
    isUUID: {
      errorMessage: "Admin must be a valid user ID",
    },
  },
  description: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 2000 },
      errorMessage: "Description must not exceed 2000 characters",
    },
  },
  logo_url: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "Logo URL must not exceed 500 characters",
    },
  },
  capacity: {
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "Capacity must be a positive integer",
    },
    toInt: true,
  },
  status: {
    optional: true,
    isIn: {
      options: [["active", "inactive"]],
      errorMessage: "Status must be one of: active, inactive",
    },
  },
  industry: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "Industry must not exceed 100 characters",
    },
  },
  website_url: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "Website URL must not exceed 500 characters",
    },
  },
  contact_email: {
    optional: true,
    trim: true,
    isEmail: {
      errorMessage: "Contact email must be valid",
    },
  },
  phone_number: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 30 },
      errorMessage: "Phone number must not exceed 30 characters",
    },
  },
  address_line_1: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 255 },
      errorMessage: "Address line 1 must not exceed 255 characters",
    },
  },
  address_line_2: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 255 },
      errorMessage: "Address line 2 must not exceed 255 characters",
    },
  },
  city: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "City must not exceed 100 characters",
    },
  },
  state: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "State must not exceed 100 characters",
    },
  },
  country: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "Country must not exceed 100 characters",
    },
  },
  postal_code: {
    optional: true,
    trim: true,
    isLength: {
      options: { max: 20 },
      errorMessage: "Postal code must not exceed 20 characters",
    },
  },
};
