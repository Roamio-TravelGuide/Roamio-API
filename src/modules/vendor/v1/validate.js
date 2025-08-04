import { body, validationResult } from "express-validator";

// Inline validation function
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());

    // Return all validation errors in a friendly format
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param || err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

export const validateUpdateVendorProfile = (data) => {
  const errors = {};

  if (!data.businessName || data.businessName.trim().length === 0) {
    errors.businessName = "Business name is required";
  } else if (data.businessName.length > 100) {
    errors.businessName = "Business name must be less than 100 characters";
  }

  if (data.description && data.description.length > 1000) {
    errors.description = "Description must be less than 1000 characters";
  }

  if (!data.email || !data.email.includes("@")) {
    errors.email = "Valid email is required";
  }

  if (
    data.socialMedia?.website &&
    !data.socialMedia.website.startsWith("http")
  ) {
    errors.website = "Website must start with http:// or https://";
  }

  return errors;
};

export const vendorProfileValidationRules = [
  body("businessName")
    .notEmpty()
    .withMessage("Business name is required")
    .isLength({ max: 100 })
    .withMessage("Business name must be less than 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),

  body("email").isEmail().withMessage("Valid email is required"),

  body("phone").optional().isString().withMessage("Phone must be a string"),

  body("socialMedia")
    .optional()
    .isObject()
    .withMessage("Social media must be an object"),

  body("socialMedia.instagram")
    .optional()
    .isString()
    .withMessage("Instagram must be a string"),

  body("socialMedia.facebook")
    .optional()
    .isString()
    .withMessage("Facebook must be a string"),

  body("socialMedia.website")
    .optional()
    .custom((value) => {
      if (value && value.trim() !== "" && !value.match(/^https?:\/\//)) {
        throw new Error("Website must start with http:// or https://");
      }
      return true;
    }),
];
