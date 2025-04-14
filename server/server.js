// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const Game = require('./models/Game');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const gameRoutes = require('./routes/gameRoutes');

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);  // Register auth routes
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/games', gameRoutes);  // Register game routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Обработка сокетов
require('./socket/socket')(io);

io.on("connection", (socket) => {
  socket.on("player-join", async ({ pin, nickname }) => {
    try {
      const game = await Game.findOne({ pin });
      if (!game) {
        socket.emit("game-error", "Game not found");
        return;
      }

      const player = {
        id: socket.id,
        nickname,
        score: 0
      };

      game.players.push(player);
      await game.save();

      socket.join(pin);
      socket.emit("game-joined");
      io.to(pin).emit("player-joined", player);
    } catch (error) {
      socket.emit("game-error", error.message);
    }
  });

  socket.on("start-game", async ({ pin }) => {
    io.to(pin).emit("game-started");
  });

  socket.on("new-question", async ({ pin, question }) => {
    io.to(pin).emit("question", question);
  });

  socket.on("submit-answer", async ({ pin, answerIndex, boosts }) => {
    // Handle answer submission and scoring
    // Update player's score based on correctness and boosts
  });

  socket.on("end-game", async ({ pin }) => {
    const game = await Game.findOne({ pin });
    game.isCompleted = true;
    game.endedAt = new Date();
    await game.save();
    
    io.to(pin).emit("game-ended", game.results);
  });
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Настройка для продакшена
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));