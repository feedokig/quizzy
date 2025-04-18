// server/models/Game.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  id: String,
  socketId: String,
  nickname: String,
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionIndex: Number,
    answerIndex: Number,
    isCorrect: Boolean
  }]
});

const gameSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  players: {
    type: [playerSchema],
    default: []
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', gameSchema);