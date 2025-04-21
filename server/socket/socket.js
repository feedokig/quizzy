// server/socket/socket.js
const Game = require('../models/Game');
const Player = require('../models/Player');

module.exports = (io) => {
  const activeGames = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('host-join', async ({ pin, gameId }) => {
      try {
        const game = await Game.findById(gameId).populate('quiz');
        console.log('Game loaded:', game); // Для отладки

        if (game) {
          socket.join(pin);
          // Reset players for new session
          game.players = [];
          await game.save();
          socket.emit('update-players', []);
        }
      } catch (error) {
        console.error('Host join error:', error);
      }
    });

    socket.on('create-game', async ({ gameId, hostId }) => {
      try {
        const game = await Game.findById(gameId).populate('quiz');
        
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        socket.join(game.pin);
        
        activeGames.set(game.pin, {
          gameId: game._id,
          hostId,
          players: [],
          currentQuestion: 0,
          isActive: true,
          results: []
        });
        
        socket.emit('game-created', { pin: game.pin });
        
        console.log(`Game created with PIN: ${game.pin}`);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('game-error', { message: 'Error creating game' });
      }
    });

    socket.on('player-join', async ({ pin, nickname }) => {
      try {
        const game = await Game.findOne({ pin }).populate('quiz');
        if (!game) {
          socket.emit('join-error', { message: 'Game not found' });
          return;
        }

        // Создаем нового игрока
        const player = {
          id: socket.id,
          socketId: socket.id, // Добавляем socketId
          nickname: nickname,
          score: 0
        };

        // Добавляем игрока в игру
        game.players.push(player);
        await game.save();

        // Присоединяем сокет к комнате игры
        socket.join(pin);
        
        // Сохраняем данные в activeGames
        if (!activeGames.has(pin)) {
          activeGames.set(pin, { 
            gameId: game._id,
            players: new Map() 
          });
        }
        activeGames.get(pin).players.set(socket.id, player);

        // Оповещаем всех об обновлении списка игроков
        io.to(pin).emit('player-joined', { players: game.players });
        
        console.log(`Player ${nickname} joined game ${pin}`);
      } catch (error) {
        console.error('Join error:', error);
        socket.emit('join-error', { message: 'Failed to join game' });
      }
    });

    socket.on('join-game', async ({ pin, playerName }) => {
      try {
        const game = activeGames.get(pin);
        
        if (!game || !game.isActive) {
          socket.emit('join-error', { message: 'Game not found or not active' });
          return;
        }
        
        const player = new Player({
          name: playerName,
          socketId: socket.id,
          game: game.gameId
        });
        
        await player.save();
        
        game.players.push({
          id: player._id,
          name: playerName,
          score: 0
        });
        
        socket.join(pin);
        
        socket.emit('joined-game', {
          playerId: player._id,
          playerName
        });
        
        io.to(pin).emit('player-joined', {
          players: game.players
        });
        
        console.log(`Player ${playerName} joined game with PIN: ${pin}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('join-error', { message: 'Error joining game' });
      }
    });

    socket.on("start-game", async ({ pin, gameId }) => {
      try {
        const game = await Game.findById(gameId).populate('quiz');
        if (game) {
          game.isActive = true;
          game.currentQuestionIndex = 0;
          await game.save();

          io.to(pin).emit("game-started");

          const firstQuestion = game.quiz.questions[0];
          
          io.to(pin).emit("question", {
            questionNumber: 1,
            totalQuestions: game.quiz.questions.length,
            text: firstQuestion.question,
            options: firstQuestion.options,
            correctAnswer: firstQuestion.correctAnswer
          });
        }
      } catch (error) {
        console.error("Start game error:", error);
      }
    });

    socket.on("new-question", async ({ pin, question }) => {
      try {
        io.to(pin).emit("question", question);
      } catch (error) {
        console.error("New question error:", error);
      }
    });

    socket.on('submit-answer', async ({ pin, answerIndex }) => {
      try {
        const game = await Game.findOne({ pin }).populate('quiz');
        if (!game) return;
    
        // Find player by socketId
        const player = game.players.find(p => p.socketId === socket.id);
        if (!player) return;
    
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
        // Calculate points
        const points = isCorrect ? 1000 : 0;
        
        // Update player score
        if (isCorrect) {
          player.score += points;
          await game.save();
        }
    
        // Send result to player with correct answer
        socket.emit('answer-result', {
          correct: isCorrect,
          points: points,
          correctAnswer: currentQuestion.correctAnswer
        });
    
        // Update host view with the updated player information
        io.to(pin).emit('player-answered', {
          playerId: socket.id,
          nickname: player.nickname,
          score: player.score,
          answerIndex
        });
        
        // After saving the game, emit updated players list to keep host view in sync
        io.to(pin).emit('update-players', game.players);
      } catch (error) {
        console.error('Submit answer error:', error);
      }
    });

    socket.on('next-question', async ({ pin, gameId }) => {
      try {
        console.log('Next question requested:', { pin, gameId });
        
        const game = await Game.findById(gameId).populate('quiz');
        if (!game) return;

        game.currentQuestionIndex++;
        await game.save();

        const question = game.quiz.questions[game.currentQuestionIndex];
        const questionData = {
          text: question.question,
          options: question.options,
          questionNumber: game.currentQuestionIndex + 1,
          totalQuestions: game.quiz.questions.length,
          correctAnswer: question.correctAnswer
        };

        // Send to both host and players
        io.to(pin).emit('question', questionData);
      } catch (error) {
        console.error('Next question error:', error);
      }
    });

    socket.on("new-question", ({ pin, question, questionNumber }) => {
      io.to(pin).emit("question", { ...question, questionNumber });
    });

    socket.on('submit-answer', async ({ pin, answerIndex, timeSpent = 0, boosts = [] }) => {
  try {
    const game = await Game.findOne({ pin }).populate('quiz');
    if (!game || !game.isActive) return;

    const player = game.players.find(p => p.socketId === socket.id || p.id === socket.id);
    if (!player) return;

    // Save the player's answer
    player.lastAnswer = answerIndex;

    const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    let points = 0;

    if (isCorrect) {
      // Базовая формула очков с учетом времени
      points = Math.round(1000 * (1 - timeSpent / 20));
      if (boosts.includes('double_points')) {
        points *= 2;
      }

      player.correctAnswers = (player.correctAnswers || 0) + 1;
      player.score += points;
    }

    await game.save();

    // Отправка результата игроку
    socket.emit('answer-result', {
      correct: isCorrect,
      points,
      correctAnswer: currentQuestion.correctAnswer
    });

    // Подсчет всех ответивших игроков
    const totalAnswered = game.players.filter(p => p.lastAnswer !== undefined).length;
    const correctCount = game.players.filter(
      p => p.lastAnswer === currentQuestion.correctAnswer
    ).length;

    // Обновление состояния игры у ведущего (хоста)
    io.to(pin).emit('player-answered', {
      playerId: socket.id,
      nickname: player.nickname,
      score: player.score,
      answerIndex: answerIndex,
      totalAnswered,
      correctCount,
    });

    // Обновление всех игроков
    io.to(pin).emit('update-players', game.players);

  } catch (error) {
    console.error('Submit answer error:', error);
  }
});


    socket.on("use-boost", async ({ pin, playerId, boostType }) => {
      try {
        const game = await Game.findOne({ pin });
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        if (!player.usedBoosts) {
          player.usedBoosts = [];
        }

        if (!player.usedBoosts.includes(boostType)) {
          player.usedBoosts.push(boostType);
          await game.save();

          socket.emit("boost-used", { boostType });
          if (boostType === "fifty_fifty") {
            const currentQuestion = game.quiz.questions[game.currentQuestion];
            const reducedOptions = getFiftyFiftyOptions(currentQuestion);
            socket.emit("question-options", reducedOptions);
          }
        }
      } catch (error) {
        console.error("Use boost error:", error);
      }
    });

    socket.on("spin-wheel", async ({ pin, playerId }) => {
      try {
        const game = await Game.findOne({ pin });
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const result = spinWheel();
        const newScore = applyWheelResult(player.score, result);
        player.score = newScore;
        await game.save();

        socket.emit("wheel-result", { result, newScore });
      } catch (error) {
        console.error("Spin wheel error:", error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        // Find the game this socket was connected to
        const gamePin = Array.from(socket.rooms).find(room => room !== socket.id);
        if (!gamePin) return;

        const game = await Game.findOne({ pin: gamePin });
        if (!game) return;

        // Ensure players array exists and is an array
        if (!Array.isArray(game.players)) {
          game.players = [];
        }

        // Find and remove the disconnected player
        const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          await game.save();

          // Notify remaining players
          socket.to(gamePin).emit('player-left', socket.id);
          socket.to(gamePin).emit('update-players', game.players);
        }

        // Remove from active games if exists
        if (activeGames.has(gamePin)) {
          const activeGame = activeGames.get(gamePin);
          activeGame.players.delete(socket.id);
        }

        console.log(`Player disconnected from game ${gamePin}`);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

function calculatePoints(correct, timeSpent) {
  if (!correct) return 0;
  const maxPoints = 1000;
  const timeLimit = 20;
  return Math.round(maxPoints * (1 - timeSpent / timeLimit));
}

function getFiftyFiftyOptions(question) {
  const correctAnswer = question.options.find(opt => opt.correct);
  const wrongAnswers = question.options.filter(opt => !opt.correct);
  const randomWrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
  return [correctAnswer, randomWrongAnswer].sort(() => Math.random() - 0.5);
}

function spinWheel() {
  const results = [
    { type: "bonus", value: 0.1, label: "🎉 +10%" },
    { type: "bonus", value: 0.05, label: "⭐ +5%" },
    { type: "penalty", value: -0.05, label: "😬 -5%" },
    { type: "penalty", value: -0.1, label: "💥 -10%" }
  ];
  return results[Math.floor(Math.random() * results.length)];
}

function applyWheelResult(score, result) {
  return Math.round(score * (1 + result.value));
}