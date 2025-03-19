// client/src/contexts/GameContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, starting, question, results, over
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(null);
  const { socket } = useSocket();

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  // Обработка событий socket.io
  useEffect(() => {
    if (!socket) return;

    // Игра создана
    socket.on('game-created', (data) => {
      console.log('Game created:', data);
    });

    // Присоединение игрока
    socket.on('player-joined', (data) => {
      setPlayers(data.players);
    });

    // Игрок покинул игру
    socket.on('player-left', (data) => {
      setPlayers(data.players);
    });

    // Игра начата
    socket.on('game-started', (data) => {
      setGamePhase('starting');
      setQuestionNumber(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);
    });

    // Получение вопроса
    socket.on('question', (data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setTimeLeft(data.timeLimit);
      setGamePhase('question');

      // Запускаем таймер
      if (timer) clearInterval(timer);
      const countdownTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimer(countdownTimer);
    });

    // Результат ответа
    socket.on('answer-result', (data) => {
      console.log('Answer result:', data);
    });

    // Игра окончена
    socket.on('game-over', (data) => {
      setGamePhase('over');
      setResults(data.players);
      if (timer) clearInterval(timer);
    });

    // Хост покинул игру
    socket.on('host-left', () => {
      setError('The host has left the game');
      setGamePhase('over');
      if (timer) clearInterval(timer);
    });

    // Ошибка игры
    socket.on('game-error', (data) => {
      setError(data.message);
    });

    // Ошибка присоединения
    socket.on('join-error', (data) => {
      setError(data.message);
    });

    // Очистка обработчиков при размонтировании
    return () => {
      socket.off('game-created');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('question');
      socket.off('answer-result');
      socket.off('game-over');
      socket.off('host-left');
      socket.off('game-error');
      socket.off('join-error');
    };
  }, [socket, timer]);

  // Создание новой игры
  const createGame = async (quizId) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/game', { quizId });
      setGame(res.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create game');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Присоединение к игре
  const joinGame = async (pin, playerName) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/game/join', { pin, playerName });
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join game');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получение результатов игры
  const getGameResults = async (gameId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/game/${gameId}/results`);
      setResults(res.data.results);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get game results');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Сброс состояния игры
  const resetGame = () => {
    setGame(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionNumber(0);
    setTotalQuestions(0);
    setTimeLeft(0);
    setGamePhase('waiting');
    setResults([]);
    setError(null);
    if (timer) clearInterval(timer);
  };

  const value = {
    game,
    players,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timeLeft,
    gamePhase,
    results,
    loading,
    error,
    createGame,
    joinGame,
    getGameResults,
    resetGame
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};