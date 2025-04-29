// pages/game/HostGame
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import gameService from "../../services/gameService";
import socketService from "../../services/socketService"; // Import the new socket service
import AnswerHistoryModal from "../../components/AnswerHistoryModal";
import "./HostGame.css";

const HostGame = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state?.game || null);
  const [loading, setLoading] = useState(!location.state?.game);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [gameState, setGameState] = useState("waiting");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  
  // State for the answer history modal
  const [showAnswerHistoryModal, setShowAnswerHistoryModal] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      try {
        // Clear players when initializing new game
        setPlayers([]);
        setLoading(true);
        const hostId = localStorage.getItem("userId");
  
        if (!hostId) {
          throw new Error("User not authenticated");
        }
  
        let gameData = game;
  
        if (!gameData) {
          gameData = await gameService.getGame(gameId);
          console.log("Loaded game data:", gameData);
  
          if (!gameData || !gameData.pin) {
            throw new Error("Invalid game data received");
          }
          if (!gameData.quiz || !gameData.quiz.questions) {
            console.error("Quiz or questions missing:", gameData);
            throw new Error("Quiz data is missing");
          }
          setGame(gameData);
        }
  
        // Connect to socket
        const socket = socketService.connect();
  
        // Register event listeners
        socketService.on("updatePlayers", (updatedPlayers) => {
          console.log("Players updated from server:", updatedPlayers);
          
          // Make sure updatedPlayers is an array
          if (Array.isArray(updatedPlayers)) {
            setPlayers(updatedPlayers);
          }
        });
  
        socketService.on("onPlayerJoined", ({ players }) => {
          console.log("Players list updated:", players);
          setPlayers(players);
        });
  
        socketService.on("onPlayerLeft", (playerId) => {
          console.log("Player left:", playerId);
          setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        });
  
        socketService.on("onPlayerAnswered", ({ playerId, nickname, score, answerIndex, totalAnswered, correctCount, pointsAwarded }) => {
          console.log("Player answered:", { playerId, nickname, score, answerIndex, pointsAwarded });
          
          setPlayers((prev) => {
            // Find the player by ID or nickname
            const playerIndex = prev.findIndex(p => 
              p.id === playerId || p.socketId === playerId || (p.nickname === nickname && nickname)
            );
            
            // If found, update score and last answer
            if (playerIndex !== -1) {
              const updatedPlayers = [...prev];
              updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                score: score,
                lastAnswer: answerIndex, // Always store the answer index regardless of correctness
                lastPoints: pointsAwarded || 0, // Store the points awarded for this answer
                isAnswered: true // Add an explicit flag to track answered state
              };
              return updatedPlayers;
            } 
            // If not found (shouldn't normally happen), add player
            else {
              return [
                ...prev,
                {
                  id: playerId,
                  socketId: playerId,
                  nickname: nickname || "Anonymous",
                  score: score,
                  lastAnswer: answerIndex,
                  lastPoints: pointsAwarded || 0,
                  isAnswered: true // Add an explicit flag to track answered state
                }
              ];
            }
          });
        
          // Check if all players have answered
          if (totalAnswered === players.length && players.length > 0) {
            setAllPlayersAnswered(true);
            console.log("All players answered notification received");
          }
          
          // Show correct answer after a delay
          setTimeout(() => {
            setShowCorrectAnswer(true);
          }, 2000);
        });
  
        // Add this to clear answers when receiving new question
        socketService.on("onQuestion", (questionData) => {
          setCurrentQuestion(questionData);
          setShowResults(false);
          setShowCorrectAnswer(false);
          setAllPlayersAnswered(false);
          // Clear previous answers when new question is received
          setPlayers((prev) =>
            prev.map((player) => ({
              ...player,
              lastAnswer: null,
              lastPoints: 0
            }))
          );
        });
  
        // New listener for answer history data
        socketService.on("onShowAnswerHistory", (historyData) => {
          console.log("Received answer history from server:", historyData);
          
          // Ensure we're receiving valid data before setting it
          if (Array.isArray(historyData) && historyData.length > 0) {
            setAnswerHistory(historyData);
            setShowAnswerHistoryModal(true);
          } else {
            console.warn("Received empty or invalid answer history data", historyData);
            // Even with empty data, we'll still show the modal with current player data
            setShowAnswerHistoryModal(true);
          }
        });
  
        socketService.on("onGameError", (error) => {
          console.error("Socket error:", error);
          setError(error.message || "Connection error");
        });
  
        // Join the host to the game
        socketService.hostJoin(gameData.pin, gameData._id, hostId);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError(err.message || "Failed to load game");
        setLoading(false);
      }
    };
  
    initGame();
  
    return () => {
      // Clean up socket connection when component unmounts
      socketService.disconnect();
    };
  }, [gameId]);

  // Watch for changes to determine if all players have answered
  useEffect(() => {
    if (gameState === "playing" && currentQuestion && players.length > 0) {
      const playersAnswered = players.filter(p => 
        typeof p.lastAnswer === 'number' || 
        p.answerIndex !== undefined || 
        p.answer !== undefined
      ).length;
      
      if (playersAnswered === players.length) {
        setAllPlayersAnswered(true);
        console.log("All players have answered:", players);
      }
    }
  }, [players, currentQuestion, gameState]);

  const handleStartGame = () => {
    if (!game || !game.quiz || game.quiz.questions.length === 0)
      return;

    setGameState("playing");
    setQuestionIndex(0); // устанавливаем индекс 0
    sendQuestion(0);

    socketService.startGame(game.pin, game._id);
  };

  const sendQuestion = (index) => {
    if (
      !game ||
      !game.quiz ||
      !game.quiz.questions ||
      index >= game.quiz.questions.length
    ) {
      console.warn("Invalid question index or missing quiz data");
      return;
    }

    console.log("sendQuestion called with index:", index);
    const question = game.quiz.questions[index];
    if (!question) return;

    setCurrentQuestion({
      index,
      number: index + 1,
      text: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      totalQuestions: game.quiz.questions.length,
    });

    setShowResults(false);

    socketService.sendQuestion(game.pin, {
      questionNumber: index + 1,
      totalQuestions: game.quiz.questions.length,
      text: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
    });
  };

  // Modified to show the modal before proceeding to next question
  const handleNextQuestion = () => {
    // If we should show answer history first
    if (allPlayersAnswered && !showAnswerHistoryModal) {
      // Optionally request answer history from server if not already received
      // socketService.requestAnswerHistory(game.pin, questionIndex);
      setShowAnswerHistoryModal(true);
      return;
    }
    
    // Reset states before moving to next question
    setShowAnswerHistoryModal(false);
    setShowCorrectAnswer(false);
    setAllPlayersAnswered(false);

    const nextIndex = questionIndex + 1;

    if (nextIndex >= game.quiz.questions.length) {
      handleEndGame();
      return;
    }

    setQuestionIndex(nextIndex);
    sendQuestion(nextIndex);

    socketService.nextQuestion(game.pin, game._id);
  };

  const handleEndGame = () => {
    if (game) {
      const finalResults = [...players].sort((a, b) => b.score - a.score);

      // Emit end game event
      socketService.endGame(game.pin, finalResults, game._id);

      // Update local state
      setGameState("finished");
      setShowResults(true);
    }
  };

  const handleKickPlayer = (playerId) => {
    if (game) {
      socketService.kickPlayer(game.pin, playerId);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
  
    const isLastQuestion = questionIndex === game.quiz.questions.length - 1;
    
    // Check if all players have answered
    const totalPlayersAnswered = players.filter(p => typeof p.lastAnswer === 'number').length;
    const showAnswerCounts = totalPlayersAnswered === players.length && players.length > 0;
  
    return (
      <div className="current-question">
        <h2>
          Question {questionIndex + 1} of {game.quiz.questions.length}
        </h2>
        <h3>{currentQuestion.text}</h3>
  
        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => {
            // Count players who chose this option
            const playersForThisOption = players.filter(
              (p) => typeof p.lastAnswer === 'number' && p.lastAnswer === index
            );
            
            const answerCount = playersForThisOption.length;
            const playerText = answerCount === 1 ? 'player' : 'players';
  
            return (
              <div
                key={index}
                className={`answer-box answer-${index} ${
                  showCorrectAnswer && index === currentQuestion.correctAnswer
                    ? "correct"
                    : ""
                }`}
              >
                <div className="answer-content">
                  <span className="answer-text">{option}</span>
                  {showAnswerCounts && (
                    <span className="answer-count">
                      {answerCount} {playerText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
  
        <button
          className={`question-control-btn ${
            isLastQuestion ? "finish-btn" : ""
          } ${allPlayersAnswered ? "all-answered" : ""}`}
          onClick={handleNextQuestion}
        >
          {isLastQuestion ? "🏁 Finish Quiz" : "Next Question →"}
          {allPlayersAnswered && <span className="indicator">All Answered!</span>}
        </button>
      </div>
    );
  };

  const renderFinalResults = () => {
    // Remove possible duplicate players before displaying
    const uniquePlayers = [];
    const playerMap = new Map();
    
    console.log("Current players state for final results:", players);
    
    players.forEach(player => {
      if (!player.nickname) return; // Skip players without nickname
      
      // Use nickname as unique identifier
      if (!playerMap.has(player.nickname)) {
        playerMap.set(player.nickname, player);
        uniquePlayers.push(player);
      } else {
        // If player with this nickname already exists, keep the version with highest score
        const existingPlayer = playerMap.get(player.nickname);
        if ((player.score || 0) > (existingPlayer.score || 0)) {
          playerMap.set(player.nickname, player);
          // Replace in array
          const index = uniquePlayers.findIndex(p => p.nickname === player.nickname);
          if (index !== -1) {
            uniquePlayers[index] = player;
          }
        }
      }
    });
    
    // Sort by descending score
    const sortedPlayers = uniquePlayers.sort((a, b) => (b.score || 0) - (a.score || 0));
    console.log("Sorted unique players for final results:", sortedPlayers);
    
    return (
      <div className="final-results">
        <h1>🏆 Quiz Over – Final Results</h1>
        <p className="results-info">Players may be updating their scores with the Wheel of Fortune</p>
        
        <div className="top-three">
          {sortedPlayers.slice(0, 3).map((player, index) => (
            <div
              key={player.id || player.socketId || index}
              className={`player-card ${["silver", "gold", "bronze"][index]}`}
            >
              <div className="player-avatar"></div>
              <div className="player-name">{player.nickname}</div>
              <div className="player-score">{player.score || 0} pts</div>
            </div>
          ))}
        </div>
        
        <div className="ranking-list">
          <ul>
            {sortedPlayers.slice(3).map((player, index) => (
              <li key={player.id || player.socketId || index}>
                <span className="rank-number">{index + 4}</span>
                <span className="rank-name">{player.nickname}</span>
                <span className="rank-score">{player.score || 0} pts</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button className="play-again" onClick={() => navigate("/dashboard")}>
          🔁 Back to Dashboard
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
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="host-game error">
        <h2>Game not found</h2>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
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
            {(() => {
              // Deduplicate players by nickname
              const uniquePlayers = [];
              const playerNicknames = new Set();

              players.forEach((player) => {
                if (!playerNicknames.has(player.nickname)) {
                  playerNicknames.add(player.nickname);
                  uniquePlayers.push(player);
                } else {
                  // If player with this nickname already exists, update score
                  const existingPlayer = uniquePlayers.find(
                    (p) => p.nickname === player.nickname
                  );
                  if (existingPlayer && player.score > existingPlayer.score) {
                    existingPlayer.score = player.score;
                    existingPlayer.lastAnswer = player.lastAnswer;
                    existingPlayer.lastPoints = player.lastPoints;
                  }
                }
              });

              // Return unique players
              return uniquePlayers.map((player) => (
                <div key={player.id || player.socketId} className="player-item">
                  <div className="player-info">
                    <span className="player-nickname">{player.nickname}</span>
                    <span className="player-score">
                      Score: {player.score?.toLocaleString() || 0}
                    </span>
                  </div>
                  {gameState === "waiting" && (
                    <button
                      className="kick-button"
                      onClick={() =>
                        handleKickPlayer(player.id || player.socketId)
                      }
                      aria-label={`Kick ${player.nickname}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ));
            })()}
          </div>
          {players.length === 0 && (
            <p className="no-players">Waiting for players to join...</p>
          )}
        </div>

        <div className="game-main">
          {gameState === "waiting" && (
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

          {gameState === "playing" && renderQuestion()}

          {gameState === "finished" && renderFinalResults()}
        </div>
      </div>

      {/* Answer History Modal - now using players directly since we're already tracking answer data */}
      <AnswerHistoryModal
        isOpen={showAnswerHistoryModal}
        onClose={handleNextQuestion}
        players={players}
        currentQuestion={currentQuestion}
      />
    </div>
  );
};

export default HostGame;