import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/games`;


const gameService = {
  createGame: async (quizId) => {
    try {
      const hostId = localStorage.getItem('userId');
      
      if (!hostId) {
        throw new Error('User not authenticated');
      }

      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      const response = await axios.post(`${API_URL}/create`, {
        quizId,
        hostId
      });

      return response.data;
    } catch (error) {
      console.error('Game creation error:', error);
      throw new Error(error.response?.data?.error || 'Failed to create game');
    }
  },

  getGame: async (gameId) => {
    try {
      if (!gameId) {
        throw new Error('Game ID is required');
      }

      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to get game: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get game error:', error);
      throw error;
    }
  },

  getGameByPin: async (pin) => {
    try {
      const response = await axios.get(`${API_URL}/pin/${pin}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to get game';
    }
  }
};

export default gameService;