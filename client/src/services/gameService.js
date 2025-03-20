// client/src/services/gameService.js
import api from './api';

// Create a new game
export const createGame = async (quizId) => {
  try {
    const res = await api.post('/api/game', { quizId });
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Join a game with PIN
export const joinGameWithPin = async (pin, playerName) => {
  try {
    const res = await api.post('/api/game/join', { pin, playerName });
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Submit answer
export const submitGameAnswer = async (gameId, playerId, questionIndex, answer) => {
  try {
    const res = await api.post('/api/game/answer', {
      gameId,
      playerId,
      questionIndex,
      answer
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Get game results
export const getGameResults = async (gameId) => {
  try {
    const res = await api.get(`/api/game/${gameId}/results`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// End game
export const endGame = async (gameId) => {
  try {
    const res = await api.post('/api/game/end', { gameId });
    return res.data;
  } catch (err) {
    throw err;
  }
};