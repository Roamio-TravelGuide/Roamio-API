import Joi from "joi";

// Validation schema for creating a support ticket
export const createTicketSchema = Joi.object({
  category: Joi.string()
    .valid(
      "safety",
      "harassment",
      "workplace",
      "payment",
      "equipment",
      "management",
      "customer",
      "scheduling",
      "training",
      "technical",
      "account",
      "billing",
      "feature_request",
      "bug_report",
      "other"
    )
    .required()
    .messages({
      "any.required": "Category is required",
      "any.only": "Invalid category provided",
    }),

  subject: Joi.string().min(5).max(200).required().messages({
    "string.min": "Subject must be at least 5 characters long",
    "string.max": "Subject cannot exceed 200 characters",
    "any.required": "Subject is required",
  }),

  description: Joi.string().min(20).max(2000).required().messages({
    "string.min": "Description must be at least 20 characters long",
    "string.max": "Description cannot exceed 2000 characters",
    "any.required": "Description is required",
  }),

  urgency: Joi.string()
    .valid("low", "medium", "high", "critical")
    .default("medium")
    .messages({
      "any.only": "Urgency must be one of: low, medium, high, critical",
    }),
});

// Validation schema for updating a support ticket
export const updateTicketSchema = Joi.object({
  description: Joi.string().min(20).max(2000).messages({
    "string.min": "Description must be at least 20 characters long",
    "string.max": "Description cannot exceed 2000 characters",
  }),

  urgency: Joi.string().valid("low", "medium", "high", "critical").messages({
    "any.only": "Urgency must be one of: low, medium, high, critical",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Validation schema for admin updating ticket status
export const updateTicketStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "rejected")
    .required()
    .messages({
      "any.required": "Status is required",
      "any.only":
        "Status must be one of: open, in_progress, resolved, rejected",
    }),

  resolution: Joi.string()
    .max(1000)
    .when("status", {
      is: "resolved",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.max": "Resolution cannot exceed 1000 characters",
      "any.required": "Resolution is required when status is resolved",
    }),
});

// Validation schema for query parameters
export const queryParamsSchema = Joi.object({
  status: Joi.string().valid("open", "in_progress", "resolved", "rejected"),

  category: Joi.string().valid(
    "safety",
    "harassment",
    "workplace",
    "payment",
    "equipment",
    "management",
    "customer",
    "scheduling",
    "training",
    "technical",
    "account",
    "billing",
    "feature_request",
    "bug_report",
    "other"
  ),

  user_type: Joi.string().valid(
    "admin",
    "moderator",
    "traveler",
    "travel_guide",
    "vendor"
  ),

  urgency: Joi.string().valid("low", "medium", "high", "critical"),

  search: Joi.string().max(100),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  sortBy: Joi.string()
    .valid(
      "created_at",
      "updated_at",
      "subject",
      "status",
      "urgency",
      "category"
    )
    .default("created_at"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Validation middleware
export const validateCreateTicket = (req, res, next) => {
  const { error, value } = createTicketSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.body = value;
  next();
};

export const validateUpdateTicket = (req, res, next) => {
  const { error, value } = updateTicketSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.body = value;
  next();
};

export const validateUpdateTicketStatus = (req, res, next) => {
  const { error, value } = updateTicketStatusSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.body = value;
  next();
};

export const validateQueryParams = (req, res, next) => {
  const { error, value } = queryParamsSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // Store validated query parameters in req.validatedQuery instead of modifying req.query
  req.validatedQuery = value;
  next();
};

// Validation for ticket ID parameter
export const validateTicketId = (req, res, next) => {
  const ticketId = parseInt(req.params.id);

  if (isNaN(ticketId) || ticketId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket ID",
    });
  }

  req.params.id = ticketId;
  next();
};
