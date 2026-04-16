import { error } from "console";
import { NotEmpty } from "sequelize-typescript";
import { isAlpha } from "validator";

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
      options: { min: 1, max: 50 },
      errorMessage: "Last name must be between 2 and 50 characters",
    },
  },
};


export const updateSchema = {
  firstName: {
    optional: true,
    // isAlpha: {
    //   errorMessage: "firstName name should contains only"
    // },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "First name must be between 2 and 50 characters"
    }
  },
  lastName: {
    optional: true,
    isLength: {
      options: { min: 1, max: 50 },
      errorMessage: "Last name must be between 1 and 50 characters"
    }
  }
}


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

export const auth0LoginSchema = {
  accessToken: {
    notEmpty: {
      errorMessage: "Auth0 access token is required",
    },
    isString: {
      errorMessage: "Auth0 access token must be a string",
    },
  },
};

export const verifyOtpSchema = {
  otpSessionId: {
    notEmpty: {
      errorMessage: "OTP session ID is required",
    },
    isUUID: {
      errorMessage: "OTP session ID must be a valid UUID",
    },
  },
  otp: {
    notEmpty: {
      errorMessage: "OTP is required",
    },
    isLength: {
      options: { min: 6, max: 6 },
      errorMessage: "OTP must be 6 digits",
    },
    isNumeric: {
      errorMessage: "OTP must contain only numbers",
    },
  },
};

export const resendOtpSchema = {
  otpSessionId: {
    notEmpty: {
      errorMessage: "OTP session ID is required",
    },
    isUUID: {
      errorMessage: "OTP session ID must be a valid UUID",
    },
  },
};

export const forgotPasswordSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
};

export const resetPasswordSchema = {
  otpSessionId: {
    notEmpty: {
      errorMessage: "OTP session ID is required",
    },
    isUUID: {
      errorMessage: "OTP session ID must be a valid UUID",
    },
  },
  otp: {
    notEmpty: {
      errorMessage: "OTP is required",
    },
    isLength: {
      options: { min: 6, max: 6 },
      errorMessage: "OTP must be 6 digits",
    },
    isNumeric: {
      errorMessage: "OTP must contain only numbers",
    },
  },
  newPassword: {
    isLength: {
      options: { min: 6 },
      errorMessage: "New password must be at least 6 characters long",
    },
  },
};

export const changePasswordInvitedSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  newPassword: {
    isLength: {
      options: { min: 8 },
      errorMessage: "New password must be at least 8 characters long",
    },
  },
};


