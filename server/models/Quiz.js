// server/models/Quiz.js
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correctAnswer: {
      type: Number,
      required: true
    }
  }],
  boosts: {
    fifty_fifty: {
      type: Boolean,
      default: true
    },
    double_points: {
      type: Boolean,
      default: true
    },
    time_freeze: {
      type: Boolean,
      default: true
    },
    nutrition_bonus: {
      type: Boolean,
      default: true
    }
  },
  nutritionBonus: {
    enabled: {
      type: Boolean,
      default: true
    },
    correctTypes: {
      type: Number,
      default: 0
    }
  },
  wheelEnabled: {
    type: Boolean,
    default: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);