const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Replace with your actual User model

router.post('/update', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Assuming `req.user.id` contains the authenticated user's ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    user.username = username || user.username;
    user.email = email || user.email;

    if (password) {
      user.password = await user.hashPassword(password); // Ensure password is hashed
    }

    await user.save();
    res.status(200).json({ message: 'Профіль оновлено успішно' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;