// server/socket/socket.js
const Game = require("../models/Game");
const Player = require("../models/Player");

module.exports = (io) => {
  const activeGames = new Map();

  io.on("connection", (socket) => {
    socket.on("host-join", async ({ pin, gameId }) => {
      try {
        const game = await Game.findById(gameId).populate("quiz");
        console.log("Game loaded:", game); // Для отладки

        if (game) {
          socket.join(pin);
          // Reset players for new session
          game.players = [];
          await game.save();
          socket.emit("update-players", []);
        }
      } catch (error) {
        console.error("Host join error:", error);
      }
    });

    socket.on("create-game", async ({ gameId, hostId }) => {
      try {
        const game = await Game.findById(gameId).populate("quiz");

        if (!game) {
          socket.emit("game-error", { message: "Game not found" });
          return;
        }

        socket.join(game.pin);

        activeGames.set(game.pin, {
          gameId: game._id,
          hostId,
          players: [],
          currentQuestion: 0,
          isActive: true,
          results: [],
        });

        socket.emit("game-created", { pin: game.pin });

        console.log(`Game created with PIN: ${game.pin}`);
      } catch (error) {
        console.error("Error creating game:", error);
        socket.emit("game-error", { message: "Error creating game" });
      }
    });

    socket.on("player-join", async ({ pin, nickname }) => {
      try {
        const game = await Game.findOne({ pin }).populate("quiz");
        if (!game) {
          socket.emit("join-error", { message: "Game not found" });
          return;
        }

        // Создаем нового игрока
        const player = {
          id: socket.id,
          socketId: socket.id, // Добавляем socketId
          nickname: nickname,
          score: 0,
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
            players: new Map(),
          });
        }
        activeGames.get(pin).players.set(socket.id, player);

        // Оповещаем всех об обновлении списка игроков
        io.to(pin).emit("player-joined", { players: game.players });

        console.log(`Player ${nickname} joined game ${pin}`);
      } catch (error) {
        console.error("Join error:", error);
        socket.emit("join-error", { message: "Failed to join game" });
      }
    });

    socket.on("start-game", async ({ pin, gameId }) => {
      try {
        const game = await Game.findById(gameId).populate("quiz");
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
            correctAnswer: firstQuestion.correctAnswer,
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

    socket.on(
      "submit-answer",
      async ({ pin, answerIndex, timeSpent = 0, boosts = [] }) => {
        try {
          const game = await Game.findOne({ pin }).populate("quiz");
          if (!game || !game.isActive) return;
    
          const player = game.players.find(
            (p) => p.socketId === socket.id || p.id === socket.id
          );
          if (!player) return;
    
          // Save the player's answer
          player.lastAnswer = answerIndex;
    
          const currentQuestion =
            game.quiz.questions[game.currentQuestionIndex];
          if (!currentQuestion) return;
    
          const isCorrect = answerIndex === currentQuestion.correctAnswer;
          let points = 0;
    
          if (isCorrect) {
            // Базовая формула очков с учетом времени
            points = Math.round(1000 * (1 - timeSpent / 20));
            if (boosts.includes("double_points")) {
              points *= 2;
            }
    
            player.correctAnswers = (player.correctAnswers || 0) + 1;
    
            // Важно! Накапливаем очки
            player.score = (player.score || 0) + points;
          }
    
          await game.save();
    
          // Отправка результата игроку с общим количеством очков
          socket.emit("answer-result", {
            correct: isCorrect,
            points: points, // очки за текущий ответ
            totalScore: player.score, // общие очки игрока
            correctAnswer: currentQuestion.correctAnswer,
          });
    
          // Обновление состояния игры у ведущего (хоста)
          io.to(pin).emit("player-answered", {
            playerId: socket.id,
            nickname: player.nickname,
            score: player.score, // отправляем общий счет игрока
            answerIndex: answerIndex,
            totalAnswered: game.players.filter(p => p.lastAnswer !== undefined).length,
            correctCount: game.players.filter(p => p.lastAnswer === currentQuestion.correctAnswer).length,
          });
    
          // Обновление всех игроков с актуальными очками
          io.to(pin).emit("update-players", game.players);
        } catch (error) {
          console.error("Submit answer error:", error);
        }
      }
    );

    socket.on("next-question", async ({ pin, gameId }) => {
      try {
        console.log("Next question requested:", { pin, gameId });

        const game = await Game.findById(gameId).populate("quiz");
        if (!game) return;

        game.currentQuestionIndex++;
        await game.save();

        const question = game.quiz.questions[game.currentQuestionIndex];
        const questionData = {
          text: question.question,
          options: question.options,
          questionNumber: game.currentQuestionIndex + 1,
          totalQuestions: game.quiz.questions.length,
          correctAnswer: question.correctAnswer,
        };

        // Send to both host and players
        io.to(pin).emit("question", questionData);
      } catch (error) {
        console.error("Next question error:", error);
      }
    });

    socket.on("new-question", ({ pin, question, questionNumber }) => {
      io.to(pin).emit("question", { ...question, questionNumber });
    });

    socket.on("use-boost", async ({ pin, playerId, boostType }) => {
      try {
        const game = await Game.findOne({ pin });
        if (!game) return;

        const player = game.players.find((p) => p.id === playerId);
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

    socket.on("end-game", async ({ pin, results, gameId }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return;

        game.isActive = false;
        game.results = results;
        await game.save();

        // Оповещаем всех игроков о завершении викторины
        io.to(pin).emit("quiz:finished", {
          gameId,
          pin,
        });

        console.log(`Game ${pin} has ended`);
      } catch (error) {
        console.error("End game error:", error);
      }
    });

    socket.on("wheel:spin", async ({ pin, playerId, multiplier }) => {
      try {
        const game = await Game.findOne({ pin });
        if (!game) return;

        // Найти игрока в игре
        const player = game.players.find(
          (p) => p.socketId === socket.id || p.id === socket.id
        );
        if (!player) return;

        // Применить множитель к счету
        const newScore = Math.round(player.score * multiplier);
        player.score = newScore;
        await game.save();

        // Отправить результат только этому игроку
        socket.emit("wheel:result", {
          newScore,
          multiplier,
        });

        // Обновить список игроков для хоста
        io.to(pin).emit("update-players", game.players);
      } catch (error) {
        console.error("Wheel spin error:", error);
      }
    });

    socket.on("join-wheel", ({ pin, gameId }) => {
      socket.join(`wheel_${pin}`);
    });

    socket.on(
      "wheel-spin",
      async ({ pin, gameId, multiplier, currentScore, nickname }) => {
        try {
          console.log("Wheel spin:", {
            pin,
            gameId,
            multiplier,
            currentScore,
            nickname,
          });

          const game = await Game.findById(gameId);
          if (!game) {
            console.error("Game not found");
            return;
          }

          // Find the player by socket ID or nickname
          const player = game.players.find(
            (p) => p.socketId === socket.id || p.nickname === nickname
          );

          if (!player) {
            console.error("Player not found");
            return;
          }

          // Calculate new score with the multiplier
          const updatedScore = Math.round(currentScore * multiplier);
          player.score = updatedScore;

          // Save game with updated player score
          await game.save();

          // Emit result back to the specific player
          socket.emit("wheel-result", {
            updatedScore,
            multiplier,
          });

          // Broadcast updated players list to everyone in the game room
          // This ensures the host's view is updated
          io.to(pin).emit("update-players", game.players);

          console.log(
            `Player ${player.nickname} score updated: ${currentScore} -> ${updatedScore}`
          );
        } catch (error) {
          console.error("Wheel spin error:", error);
        }
      }
    );

    // Add a new handler for skipping the wheel
    socket.on("wheel-skip", async ({ pin, gameId, nickname, currentScore }) => {
      try {
        console.log("Player skipped wheel:", { pin, gameId, nickname });

        // We don't need to update the score, but we still want to let the host know
        // the player is done with the wheel and ready for results
        socket.emit("wheel-skipped");

        // Let the host know the player is ready for results
        io.to(pin).emit("player-ready-for-results", {
          nickname,
          score: currentScore,
        });
      } catch (error) {
        console.error("Wheel skip error:", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        // Find the game this socket was connected to
        const gamePin = Array.from(socket.rooms).find(
          (room) => room !== socket.id
        );
        if (!gamePin) return;

        const game = await Game.findOne({ pin: gamePin });
        if (!game) return;

        // Ensure players array exists and is an array
        if (!Array.isArray(game.players)) {
          game.players = [];
        }

        // Find and remove the disconnected player
        const playerIndex = game.players.findIndex(
          (p) => p.socketId === socket.id
        );
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          await game.save();

          // Notify remaining players
          socket.to(gamePin).emit("player-left", socket.id);
          socket.to(gamePin).emit("update-players", game.players);
        }

        // Remove from active games if exists
        if (activeGames.has(gamePin)) {
          const activeGame = activeGames.get(gamePin);
          activeGame.players.delete(socket.id);
        }

        console.log(`Player disconnected from game ${gamePin}`);
      } catch (error) {
        console.error("Disconnect error:", error);
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
  const correctAnswer = question.options.find((opt) => opt.correct);
  const wrongAnswers = question.options.filter((opt) => !opt.correct);
  const randomWrongAnswer =
    wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
  return [correctAnswer, randomWrongAnswer].sort(() => Math.random() - 0.5);
}

function spinWheel() {
  const results = [
    { type: "bonus", value: 0.1, label: "🎉 +10%" },
    { type: "bonus", value: 0.05, label: "⭐ +5%" },
    { type: "penalty", value: -0.05, label: "😬 -5%" },
    { type: "penalty", value: -0.1, label: "💥 -10%" },
  ];
  return results[Math.floor(Math.random() * results.length)];
}

function applyWheelResult(score, result) {
  return Math.round(score * (1 + result.value));
}
