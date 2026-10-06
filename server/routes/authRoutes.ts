/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  logoutUser,
  getMe,
  updateProfile,
  verifyAdminSession,
} from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Guest Portal Auth Routes
router.post('/register', register);
router.post('/login', login);

// Dedicated Admin Portal Auth Routes
router.post('/admin/login', adminLogin);
router.get('/admin/verify', authenticateToken, requireAdmin, verifyAdminSession);

// Session & Profile Routes
router.post('/logout', logoutUser);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
