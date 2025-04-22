// pages/game/PlayerGame

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './PlayerGame.css';

const PlayerGame = () => {
  const { pin } = useParams();
  const [socket, setSocket] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const nickname = localStorage.getItem('playerNickname');
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('question', (questionData) => {
      console.log('Received question:', questionData);
      setQuestion(questionData);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
    });

    newSocket.on('answer-result', (result) => {
      console.log('Answer result:', result);
      if (result.totalScore) {
          // Используем общий счет вместо добавления очков
          setScore(result.totalScore);
      } else if (result.points) {
          // Обратная совместимость
          setScore(prev => prev + result.points);
      }
      setCorrectAnswer(result.correctAnswer);
  });

    newSocket.on('game-ended', () => {
      setGameState('ended');
    });

    newSocket.on('quiz:finished', (data) => {
      console.log('Quiz finished event received:', data);
      // Не передаем socket через navigate
      navigate(`/game/${data.gameId}/wheel`, {
        state: {
          score,
          pin: data.pin,
          gameId: data.gameId
        }
      });
    });

    const nickname = localStorage.getItem('playerNickname');
    console.log('Joining game:', { pin, nickname });
    newSocket.emit('player-join', { pin, nickname });

    return () => newSocket.disconnect();
  }, [pin, navigate, score]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || !question) return;
    setSelectedAnswer(index);
    console.log('Submitting answer:', index);
    socket.emit('submit-answer', {
      pin,
      answerIndex: index
    });
  };

  const renderAnswer = (option, index) => (
    <button
      key={index}
      className={`answer-button answer-${index} ${
        selectedAnswer === index ? 'selected' : ''
      } ${
        correctAnswer !== null && index === correctAnswer ? 'correct' : ''
      } ${
        correctAnswer !== null && selectedAnswer === index && 
        index !== correctAnswer ? 'wrong' : ''
      }`}
      onClick={() => handleAnswer(index)}
      disabled={selectedAnswer !== null}
    >
      {option}
    </button>
  );

  return (
    <div className="player-game">
      {gameState === 'ended' ? (
        <div className="game-ended">
          <h2>Game Over</h2>
          <div className="final-score">Your final score: {score}</div>
        </div>
      ) : question ? (
        <>
          <div className="game-header">
            <div className="question-count">
              Question {question.questionNumber} of {question.totalQuestions}
            </div>
            <div className="score-display">Your score: {score}</div>
          </div>

          <div className="question-container">
            <h2 className="question-text">{question.text}</h2>
            
            <div className="answers-grid">
              {question.options.map((option, index) => renderAnswer(option, index))}
            </div>
          </div>
        </>
      ) : (
        <div className="waiting">
          <h2>Waiting for question...</h2>
          {score > 0 && <div className="current-score">Current score: {score}</div>}
        </div>
      )}
    </div>
  );
};

export default PlayerGame;