// client/src/contexts/GameContext.js
import React, { createContext, useContext, useState } from 'react';
import io from 'socket.io-client';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    gameId: null,
    pin: null,
    isHost: false,
    isPlayer: false,
    playerId: null,
    playerName: null,
    players: [],
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    timeLimit: 0,
    timeLeft: 0,
    answered: false,
    selectedAnswer: null,
    results: []
  });

  // Initialize socket connection
  const initSocket = () => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'https://quizzy-backend-1cq8.onrender.com');
    setSocket(newSocket);
    return newSocket;
  };

  // Close socket connection
  const closeSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Host a game
  const hostGame = (gameId, hostId) => {
    const newSocket = socket || initSocket();
    
    newSocket.emit('create-game', { gameId, hostId });
    
    newSocket.on('game-created', (data) => {
      setGameState(prev => ({
        ...prev,
        gameId,
        pin: data.pin,
        isHost: true
      }));
    });
    
    // Listen for players joining
    newSocket.on('player-joined', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });
    
    // Listen for player leaving
    newSocket.on('player-left', (data) => {
      setGameState(prev => ({
        ...prev,
        players: data.players
      }));
    });
    
    // Listen for game error
    newSocket.on('game-error', (error) => {
      console.error('Game error:', error.message);
    });
  };

  // Join a game as player
  const joinGame = (pin, playerName) => {
    const newSocket = socket || initSocket();
    
    newSocket.emit('join-game', { pin, playerName });
    
    newSocket.on('joined-game', (data) => {
      setGameState(prev => ({
        ...prev,
        pin,
        isPlayer: true,
        playerId: data.playerId,
        playerName: data.playerName
      }));
    });
    
    newSocket.on('join-error', (error) => {
      console.error('Join error:', error.message);
    });
    
    // Listen for game start
    newSocket.on('game-started', (data) => {
      setGameState(prev => ({
        ...prev,
        questionNumber: data.currentQuestion,
        totalQuestions: data.totalQuestions
      }));
    });
    
    // Listen for questions
    newSocket.on('question', (data) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions,
        timeLimit: data.timeLimit,
        timeLeft: data.timeLimit,
        answered: false,
        selectedAnswer: null
      }));
    });
    
    // Listen for answer results
    newSocket.on('answer-result', (data) => {
      setGameState(prev => ({
        ...prev,
        answered: true,
        answerResult: {
          correct: data.correct,
          points: data.points,
          correctAnswer: data.answer
        }
      }));
    });
    
    // Listen for game over
    newSocket.on('game-over', (data) => {
      setGameState(prev => ({
        ...prev,
        isActive: false,
        currentQuestion: null,
        results: data.players
      }));
    });
    
    // Listen for host leaving
    newSocket.on('host-left', () => {
      setGameState(prev => ({
        ...prev,
        isActive: false,
        currentQuestion: null,
        gameEnded: true,
        gameEndedReason: 'Host left the game'
      }));
    });
  };

  // Start the game (host only)
  const startGame = () => {
    if (socket && gameState.isHost) {
      socket.emit('start-game', { pin: gameState.pin });
    }
  };

  // Submit answer (player only)
  const submitAnswer = (answer, time) => {
    if (socket && gameState.isPlayer) {
      socket.emit('submit-answer', {
        pin: gameState.pin,
        playerId: gameState.playerId,
        answer,
        time
      });
      
      setGameState(prev => ({
        ...prev,
        answered: true,
        selectedAnswer: answer
      }));
    }
  };

  // Move to next question (host only)
  const nextQuestion = () => {
    if (socket && gameState.isHost) {
      socket.emit('next-question', { pin: gameState.pin });
    }
  };

  // Reset game state
  const resetGame = () => {
    closeSocket();
    setGameState({
      gameId: null,
      pin: null,
      isHost: false,
      isPlayer: false,
      playerId: null,
      playerName: null,
      players: [],
      currentQuestion: null,
      questionNumber: 0,
      totalQuestions: 0,
      timeLimit: 0,
      timeLeft: 0,
      answered: false,
      selectedAnswer: null,
      results: []
    });
  };

  const value = {
    socket,
    gameState,
    initSocket,
    closeSocket,
    hostGame,
    joinGame,
    startGame,
    submitAnswer,
    nextQuestion,
    resetGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
