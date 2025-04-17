// pages/game/HostGame
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import gameService from "../../services/gameService";
import "./HostGame.css";

const HostGame = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state?.game || null);
  const [loading, setLoading] = useState(!location.state?.game);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [gameState, setGameState] = useState("waiting"); // waiting, playing, finished

  useEffect(() => {
    const initGame = async () => {
      try {
        setLoading(true);
        const hostId = localStorage.getItem("userId");
        
        if (!hostId) {
          throw new Error("User not authenticated");
        }

        let gameData = game;
        
        if (!gameData) {
          gameData = await gameService.getGame(gameId);
          console.log('Loaded game data:', gameData); // Debug log
          
          if (!gameData || !gameData.pin) {
            throw new Error("Invalid game data received");
          }
          if (!gameData.quiz || !gameData.quiz.questions) {
            console.error('Quiz or questions missing:', gameData); // Debug log
            throw new Error("Quiz data is missing");
          }
          setGame(gameData);
        }

        // Initialize socket connection
        const newSocket = io("http://localhost:5000", {
          transports: ['websocket']
        });
        
        // Join host to game room
        newSocket.emit("host-join", { 
          pin: gameData.pin,
          gameId: gameData._id,
          hostId 
        });

        // Listen for player updates
        newSocket.on("update-players", (updatedPlayers) => {
          console.log("Players updated:", updatedPlayers);
          setPlayers(updatedPlayers);
        });

        newSocket.on("player-joined", (player) => {
          console.log("Player joined:", player);
          setPlayers(prev => [...prev, player]);
        });

        newSocket.on("player-left", (playerId) => {
          setPlayers(prev => prev.filter(p => p.id !== playerId));
        });

        newSocket.on("player-answer", ({ playerId, answerIndex }) => {
          setAnswers(prev => ({
            ...prev,
            [playerId]: answerIndex
          }));
        });

        newSocket.on("error", (error) => {
          console.error("Socket error:", error);
          setError(error.message || "Connection error");
        });

        setSocket(newSocket);
        setLoading(false);

      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError(err.message || "Failed to load game");
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [gameId]);

  const handleStartGame = () => {
    if (socket && game) {
      setGameState("playing");
      socket.emit("start-game", { 
        pin: game.pin,
        gameId: game._id // Добавляем gameId
      });
      sendQuestion(0); // Отправляем первый вопрос
    }
  };

  const sendQuestion = (index) => {
    const question = game.quiz.questions[index];
    if (!question) {
      console.error('Question not found:', index);
      return;
    }

    console.log('Sending question:', question);

    // Устанавливаем текущий вопрос
    setCurrentQuestion({
      number: index + 1,
      text: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      totalQuestions: game.quiz.questions.length
    });

    setAnswers({});
    setShowResults(false);

    // Отправляем вопрос всем игрокам
    socket.emit("new-question", {
      pin: game.pin,
      question: {
        questionNumber: index + 1,
        totalQuestions: game.quiz.questions.length,
        text: question.question,
        options: question.options.map(opt => opt), // Отправляем только текст опций
        correctAnswer: question.correctAnswer
      }
    });
  };

  const handleNextQuestion = () => {
    console.log('Requesting next question');
    socket.emit('next-question', {
      pin: game.pin,
      gameId: game._id
    });
  };

  const handleEndGame = () => {
    if (socket && game) {
      socket.emit("end-game", { pin: game.pin });
      setGameState("finished");
      setShowResults(true);
      navigate('/dashboard');
    }
  };

  const handleKickPlayer = (playerId) => {
    if (socket && game) {
      socket.emit("kick-player", { 
        pin: game.pin, 
        playerId 
      });
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="current-question">
        <h2 className="question-text">{currentQuestion.text}</h2>
        
        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => (
            <div 
              key={index} 
              className={`answer-box answer-${index} ${
                showResults && index === currentQuestion.correctAnswer ? 'correct-answer' : ''
              }`}
            >
              <div className="answer-content">
                <span className="answer-text">{option}</span>
                <span className="answer-count">
                  {Object.values(answers).filter(a => a === index).length}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="next-question-btn"
          onClick={handleNextQuestion}
        >
          {currentQuestion.questionNumber === currentQuestion.totalQuestions 
            ? 'End Game' 
            : 'Next Question'
          }
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="host-game loading">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="host-game error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="host-game error">
        <h2>Game not found</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="host-game">
      <div className="game-header">
        <h1>Game PIN: {game?.pin}</h1>
        <p>Quiz: {game?.quiz?.title}</p>
      </div>

      <div className="game-content">
        <div className="players-panel">
          <h2>Players ({players.length})</h2>
          <div className="players-list">
            {players.map(player => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.nickname}</span>
                <span className="player-score">{player.score || 0}</span>
                {gameState === "waiting" && (
                  <button 
                    className="kick-button"
                    onClick={() => handleKickPlayer(player.id)}
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
          {players.length === 0 && (
            <p className="no-players">Waiting for players to join...</p>
          )}
        </div>

        <div className="game-main">
          {gameState === 'waiting' && (
            <div className="waiting-screen">
              <h2>Waiting for players...</h2>
              <button 
                className="start-button"
                onClick={handleStartGame}
                disabled={players.length === 0}
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && renderQuestion()}
          
          {gameState === 'finished' && (
            <div className="final-results">
              <h2>Game Finished!</h2>
              <div className="leaderboard">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.id} className="leaderboard-item">
                      <span className="position">#{index + 1}</span>
                      <span className="player-name">{player.nickname}</span>
                      <span className="final-score">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostGame;