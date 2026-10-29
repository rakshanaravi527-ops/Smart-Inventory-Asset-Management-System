/**
 * @file Auth Routes
 * @description POST /login — authenticate user, GET /me — current user info
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const env = require('../config/env');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();

/** Zod schema for login body */
const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * @description Authenticate user with email & password, return JWT + user info.
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Account has been deactivated.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Remove passwordHash from response
    const { passwordHash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * @description Return the currently authenticated user's profile.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
