// client/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Инициализация соединения socket.io
    const newSocket = io(process.env.REACT_APP_API_URL || 'https://quizzy-backend-1cq8.onrender.com', {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
    });

    setSocket(newSocket);

    // Очистка при размонтировании
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  // Функции для работы с игрой через socket
  const createGame = (gameId, hostId) => {
    if (socket) {
      socket.emit('create-game', { gameId, hostId });
    }
  };

  const joinGame = (pin, playerName) => {
    if (socket) {
      socket.emit('join-game', { pin, playerName });
    }
  };

  const startGame = (pin) => {
    if (socket) {
      socket.emit('start-game', { pin });
    }
  };

  const submitAnswer = (pin, playerId, answer, time) => {
    if (socket) {
      socket.emit('submit-answer', { pin, playerId, answer, time });
    }
  };

  const nextQuestion = (pin) => {
    if (socket) {
      socket.emit('next-question', { pin });
    }
  };

  const value = {
    socket,
    connected,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    nextQuestion
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};