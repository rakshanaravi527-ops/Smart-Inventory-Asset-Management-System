/**
 * @file Helper Utilities
 * @description Pagination helper, date helpers, and other shared utilities.
 */

/**
 * Build Prisma pagination options from query parameters.
 * @param {object} query - Express request query object
 * @param {number} [query.page=1] - Page number (1-indexed)
 * @param {number} [query.limit=20] - Items per page
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

/**
 * Build a standardised paginated response.
 * @param {Array} data - Array of result items
 * @param {number} total - Total count of matching records
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {object} Paginated response payload
 */
function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a Date object N days from now.
 * @param {number} days - Number of days to add
 * @returns {Date}
 */
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the start of today (midnight UTC).
 * @returns {Date}
 */
function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of today (23:59:59.999 UTC).
 * @returns {Date}
 */
function endOfToday() {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Parse a date string safely, returning null if invalid.
 * @param {string|undefined} dateStr
 * @returns {Date|null}
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

module.exports = {
  buildPagination,
  paginatedResponse,
  daysFromNow,
  startOfToday,
  endOfToday,
  parseDate,
};
