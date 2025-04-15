const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Quiz = require('../models/Quiz');

// Check if the route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Game routes working' });
});

// Генерация уникального PIN-кода
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Создание новой игры
router.post('/create', async (req, res) => {
  try {
    const { quizId, hostId } = req.body;
    
    // Validate input
    if (!quizId || !hostId) {
      return res.status(400).json({ 
        error: 'Quiz ID and Host ID are required' 
      });
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Generate unique PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const game = new Game({
      quiz: quizId,
      host: hostId,
      pin,
      isActive: false,
      isCompleted: false,
      createdAt: new Date()
    });

    await game.save();
    
    // Populate quiz data before sending response
    const populatedGame = await Game.findById(game._id).populate('quiz');
    
    // Make sure to send a response
    return res.status(201).json(populatedGame);
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({ error: 'Failed to create game' });
  }
});

// Получение игры по ID
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

// Получение игры по PIN
router.get('/pin/:pin', async (req, res) => {
  try {
    const game = await Game.findOne({ 
      pin: req.params.pin,
      isCompleted: false 
    }).populate('quiz');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game' });
  }
});

module.exports = router;