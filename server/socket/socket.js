// server/socket/socket.js
const Game = require('../models/Game');
const Player = require('../models/Player');

module.exports = (io) => {
  // Хранилище активных игр
  const activeGames = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('host-join', async ({ pin, gameId }) => {
      try {
        const game = await Game.findById(gameId).populate('quiz');
        console.log('Game loaded:', game); // Для отладки

        if (game) {
          socket.join(pin);
          socket.emit('update-players', game.players || []);
        }
      } catch (error) {
        console.error('Host join error:', error);
      }
    });

    // Обработка создания игры
    socket.on('create-game', async ({ gameId, hostId }) => {
      try {
        const game = await Game.findById(gameId).populate('quiz');
        
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        // Создаем комнату для игры
        socket.join(game.pin);
        
        // Добавляем игру в активные
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
    
    // Обработка присоединения к игре
    socket.on('join-game', async ({ pin, playerName }) => {
      try {
        const game = activeGames.get(pin);
        
        if (!game || !game.isActive) {
          socket.emit('join-error', { message: 'Game not found or not active' });
          return;
        }
        
        // Создаем нового игрока
        const player = new Player({
          name: playerName,
          socketId: socket.id,
          game: game.gameId
        });
        
        await player.save();
        
        // Добавляем игрока в игру
        game.players.push({
          id: player._id,
          name: playerName,
          score: 0
        });
        
        // Присоединяем игрока к комнате
        socket.join(pin);
        
        // Отправляем данные об игроке
        socket.emit('joined-game', {
          playerId: player._id,
          playerName
        });
        
        // Оповещаем хоста о новом игроке
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

          // Отправляем событие начала игры всем игрокам
          io.to(pin).emit("game-started");

          // Получаем первый вопрос
          const firstQuestion = game.quiz.questions[0];
          
          // Отправляем первый вопрос всем игрокам
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
        if (!game) {
          console.log('Game not found');
          return;
        }

        const player = game.players.find(p => p.socketId === socket.id);
        if (!player) {
          console.log('Player not found:', socket.id);
          return;
        }

        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        if (!currentQuestion) {
          console.log('Question not found');
          return;
        }

        console.log('Processing answer:', {
          answerIndex,
          correctAnswer: currentQuestion.correctAnswer
        });

        const isCorrect = answerIndex === currentQuestion.correctAnswer;
        const points = isCorrect ? 1000 : 0;

        // Обновляем счет игрока
        if (isCorrect) {
          player.score = (player.score || 0) + points;
        }

        await game.save();

        // Отправляем результат игроку
        socket.emit('answer-result', {
          correct: isCorrect,
          points: points,
          correctAnswer: currentQuestion.correctAnswer
        });

        // Оповещаем хоста
        io.to(pin).emit('player-answered', {
          playerId: socket.id,
          playerName: player.name,
          answerIndex,
          isCorrect
        });

      } catch (error) {
        console.error('Submit answer error:', error);
      }
    });

    socket.on('next-question', async ({ pin, gameId }) => {
      try {
        console.log('Next question requested:', { pin, gameId });
        
        const game = await Game.findById(gameId).populate('quiz');
        if (!game) {
          console.log('Game not found');
          return;
        }

        const nextIndex = game.currentQuestionIndex + 1;
        
        if (nextIndex < game.quiz.questions.length) {
          game.currentQuestionIndex = nextIndex;
          await game.save();

          const question = game.quiz.questions[nextIndex];
          console.log('Sending next question:', question);

          io.to(pin).emit('question', {
            text: question.question,
            options: question.options,
            questionNumber: nextIndex + 1,
            totalQuestions: game.quiz.questions.length,
            correctAnswer: question.correctAnswer
          });
        } else {
          game.isCompleted = true;
          await game.save();
          io.to(pin).emit('game-ended');
        }
      } catch (error) {
        console.error('Next question error:', error);
      }
    });

    socket.on("new-question", ({ pin, question, questionNumber }) => {
      io.to(pin).emit("question", { ...question, questionNumber });
    });

    socket.on('submit-answer', async ({ pin, answerIndex, timeSpent, boosts }) => {
      try {
        const game = await Game.findOne({ pin }).populate('quiz');
        if (!game || !game.isActive) return;

        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        if (!currentQuestion) return;

        const player = game.players.find(p => p.id === socket.id);
        if (!player) return;

        const isCorrect = currentQuestion.options[answerIndex]?.correct;
        let points = 0;

        if (isCorrect) {
          points = Math.round(1000 * (1 - timeSpent/20));
          
          if (boosts.includes('double_points')) {
            points *= 2;
          }

          player.score += points;
          player.correctAnswers = (player.correctAnswers || 0) + 1;
        }

        await game.save();

        socket.emit('answer-submitted', {
          correct: isCorrect,
          points: points
        });

        io.to(game.pin).emit('player-answered', {
          playerId: socket.id,
          answerIndex,
          totalAnswers: game.players.reduce((acc, p) => acc + (p.answer !== null ? 1 : 0), 0)
        });

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

    // Обработка отключения
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      for (const [pin, game] of activeGames.entries()) {
        const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          
          io.to(pin).emit('player-left', {
            players: game.players
          });
          
          console.log(`Player left game with PIN: ${pin}`);
        }
        
        if (socket.id === game.hostId) {
          io.to(pin).emit('host-left');
          activeGames.delete(pin);
          console.log(`Host left game with PIN: ${pin}, game ended`);
        }
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