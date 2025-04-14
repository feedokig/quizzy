// server/controllers/quizController.js
const Quiz = require('../models/Quiz');

// Создание викторины
exports.createQuiz = async (req, res) => {
  try {
    const { title, questions, boosts, nutritionBonus, wheelEnabled } = req.body;

    // Validate required fields
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    // Create new quiz
    const quiz = new Quiz({
      title,
      questions,
      boosts,
      nutritionBonus,
      wheelEnabled,
      creator: req.user.id  // This comes from the auth middleware
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      quiz,
      message: 'Quiz created successfully'
    });
  } catch (err) {
    console.error('Quiz creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating quiz',
      error: err.message
    });
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
      .select('title questions createdAt')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    console.error('Error fetching user quizzes:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes',
      error: err.message
    });
  }
};

// Обновление викторины
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedQuiz);
  } catch (err) {
    res.status(500).json({ message: 'Error updating quiz', error: err.message });
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