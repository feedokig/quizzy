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