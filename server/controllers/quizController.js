// server/controllers/quizController.js
const Quiz = require('../models/Quiz');

// Создание викторины
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, questions, timeLimit, isPublic } = req.body;
    
    // Создаем новую викторину
    const quiz = new Quiz({
      title,
      description,
      creator: req.user.id,
      questions,
      timeLimit,
      isPublic
    });
    
    await quiz.save();
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Получение викторины по ID
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('creator', 'username');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Получение всех викторин пользователя
exports.getUserQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(quizzes);
  } catch (error) {
    console.error('Get user quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Обновление викторины
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, questions, timeLimit, isPublic } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Проверяем, что пользователь является создателем викторины
    if (quiz.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Обновляем викторину
    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.questions = questions || quiz.questions;
    quiz.timeLimit = timeLimit || quiz.timeLimit;
    quiz.isPublic = isPublic !== undefined ? isPublic : quiz.isPublic;
    
    await quiz.save();
    
    res.json(quiz);
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Удаление викторины
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Проверяем, что пользователь является создателем викторины
    if (quiz.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await quiz.remove();
    
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// server/controllers/gameController.js
const Game = require('../models/Game');
const Quiz = require('../models/Quiz');
const Player = require('../models/Player');

// Генерация случайного PIN-кода
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Создание игры
exports.createGame = async (req, res) => {
  try {
    const { quizId } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Генерируем уникальный PIN-код
    let pin = generatePin();
    let existingGame = await Game.findOne({ pin, isActive: true });
    
    // Если PIN уже используется, генерируем новый
    while (existingGame) {
      pin = generatePin();
      existingGame = await Game.findOne({ pin, isActive: true });
    }
    
    // Создаем новую игру
    const game = new Game({
      quiz: quizId,
      host: req.user.id,
      pin,
      isActive: true,
      startedAt: null,
      endedAt: null
    });
    
    await game.save();
    
    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Присоединение к игре
exports.joinGame = async (req, res) => {
  try {
    const { pin, playerName } = req.body;
    
    // Ищем игру по PIN
    const game = await Game.findOne({ pin, isActive: true });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found or inactive' });
    }
    
    // Создаем нового игрока
    const player = new Player({
      name: playerName,
      socketId: '',
      game: game._id
    });
    
    await player.save();
    
    res.json({
      gameId: game._id,
      playerId: player._id,
      pin
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Отправка ответа
exports.submitAnswer = async (req, res) => {
  try {
    const { gameId, playerId, questionIndex, answer } = req.body;
    
    // Ответ будет обрабатываться через WebSocket
    // Здесь только проверяем валидность данных
    
    const game = await Game.findById(gameId);
    
    if (!game || !game.isActive) {
      return res.status(404).json({ message: 'Game not found or inactive' });
    }
    
    const player = await Player.findOne({ _id: playerId, game: gameId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json({ message: 'Answer submitted' });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Получение результатов игры
exports.getGameResults = async (req, res) => {
  try {
    const gameId = req.params.id;
    
    const game = await Game.findById(gameId)
      .populate('quiz')
      .populate('host', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json({
      quiz: game.quiz,
      host: game.host,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      results: game.results.sort((a, b) => b.score - a.score)
    });
  } catch (error) {
    console.error('Get game results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Завершение игры
exports.endGame = async (req, res) => {
  try {
    const { gameId } = req.body;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Проверяем, что пользователь является хостом игры
    if (game.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    game.isActive = false;
    game.isCompleted = true;
    game.endedAt = Date.now();
    
    await game.save();
    
    res.json({ message: 'Game ended' });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};