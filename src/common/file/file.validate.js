exports.validatePayload = function (payload, validationSchema) {
  const result = validationSchema.validate(payload);

  return result.error
    ? [
        {
          [result.error.details[0].path[0]]: result.error.details[0].message,
        },
      ]
    : null;
};
