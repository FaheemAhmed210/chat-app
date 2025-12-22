const Joi = require("joi");

module.exports.join_room = Joi.object({
  contractAddress: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .required(),
});

module.exports.join_room_network = Joi.object({
  chainIds: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .required(),
});
