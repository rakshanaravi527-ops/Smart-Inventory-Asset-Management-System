/**
 * @file Zod Validation Middleware Factory
 * @description Validates request body, query params, or route params
 * against a Zod schema before the route handler runs.
 */

/**
 * Create a validation middleware for the given Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of the request to validate
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errors = issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      // Replace source data with parsed (coerced/defaulted) values
      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
