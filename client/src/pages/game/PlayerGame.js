// pages/game/PlayerGame

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
      if (result.points) {
        setScore(prev => prev + result.points);
      }
      setCorrectAnswer(result.correctAnswer);
    });

    newSocket.on('game-ended', () => {
      setGameState('ended');
    });

    const nickname = localStorage.getItem('playerNickname');
    console.log('Joining game:', { pin, nickname });
    newSocket.emit('player-join', { pin, nickname });

    return () => newSocket.disconnect();
  }, [pin]);

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
          <p>Your final score: {score}</p>
        </div>
      ) : question ? (
        <>
          <div className="game-header">
            <div className="question-count">
              Question {question.questionNumber} of {question.totalQuestions}
            </div>
            <div className="score">Score: {score}</div>
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
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
