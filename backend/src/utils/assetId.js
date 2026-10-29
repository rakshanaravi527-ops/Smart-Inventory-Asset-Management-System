/**
 * @file Asset ID Generator
 * @description Generates unique asset codes in the format AST-{DEPT_CODE}-{SEQUENCE}.
 * Example: AST-CS-00001, AST-EC-00002
 */

const prisma = require('../config/db');

/**
 * Generate a unique asset code for a given department.
 * Format: AST-{departmentCode}-{5-digit-auto-increment}
 * @param {string} departmentId - The department UUID
 * @returns {Promise<string>} Generated asset code
 */
async function generateAssetCode(departmentId) {
  // Fetch the department code
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { code: true },
  });

  if (!department) {
    throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  }

  const prefix = `AST-${department.code}`;

  // Find the last asset in this department to determine next sequence number
  const lastAsset = await prisma.asset.findFirst({
    where: {
      assetCode: { startsWith: prefix },
    },
    orderBy: { assetCode: 'desc' },
    select: { assetCode: true },
  });

  let sequence = 1;
  if (lastAsset) {
    // Extract the numeric part from the last asset code
    const parts = lastAsset.assetCode.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      sequence = lastNum + 1;
    }
  }

  // Pad sequence to 5 digits
  const paddedSequence = String(sequence).padStart(5, '0');
  return `${prefix}-${paddedSequence}`;
}

module.exports = { generateAssetCode };
