// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://quizzy-olive.vercel.app',
  withCredentials: true,
});

export default api;
