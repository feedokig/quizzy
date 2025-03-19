// server/socket/socket.js
const Game = require('../models/Game');
const Player = require('../models/Player');

module.exports = (io) => {
  // Хранилище активных игр
  const activeGames = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
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
    
    // Обработка старта игры
    socket.on('start-game', async ({ pin }) => {
      try {
        const game = activeGames.get(pin);
        
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        const gameData = await Game.findById(game.gameId).populate('quiz');
        
        if (!gameData) {
          socket.emit('game-error', { message: 'Game data not found' });
          return;
        }
        
        // Начинаем игру
        game.isActive = true;
        game.currentQuestion = 0;
        
        // Отправляем первый вопрос
        io.to(pin).emit('game-started', {
          currentQuestion: 0,
          totalQuestions: gameData.quiz.questions.length
        });
        
        // Отправляем данные о вопросе
        setTimeout(() => {
          io.to(pin).emit('question', {
            question: gameData.quiz.questions[0],
            questionNumber: 1,
            totalQuestions: gameData.quiz.questions.length,
            timeLimit: gameData.quiz.timeLimit || 30
          });
        }, 3000);
        
        console.log(`Game with PIN ${pin} started`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('game-error', { message: 'Error starting game' });
      }
    });
    
    // Обработка отправки ответа
    socket.on('submit-answer', async ({ pin, playerId, answer, time }) => {
      try {
        const game = activeGames.get(pin);
        
        if (!game) {
          socket.emit('answer-error', { message: 'Game not found' });
          return;
        }
        
        const gameData = await Game.findById(game.gameId).populate('quiz');
        
        if (!gameData) {
          socket.emit('answer-error', { message: 'Game data not found' });
          return;
        }
        
        const currentQuestion = gameData.quiz.questions[game.currentQuestion];
        let points = 0;
        
        // Проверяем правильность ответа
        if (answer === currentQuestion.correctAnswer) {
          // Рассчитываем очки в зависимости от времени ответа
          // Максимальное количество очков за быстрый ответ
          const maxPoints = 1000;
          // Чем быстрее ответ, тем больше очков
          points = Math.floor(maxPoints * (1 - (time / (gameData.quiz.timeLimit || 30))));
          points = Math.max(100, points); // Минимум 100 очков за правильный ответ
        }
        
        // Обновляем счет игрока
        const playerIndex = game.players.findIndex(p => p.id.toString() === playerId);
        if (playerIndex !== -1) {
          game.players[playerIndex].score += points;
        }
        
        // Сохраняем результат
        game.results.push({
          playerId,
          questionIndex: game.currentQuestion,
          answer,
          correct: answer === currentQuestion.correctAnswer,
          points
        });
        
        // Отправляем результат игроку
        socket.emit('answer-result', {
          correct: answer === currentQuestion.correctAnswer,
          points,
          answer: currentQuestion.correctAnswer
        });
        
        // Проверяем, все ли игроки ответили
        const answeredPlayers = game.results.filter(r => r.questionIndex === game.currentQuestion);
        if (answeredPlayers.length >= game.players.length) {
          // Если все ответили - переходим к следующему вопросу
          setTimeout(async () => {
            game.currentQuestion += 1;
            
            if (game.currentQuestion < gameData.quiz.questions.length) {
              // Отправляем следующий вопрос
              io.to(pin).emit('question', {
                question: gameData.quiz.questions[game.currentQuestion],
                questionNumber: game.currentQuestion + 1,
                totalQuestions: gameData.quiz.questions.length,
                timeLimit: gameData.quiz.timeLimit || 30
              });
            } else {
              // Игра окончена
              io.to(pin).emit('game-over', {
                players: game.players.sort((a, b) => b.score - a.score)
              });
              
              // Сохраняем результаты игры в базу данных
              gameData.isCompleted = true;
              gameData.results = game.players;
              await gameData.save();
              
              // Удаляем игру из активных
              activeGames.delete(pin);
            }
          }, 3000);
        }
        
        console.log(`Player ${playerId} submitted answer for game ${pin}`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('answer-error', { message: 'Error submitting answer' });
      }
    });
    
    // Обработка следующего вопроса
    socket.on('next-question', async ({ pin }) => {
      try {
        const game = activeGames.get(pin);
        
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        const gameData = await Game.findById(game.gameId).populate('quiz');
        
        if (!gameData) {
          socket.emit('game-error', { message: 'Game data not found' });
          return;
        }
        
        game.currentQuestion += 1;
        
        if (game.currentQuestion < gameData.quiz.questions.length) {
          // Отправляем следующий вопрос
          io.to(pin).emit('question', {
            question: gameData.quiz.questions[game.currentQuestion],
            questionNumber: game.currentQuestion + 1,
            totalQuestions: gameData.quiz.questions.length,
            timeLimit: gameData.quiz.timeLimit || 30
          });
        } else {
          // Игра окончена
          io.to(pin).emit('game-over', {
            players: game.players.sort((a, b) => b.score - a.score)
          });
          
          // Сохраняем результаты игры в базу данных
          gameData.isCompleted = true;
          gameData.results = game.players;
          await gameData.save();
          
          // Удаляем игру из активных
          activeGames.delete(pin);
        }
        
        console.log(`Moving to next question for game ${pin}`);
      } catch (error) {
        console.error('Error moving to next question:', error);
        socket.emit('game-error', { message: 'Error moving to next question' });
      }
    });
    
    // Обработка отключения
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Удаляем игрока из всех активных игр
      for (const [pin, game] of activeGames.entries()) {
        const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          
          // Оповещаем хоста об отключении игрока
          io.to(pin).emit('player-left', {
            players: game.players
          });
          
          console.log(`Player left game with PIN: ${pin}`);
        }
        
        // Если хост отключился, завершаем игру
        if (socket.id === game.hostId) {
          io.to(pin).emit('host-left');
          activeGames.delete(pin);
          console.log(`Host left game with PIN: ${pin}, game ended`);
        }
      }
    });
  });
};