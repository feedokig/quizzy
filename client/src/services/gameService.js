import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/games` || 'http://localhost:5000/api/games';


const gameService = {
  createGame: async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      const response = await axios.post(
        `${API_URL}/create`,
        { quizId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Game creation error:', error);
      throw new Error(error.response?.data?.error || 'Failed to create game');
    }
  },

  getGame: async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      if (!gameId) {
        throw new Error('Game ID is required');
      }

      const response = await axios.get(`${API_URL}/${gameId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get game error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get game');
    }
  },

  getGameByPin: async (pin) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(`${API_URL}/pin/${pin}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get game by pin error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get game');
    }
  },
};

export default gameService;