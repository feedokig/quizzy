// client/src/contexts/QuizContext.js
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const QuizContext = createContext();

export const useQuiz = () => useContext(QuizContext);

export const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Загрузка списка викторин пользователя
  const loadUserQuizzes = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const res = await axios.get('/api/quiz/user/quizzes');
      setQuizzes(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных о конкретной викторине
  const getQuiz = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/quiz/${id}`);
      setCurrentQuiz(res.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Создание новой викторины
  const createQuiz = async (quizData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/quiz', quizData);
      setQuizzes([res.data, ...quizzes]);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обновление викторины
  const updateQuiz = async (id, quizData) => {
    setLoading(true);
    try {
      const res = await axios.put(`/api/quiz/${id}`, quizData);
      setQuizzes(quizzes.map(quiz => quiz._id === id ? res.data : quiz));
      setCurrentQuiz(res.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Удаление викторины
  const deleteQuiz = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/api/quiz/${id}`);
      setQuizzes(quizzes.filter(quiz => quiz._id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    quizzes,
    currentQuiz,
    loading,
    error,
    loadUserQuizzes,
    getQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};