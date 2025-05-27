// server/socket/socket.js
const Game = require("../models/Game");
const Player = require("../models/Player");

module.exports = (io) => {
  const activeGames = new Map();
  // Track socket IDs that have already joined a game
  const joinedSockets = new Set();

  io.on("connection", (socket) => {
    socket.on("host-join", async ({ pin, gameId, hostId }) => {
      try {
        const game = await Game.findById(gameId).populate("quiz");
        console.log("Host joining game:", { pin, gameId, hostId });

        if (!game || game.pin !== pin) {
          socket.emit("game-error", { message: "Invalid game or PIN" });
          return;
        }

        socket.join(pin);
        socket.emit("update-players", game.players || []);
        console.log("Host joined game:", pin);
      } catch (error) {
        console.error("Host join error:", error.message);
        socket.emit("game-error", { message: "Failed to join game" });
      }
    });

    socket.on("create-game", async ({ gameId, hostId, maxPlayers = 10 }) => {
      try {
        const game = await Game.findById(gameId).populate("quiz");

        if (!game) {
          socket.emit("game-error", { message: "Game not found" });
          return;
        }

        socket.join(game.pin);

        // Store maxPlayers in the game
        game.maxPlayers = maxPlayers;
        await game.save();

        activeGames.set(game.pin, {
          gameId: game._id,
          hostId,
          players: new Map(),
          maxPlayers: maxPlayers,
          currentQuestion: 0,
          isActive: true,
          results: [],
          correctAnswersCount: {},
        });

        socket.emit("game-created", { pin: game.pin });

        console.log(
          `Game created with PIN: ${game.pin}, Max Players: ${maxPlayers}`
        );
      } catch (error) {
        console.error("Error creating game:", error);
        socket.emit("game-error", { message: "Error creating game" });
      }
    });

    socket.on("update-max-players", async ({ pin, maxPlayers }) => {
      try {
        console.log(`Updating max players for game ${pin} to ${maxPlayers}`);
        const game = await Game.findOne({ pin });

        if (!game) {
          socket.emit("game-error", { message: "Game not found" });
          return;
        }

        // Update the max players
        game.maxPlayers = maxPlayers;
        await game.save();

        // Update activeGames map if exists
        if (activeGames.has(pin)) {
          activeGames.get(pin).maxPlayers = maxPlayers;
        }

        // Broadcast to all players in the game
        io.to(pin).emit("max-players-updated", { maxPlayers });

        console.log(`Max players updated for game ${pin} to ${maxPlayers}`);
      } catch (error) {
        console.error("Update max players error:", error);
        socket.emit("game-error", { message: "Failed to update max players" });
      }
    });

    socket.on("player-join", async ({ pin, nickname }) => {
      try {
        // Check if this socket has already joined
        const socketKey = `${socket.id}:${pin}`;
        if (joinedSockets.has(socketKey)) {
          console.log(`Socket ${socket.id} already joined game ${pin}`);
          return;
        }

        const game = await Game.findOne({ pin }).populate("quiz");
        if (!game) {
          socket.emit("join-error", { message: "Game not found" });
          return;
        }

        // Check if game is at max capacity
        if (game.maxPlayers && game.players.length >= game.maxPlayers) {
          socket.emit("join-error", { message: "Game is full" });
          return;
        }

        // Check if a player with this nickname already exists
        const existingPlayerIndex = game.players.findIndex(
          (p) => p.nickname === nickname
        );

        if (existingPlayerIndex !== -1) {
          // Update existing player's socketId
          game.players[existingPlayerIndex].socketId = socket.id;
          game.players[existingPlayerIndex].id = socket.id;

          // Mark mongoose array as modified
          game.markModified("players");
          await game.save();

          // Join the room
          socket.join(pin);

          // Update activeGames Map if it exists
          if (activeGames.has(pin)) {
            const existingPlayer = game.players[existingPlayerIndex];
            activeGames.get(pin).players.set(socket.id, existingPlayer);
          }

          // Mark this socket as joined
          joinedSockets.add(socketKey);

          // Send existing score to player
          socket.emit("player-rejoined", {
            score: game.players[existingPlayerIndex].score || 0,
          });

          console.log(
            `Player ${nickname} reconnected to game ${pin} with score ${
              game.players[existingPlayerIndex].score || 0
            }`
          );
        } else {
          // Create new player
          const player = {
            id: socket.id,
            socketId: socket.id,
            nickname: nickname,
            score: 0,
          };

          // Add player to game
          game.players.push(player);
          game.markModified("players");
          await game.save();

          // Join socket to room
          socket.join(pin);

          // Update activeGames Map
          if (!activeGames.has(pin)) {
            activeGames.set(pin, {
              gameId: game._id,
              players: new Map(),
              maxPlayers: game.maxPlayers || 10,
              correctAnswersCount: {},
            });
          }
          activeGames.get(pin).players.set(socket.id, player);

          // Mark this socket as joined
          joinedSockets.add(socketKey);

          console.log(`Player ${nickname} joined game ${pin}`);
        }

        // Emit player joined event in any case
        io.to(pin).emit("player-joined", { players: game.players });
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

          // Reset correctAnswersCount for new game
          if (activeGames.has(pin)) {
            activeGames.get(pin).correctAnswersCount = {};
          }

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
        // Reset correctAnswersCount for this question
        if (activeGames.has(pin)) {
          const activeGame = activeGames.get(pin);
          activeGame.correctAnswersCount[question.questionNumber] = 0;
        }

        io.to(pin).emit("question", question);
      } catch (error) {
        console.error("New question error:", error);
      }
    });

    // New handler for answer history requests
    socket.on("request-answer-history", async ({ pin, questionIndex }) => {
      try {
        console.log(
          "Answer history requested for game:",
          pin,
          "question:",
          questionIndex
        );
        const game = await Game.findOne({ pin }).populate("quiz");

        if (!game) {
          console.error("Game not found for answer history request");
          return;
        }

        const currentQuestion = game.quiz.questions[questionIndex];

        if (!currentQuestion) {
          console.error("Question not found for answer history request");
          return;
        }

        // Create answer history data from players
        const answerHistoryData = game.players.map((player) => {
          const isCorrect = player.lastAnswer === currentQuestion.correctAnswer;
          const answerText = currentQuestion.options[player.lastAnswer];

          return {
            playerId: player.id || player.socketId,
            nickname: player.nickname,
            answer: player.lastAnswer,
            answerText: answerText || "No answer",
            isCorrect: isCorrect,
            points: player.lastPoints || 0,
            totalScore: player.score || 0,
          };
        });

        // Send answer history only to the host (socket that requested it)
        socket.emit("show-answer-history", answerHistoryData);
      } catch (error) {
        console.error("Request answer history error:", error);
      }
    });

    socket.on("activate-boost", async ({ pin, boostType, questionIndex }) => {
      try {
        console.log(`Player activating boost: ${boostType} for pin ${pin}`);
        const game = await Game.findOne({ pin }).populate("quiz");
        if (!game || !game.isActive) return;

        const player = game.players.find(
          (p) => p.socketId === socket.id || p.id === socket.id
        );
        if (!player) return;

        // Check if boost already used
        if (player.usedBoosts && player.usedBoosts.includes(boostType)) {
          socket.emit("boost-error", { message: "Boost already used" });
          return;
        }

        // Mark boost as used
        if (!player.usedBoosts) player.usedBoosts = [];
        player.usedBoosts.push(boostType);

        // Mark boost as active
        if (!player.activeBoosts) player.activeBoosts = [];
        player.activeBoosts.push(boostType);

        // Handle fifty-fifty boost immediately
        if (boostType === "fifty_fifty") {
          const currentQuestion = game.quiz.questions[questionIndex];
          if (currentQuestion) {
            // Get correct answer index
            const correctAnswerIndex = currentQuestion.correctAnswer;

            // Create array of option indices
            const optionIndices = [
              ...Array(currentQuestion.options.length).keys(),
            ];

            // Remove correct answer from options to choose from
            const incorrectIndices = optionIndices.filter(
              (i) => i !== correctAnswerIndex
            );

            // Randomly select one incorrect answer to keep
            const keepIncorrectIndex =
              incorrectIndices[
                Math.floor(Math.random() * incorrectIndices.length)
              ];

            // Final options to show are the correct one and one random incorrect one
            const reducedOptions = [correctAnswerIndex, keepIncorrectIndex];

            // Send reduced options to this player only
            socket.emit("fifty-fifty-options", reducedOptions);
          }
        }

        // Save player state
        await game.save();

        // Confirm boost activation
        socket.emit("boost-activated", { boostType });
      } catch (error) {
        console.error("Activate boost error:", error);
        socket.emit("boost-error", { message: "Failed to activate boost" });
      }
    });

    socket.on(
      "submit-answer",
      async ({ pin, answerIndex, timeSpent = 0, boosts = [] }) => {
        try {
          const game = await Game.findOne({ pin }).populate("quiz");
          if (!game || !game.isActive) return;

          // Find player index instead of direct reference
          const playerIndex = game.players.findIndex(
            (p) => p.socketId === socket.id || p.id === socket.id
          );

          if (playerIndex === -1) return;

          // Get player reference
          const player = game.players[playerIndex];

          // Save the player's answer
          player.lastAnswer = answerIndex;

          const currentQuestion =
            game.quiz.questions[game.currentQuestionIndex];
          if (!currentQuestion) return;

          // Check if answer is correct
          const isCorrect = answerIndex === currentQuestion.correctAnswer;
          console.log(
            `Player ${player.nickname} answered: ${answerIndex}, correct: ${currentQuestion.correctAnswer}, is correct: ${isCorrect}`
          );

          let points = 0;

          if (isCorrect) {
            // Get active game data and initialize if needed
            if (!activeGames.has(pin)) {
              activeGames.set(pin, {
                gameId: game._id,
                correctAnswersCount: {},
              });
            }

            const activeGame = activeGames.get(pin);
            const currentQuestionNumber = game.currentQuestionIndex + 1;

            // Initialize counter for this question if it doesn't exist
            if (!activeGame.correctAnswersCount[currentQuestionNumber]) {
              activeGame.correctAnswersCount[currentQuestionNumber] = 0;
            }

            // Calculate points based on answer order (first gets 1000, then 10% less each time)
            const answerPosition =
              activeGame.correctAnswersCount[currentQuestionNumber];
            points = Math.round(1000 * Math.pow(0.9, answerPosition));

            // Store the points for this answer
            player.lastPoints = points;

            // Increment correct answers counter for this question
            activeGame.correctAnswersCount[currentQuestionNumber]++;

            // Update player score - ensure we're adding to the existing score
            player.correctAnswers = (player.correctAnswers || 0) + 1;
            // Make sure player.score exists before adding to it
            if (typeof player.score !== "number") {
              player.score = 0;
            }
            player.score += points;

            // Update player in the game.players array
            game.players[playerIndex] = player;

            // Mark mongoose array as modified
            game.markModified("players");

            console.log(
              `Player ${player.nickname} scored ${points} points, new total: ${player.score}`
            );
          } else {
            // Even for wrong answers, store 0 points
            player.lastPoints = 0;
          }

          // IMPORTANT: Save the game with updated scores
          await game.save();

          // Send result to player with the updated total score
          socket.emit("answer-result", {
            correct: isCorrect,
            points: points,
            totalScore: player.score,
            correctAnswer: currentQuestion.correctAnswer,
          });

          // Update host with player's new score and include the points awarded
          io.to(pin).emit("player-answered", {
            playerId: socket.id,
            nickname: player.nickname,
            score: player.score,
            answerIndex: answerIndex,
            pointsAwarded: points,
            totalAnswered: game.players.filter(
              (p) => typeof p.lastAnswer === "number" || p.lastAnswer !== null
            ).length,
            correctCount: game.players.filter(
              (p) => p.lastAnswer === currentQuestion.correctAnswer
            ).length,
          });

          // Send updated players list to everyone
          io.to(pin).emit("update-players", game.players);

          // Check if all players have answered - improved check
          const allAnswered = game.players.every(
            (p) => typeof p.lastAnswer === "number" || p.lastAnswer !== null
          );

          // If all players have answered, send answer history to host
          if (allAnswered && game.players.length > 0) {
            // Include ALL players who have answered in any form
            const answeredPlayers = game.players.filter(
              (p) => typeof p.lastAnswer === "number" || p.lastAnswer !== null
            );

            console.log(
              "Server generating answer history for players:",
              answeredPlayers.length
            );

            const answerHistoryData = answeredPlayers.map((p) => {
              const isCorrect = p.lastAnswer === currentQuestion.correctAnswer;
              // Safely access the options array with a fallback for any invalid index
              const answerText =
                currentQuestion.options &&
                p.lastAnswer !== undefined &&
                currentQuestion.options[p.lastAnswer]
                  ? currentQuestion.options[p.lastAnswer]
                  : "No answer";

              return {
                playerId: p.id || p.socketId,
                nickname: p.nickname,
                answer: p.lastAnswer, // Keep the numerical answer index
                answerIndex: p.lastAnswer, // Include alternative property name for consistency
                answerText: answerText,
                isCorrect: isCorrect,
                points: p.lastPoints || 0,
                totalScore: p.score || 0,
              };
            });

            console.log("Sending answer history data:", answerHistoryData);

            // Send to everyone in the game room (host will handle displaying it)
            io.to(pin).emit("show-answer-history", answerHistoryData);
          }
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

        // Reset correctAnswersCount for this new question
        if (activeGames.has(pin)) {
          const activeGame = activeGames.get(pin);
          activeGame.correctAnswersCount[game.currentQuestionIndex + 1] = 0;
        }

        // Send to both host and players
        io.to(pin).emit("question", questionData);
      } catch (error) {
        console.error("Next question error:", error);
      }
    });

    socket.on("end-game", async ({ pin, results, gameId }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return;

        game.isActive = false;
        game.results = results;
        await game.save();

        // Notify all players about game ending
        io.to(pin).emit("quiz:finished", {
          gameId,
          pin,
        });

        // Clean up joined sockets for this game
        for (const key of joinedSockets.keys()) {
          if (key.endsWith(`:${pin}`)) {
            joinedSockets.delete(key);
          }
        }

        console.log(`Game ${pin} has ended`);
      } catch (error) {
        console.error("End game error:", error);
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

        // Remove socket from joined sockets tracker
        const socketKey = `${socket.id}:${gamePin}`;
        joinedSockets.delete(socketKey);

        console.log(`Player disconnected from game ${gamePin}`);
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    });
  });
};
