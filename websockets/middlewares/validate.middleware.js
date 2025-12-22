module.exports.validateEventPayload = (schema, payload) => {
  const { error } = schema.validate(payload);
  if (error) {
    error.details = [
      {
        [error.details[0].path[0]]: error.details[0].message,
      },
    ];
  }
  return { error };
};
module.exports.validateChainId = (schema, payload) => {
  const { error } = schema.validate(payload);
  if (error) {
    error.details = [
      {
        [error.details[0].path[0]]: error.details[0].message,
      },
    ];
  }
  return { error };
};
