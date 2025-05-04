// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // или process.env.REACT_APP_API_URL
  withCredentials: true, // если используешь куки (не обязательно)
});

export default api;
