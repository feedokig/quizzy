// server/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Quiz = require('../models/Quiz');
const { protect } = require('../middleware/authMiddleware');

router.get('/test', (req, res) => {
  res.json({ message: 'Game routes working' });
});

const generatePin = async () => {
  let pin;
  let existingGame;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    existingGame = await Game.findOne({ pin });
  } while (existingGame);
  return pin;
};

router.post('/create', protect, async (req, res) => {
  try {
    const { quizId } = req.body;
    const hostId = req.user.id;

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.log('Quiz not found for ID:', quizId);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const pin = await generatePin();
    const game = new Game({
      quiz: quizId,
      host: hostId,
      pin,
      isActive: false,
      isCompleted: false,
      createdAt: new Date(),
    });

    await game.save();
    console.log('Game created:', { id: game._id, pin: game.pin, quiz: quizId });

    const populatedGame = await Game.findById(game._id).populate('quiz');
    if (!populatedGame) {
      console.error('Failed to populate game:', game._id);
      return res.status(500).json({ error: 'Failed to retrieve game' });
    }

    return res.status(201).json(populatedGame);
  } catch (error) {
    console.error('Create game error:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to create game' });
  }
});

router.get('/pin/:pin', async (req, res) => {
  try {
    console.log('Fetching game with PIN:', req.params.pin);
    const game = await Game.findOne({
      pin: req.params.pin,
      isCompleted: false,
    }).populate('quiz');

    if (!game) {
      console.log('No game found for PIN:', req.params.pin);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Game retrieved:', { id: game._id, pin: game.pin });
    res.json(game);
  } catch (error) {
    console.error('Get game by pin error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

router.get('/poll/:pin', async (req, res) => {
  try {
    const game = await Game.findOne({ pin: req.params.pin }).populate('quiz');
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json({ players: game.players, isActive: game.isActive, currentQuestionIndex: game.currentQuestionIndex });
  } catch (error) {
    console.error('Poll game error:', error);
    res.status(500).json({ error: 'Failed to poll game' });
  }
});

// Other routes unchanged
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const game = await Game.findById(req.params.id).populate('quiz');
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

router.get('/:pin/player/:nickname', async (req, res) => {
  try {
    const { pin, nickname } = req.params;

    const game = await Game.findOne({ pin });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = game.players.find((p) => p.nickname === nickname);
    if (!player) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }

    res.json({
      nickname: player.nickname,
      score: player.score || 0,
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Failed to get player data' });
  }
});

module.exports = router;