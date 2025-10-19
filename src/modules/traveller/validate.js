import Joi from 'joi';

export const reviewValidation = {
  createReview: Joi.object({
    package_id: Joi.number().integer().positive().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comments: Joi.string().max(1000).optional().allow('', null)
  }),

  updateReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comments: Joi.string().max(1000).optional().allow('', null)
  }).min(1), // At least one field must be provided

  getReviews: Joi.object({
    package_id: Joi.number().integer().positive().optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0)
  })
};