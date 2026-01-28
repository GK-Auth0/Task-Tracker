export const createProjectSchema = {
  name: {
    notEmpty: {
      errorMessage: "Project name is required",
    },
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Project name must be between 2 and 100 characters",
    },
  },
  description: {
    optional: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "Description must not exceed 500 characters",
    },
  },
};
