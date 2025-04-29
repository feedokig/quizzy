// pages/game/PlayerGame

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./PlayerGame.css";

const PlayerGame = () => {
  const { pin } = useParams();
  const [socket, setSocket] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("playing");
  const navigate = useNavigate();
  // Boost states
  const [availableBoosts, setAvailableBoosts] = useState({
    fifty_fifty: true,
  });
  const [activeBoosts, setActiveBoosts] = useState({
    fifty_fifty: false,
  });
  const [reducedOptions, setReducedOptions] = useState(null);
  
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
  
    // Store the PIN in localStorage so it can be accessed later if needed
    localStorage.setItem("gamePin", pin);
  
    newSocket.on("question", (questionData) => {
      console.log("Received question:", questionData);
      setQuestion(questionData);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setReducedOptions(null);
      // НЕ сбрасываем счёт - это ключевая проблема
      // setScore(0); - эта строка раньше могла быть тут
    });

    newSocket.on('answer-result', (result) => {
      console.log('Answer result:', result);
      
      // Всегда обновляем счёт на основе ответа сервера, независимо от того,
      // правильный ответ или нет
      if (result.totalScore !== undefined) {
        setScore(result.totalScore);
      }
      
      setCorrectAnswer(result.correctAnswer);
    });

    newSocket.on("update-players", (players) => {
      console.log("Updated players list received:", players);
      // Найдем собственного игрока по ID сокета и обновим счёт
      const currentPlayer = players.find(p => p.socketId === newSocket.id || p.id === newSocket.id);
      if (currentPlayer && typeof currentPlayer.score === 'number') {
        setScore(currentPlayer.score);
      }
    });

    newSocket.on("player-rejoined", (data) => {
      console.log("Player rejoined with data:", data);
      if (typeof data.score === 'number') {
        setScore(data.score);
      }
    });

    // Handle fifty-fifty reduced options
    newSocket.on("fifty-fifty-options", (options) => {
      console.log("Received reduced options:", options);
      setReducedOptions(options);
    });

    // Handle boost activation confirmation
    newSocket.on("boost-activated", ({ boostType }) => {
      console.log(`Boost ${boostType} activated successfully`);
    });

    newSocket.on("game-ended", () => {
      setGameState("ended");
    });

    newSocket.on("quiz:finished", (data) => {
      console.log("Quiz finished event received:", data);
      // Change to direct navigation to results instead of wheel
      navigate(`/game/results`, {
        state: {
          finalScore: score
        },
      });
    });

    const nickname = localStorage.getItem("playerNickname");
    console.log("Joining game:", { pin, nickname });
    newSocket.emit("player-join", { pin, nickname });

    return () => newSocket.disconnect();
  }, [pin, navigate, score]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || !question) return;
    setSelectedAnswer(index);
    console.log("Submitting answer:", index);
    
    // Collect active boosts to send with the answer
    const activeBoostsList = Object.entries(activeBoosts)
      .filter(([_, isActive]) => isActive)
      .map(([boostType]) => boostType);
    
    console.log("Active boosts when answering:", activeBoostsList);
    
    socket.emit("submit-answer", {
      pin,
      answerIndex: index,
      boosts: activeBoostsList
    });

    // Reset fifty-fifty after answering
    if (activeBoosts.fifty_fifty) {
      setActiveBoosts(prev => ({
        ...prev,
        fifty_fifty: false
      }));
    }
  };

  const activateBoost = (boostType) => {
    // Check if boost is available
    if (!availableBoosts[boostType]) return;
    
    console.log(`Activating boost: ${boostType}`);
    
    // Mark boost as used
    setAvailableBoosts(prev => ({
      ...prev,
      [boostType]: false
    }));
    
    // Set boost as active
    setActiveBoosts(prev => ({
      ...prev,
      [boostType]: true
    }));
    
    // Handle fifty-fifty immediately
    if (boostType === "fifty_fifty") {
      socket.emit("activate-boost", {
        pin,
        boostType,
        questionIndex: question.questionNumber - 1
      });
    }
  };

  const renderBoostButtons = () => (
    <div className="boosts-container">
      <button 
        className={`boost-button fifty-fifty ${!availableBoosts.fifty_fifty ? 'used' : ''} ${activeBoosts.fifty_fifty ? 'active' : ''}`}
        onClick={() => activateBoost("fifty_fifty")}
        disabled={!availableBoosts.fifty_fifty || selectedAnswer !== null}
      >
        <span className="boost-icon">🛡️</span>
        <span className="boost-name">50/50</span>
        <span className="boost-status">
          {!availableBoosts.fifty_fifty ? 'Used' : activeBoosts.fifty_fifty ? 'Active' : 'Available'}
        </span>
      </button>
    </div>
  );

  const renderAnswer = (option, index) => {
    // Skip rendering this option if it's filtered out by fifty-fifty
    if (reducedOptions && !reducedOptions.includes(index)) {
      return null;
    }
    
    return (
      <button
        key={index}
        className={`answer-button answer-${index} ${
          selectedAnswer === index ? "selected" : ""
        } ${correctAnswer !== null && index === correctAnswer ? "correct" : ""} ${
          correctAnswer !== null &&
          selectedAnswer === index &&
          index !== correctAnswer
            ? "wrong"
            : ""
        }`}
        onClick={() => handleAnswer(index)}
        disabled={selectedAnswer !== null}
      >
        {option}
      </button>
    );
  };

  return (
    <div className="player-game">
      {gameState === "ended" ? (
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
            {renderBoostButtons()}
            <div className="answers-grid">
              {question.options.map((option, index) =>
                renderAnswer(option, index)
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="waiting">
          <h2>Waiting for question...</h2>
          {score > 0 && (
            <div className="current-score">Current score: {score}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerGame;