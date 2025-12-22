const Joi = require("joi");

const mongoId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, "valid mongo id");

const offset = Joi.number().integer().min(1).required();
const limit = Joi.number().integer().min(1).required();

module.exports = {
  mongoId,
  offset,
  limit,
};
