import axios from 'axios';

const API_URL = 'http://localhost:5000/api/games';

export const createGame = async (quizId) => {
  try {
    // Get hostId from localStorage
    const hostId = localStorage.getItem('userId');
    
    if (!hostId) {
      throw new Error('User not authenticated. Please log in again.');
    }

    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    console.log('Creating game with:', { quizId, hostId }); // Debug log

    const response = await axios.post(`${API_URL}/create`, {
      quizId,
      hostId
    });
    return response.data;
  } catch (error) {
    console.error('Game creation error:', error);
    throw error.response?.data?.error || 'Failed to create game';
  }
};

export const getGame = async (gameId) => {
  try {
    const response = await axios.get(`${API_URL}/${gameId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get game';
  }
};

export const getGameByPin = async (pin) => {
  try {
    const response = await axios.get(`${API_URL}/pin/${pin}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get game';
  }
};

// You can still export default if needed
export default {
  createGame,
  getGame,
  getGameByPin
};