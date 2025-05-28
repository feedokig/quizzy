// server/routes/game.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');
const Game = require('../models/Game');

// @route   POST /api/game
// @desc    Создание игры
// @access  Private
router.post('/', auth, gameController.createGame);

// @route   POST /api/game/join
// @desc    Присоединение к игре
// @access  Public
router.post('/join', gameController.joinGame);

// @route   POST /api/game/answer
// @desc    Отправка ответа на вопрос
// @access  Public
router.post('/answer', gameController.submitAnswer);

// @route   GET /api/game/:id/results
// @desc    Получение результатов игры
// @access  Public
router.get('/:id/results', gameController.getGameResults);

// @route   POST /api/game/end
// @desc    Завершение игры
// @access  Private
router.post('/end', auth, gameController.endGame);

module.exports = router;