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
  const [score, setScore] = useState(0);
  const [lastPoints, setLastPoints] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const nickname = localStorage.getItem('playerNickname');

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('question', (questionData) => {
      console.log('Received question:', questionData);
      setQuestion(questionData);
      setSelectedAnswer(null);
    });

    newSocket.on('answer-result', (result) => {
      console.log('Answer result:', result);
      if (result.points) {
        setScore(prev => prev + result.points);
      }
      setQuestion(prev => ({
        ...prev,
        showCorrectAnswer: true,
        correctAnswer: result.correctAnswer
      }));
    });

    newSocket.on('game-ended', () => {
      setGameState('ended');
    });

    // Присоединяемся к игре
    const nickname = localStorage.getItem('playerNickname');
    console.log('Joining game:', { pin, nickname });
    newSocket.emit('player-join', { pin, nickname });

    return () => newSocket.disconnect();
  }, [pin]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || !question) return;
    
    console.log('Submitting answer:', index);
    setSelectedAnswer(index);
    
    socket.emit('submit-answer', {
      pin,
      answerIndex: index
    });
  };

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
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-button answer-${index} ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    question.showCorrectAnswer && index === question.correctAnswer ? 'correct' : ''
                  } ${
                    question.showCorrectAnswer && selectedAnswer === index && 
                    index !== question.correctAnswer ? 'wrong' : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                  {selectedAnswer !== null && lastPoints && index === selectedAnswer && (
                    <div className="points-earned">
                      {lastPoints > 0 ? `+${lastPoints}` : ''}
                    </div>
                  )}
                </button>
              ))}
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
