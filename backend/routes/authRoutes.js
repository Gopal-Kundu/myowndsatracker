const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/signup - Register a user
router.post('/signup', authController.signup);

// POST /api/auth/login - Log in a user
router.post('/login', authController.login);

// POST /api/auth/logout - Log out a user
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user info
router.get('/me', auth, authController.getMe);

module.exports = router;
