// server/routes/quiz.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// @route   POST /api/quiz
// @desc    Создание викторины
// @access  Private
router.post('/', auth, quizController.createQuiz);

// @route   GET /api/quiz/:id
// @desc    Получение викторины по ID
// @access  Private/Public (в зависимости от настроек викторины)
router.get('/:id', quizController.getQuiz);

// @route   GET /api/quiz/user
// @desc    Получение всех викторин пользователя
// @access  Private
router.get('/user/quizzes', auth, quizController.getUserQuizzes);

// @route   PUT /api/quiz/:id
// @desc    Обновление викторины
// @access  Private
router.put('/:id', auth, quizController.updateQuiz);

// @route   DELETE /api/quiz/:id
// @desc    Удаление викторины
// @access  Private
router.delete('/:id', auth, quizController.deleteQuiz);

module.exports = router;