// client/src/services/quizService.js

import api from './api';

// Get all quizzes for the current user
export const getUserQuizzes = async () => {
  try {
    const res = await api.get('/api/quiz/user/quizzes');
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Get quiz by ID
export const getQuizById = async (id) => {
  try {
    const res = await api.get(`/api/quiz/${id}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Create a new quiz
export const createQuiz = async (quizData) => {
  try {
    const res = await api.post('/api/quiz', quizData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Update a quiz
export const updateQuiz = async (id, quizData) => {
  try {
    const res = await api.put(`/api/quiz/${id}`, quizData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Delete a quiz
export const deleteQuiz = async (id) => {
  try {
    const res = await api.delete(`/api/quiz/${id}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};