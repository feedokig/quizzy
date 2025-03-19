// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Регистрация пользователя
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Вход пользователя
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Получение информации о пользователе
// @access  Private
router.get('/me', auth, authController.getMe);

module.exports = router;

