// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// @route   POST /api/auth/update-password
// @desc    Обновление пароля пользователя
// @access  Private
router.post('/update-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

