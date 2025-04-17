const express = require('express');
const { updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/update-password', protect, updatePassword);

module.exports = router;