export const registerSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  password: {
    isLength: {
      options: { min: 6 },
      errorMessage: "Password must be at least 6 characters long",
    },
  },
  firstName: {
    notEmpty: {
      errorMessage: "First name is required",
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "First name must be between 2 and 50 characters",
    },
  },
  lastName: {
    notEmpty: {
      errorMessage: "Last name is required",
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "Last name must be between 2 and 50 characters",
    },
  },
};

export const loginSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  password: {
    notEmpty: {
      errorMessage: "Password is required",
    },
  },
};