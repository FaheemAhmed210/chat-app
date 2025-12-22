require("dotenv").config();
const { envSchema } = require("./env-schema");

(async () => {
  try {
    // Validate all environment variables against the schema
    const { error } = envSchema.validate(process.env, { abortEarly: false });

    if (error) {
      // If there are validation errors, throw an error with details
      const errorMessages = error.details.map((detail) => detail.message);
      throw new Error(
        `Environment variable validation failed: ${errorMessages.join(", ")}`
      );
    }
    console.log(
      "All required environment variables are defined and valid. Starting the application..."
    );
  } catch (ex) {
    console.log(ex);
    process.exit(-1);
  }
})();
