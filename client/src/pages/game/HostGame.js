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
  const [showResults, setShowResults] = useState(false);
  const [gameState, setGameState] = useState("waiting");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

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

        const newSocket = io("http://localhost:5000", {
          transports: ["websocket"],
        });

        newSocket.emit("host-join", {
          pin: gameData.pin,
          gameId: gameData._id,
          hostId,
        });

        newSocket.on("update-players", (updatedPlayers) => {
          console.log("Players updated from server:", updatedPlayers);
          
          // Убедимся, что updatedPlayers - это массив
          if (Array.isArray(updatedPlayers)) {
            // Используем состояние напрямую от сервера
            setPlayers(updatedPlayers);
          }
        });

        newSocket.on("player-joined", ({ players }) => {
          console.log("Players list updated:", players);
          setPlayers(players);
        });

        newSocket.on("player-left", (playerId) => {
          console.log("Player left:", playerId);
          setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        });

        newSocket.on("player-answered", ({ playerId, nickname, score, answerIndex, totalAnswered, correctCount }) => {
          console.log("Player answered:", { playerId, nickname, score, answerIndex });
          
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
                score: score, // Используем общий счет от сервера
                lastAnswer: answerIndex
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
                  lastAnswer: answerIndex
                }
              ];
            }
          });
  
          // Show correct answer after a delay
          setTimeout(() => {
            setShowCorrectAnswer(true);
          }, 2000);
        });

        // Add this to clear answers when receiving new question
        newSocket.on("question", (questionData) => {
          setCurrentQuestion(questionData);
          setShowResults(false);
          setShowCorrectAnswer(false);
          // Clear previous answers when new question is received
          setPlayers((prev) =>
            prev.map((player) => ({
              ...player,
              lastAnswer: null,
            }))
          );
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
    if (!socket || !game || !game.quiz || game.quiz.questions.length === 0)
      return;

    setGameState("playing");
    setQuestionIndex(0); // устанавливаем индекс 0
    sendQuestion(0);

    socket.emit("start-game", {
      pin: game.pin,
      gameId: game._id,
    });
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

    socket.emit("new-question", {
      pin: game.pin,
      question: {
        questionNumber: index + 1,
        totalQuestions: game.quiz.questions.length,
        text: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
      },
    });
  };

  const handleNextQuestion = () => {
    setShowCorrectAnswer(false);

    const nextIndex = questionIndex + 1;

    if (nextIndex >= game.quiz.questions.length) {
      handleEndGame();
      return;
    }

    setQuestionIndex(nextIndex);
    sendQuestion(nextIndex);

    socket.emit("next-question", {
      pin: game.pin,
      gameId: game._id,
    });
  };

  const handleEndGame = () => {
    if (socket && game) {
      const finalResults = [...players].sort((a, b) => b.score - a.score);

      // Emit end game event
      socket.emit("end-game", {
        pin: game.pin,
        results: finalResults,
        gameId: game._id,
      });

      // Update local state
      setGameState("finished");
      setShowResults(true);
    }
  };

  const handleKickPlayer = (playerId) => {
    if (socket && game) {
      socket.emit("kick-player", {
        pin: game.pin,
        playerId,
      });
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const isLastQuestion = questionIndex === game.quiz.questions.length - 1;

    return (
      <div className="current-question">
        <h2>
          Question {questionIndex + 1} of {game.quiz.questions.length}
        </h2>
        <h3>{currentQuestion.text}</h3>

        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => {
            // Calculate number of players who chose this answer
            const answerCount = players.filter(
              (p) => p.lastAnswer === index
            ).length;

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
                  <span className="answer-count">
                    {answerCount} {/* Display count of answers */}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className={`question-control-btn ${
            isLastQuestion ? "finish-btn" : ""
          }`}
          onClick={isLastQuestion ? handleEndGame : handleNextQuestion}
        >
          {isLastQuestion ? "🏁 Finish Quiz" : "Next Question →"}
        </button>
      </div>
    );
  };

  const renderFinalResults = () => {
    // Удаляем возможные дубликаты игроков перед отображением
    const uniquePlayers = [];
    const playerMap = new Map();
    
    console.log("Current players state:", players);
    
    players.forEach(player => {
      if (!player.nickname) return; // Пропускаем игроков без никнейма
      
      // Используем никнейм в качестве уникального идентификатора
      if (!playerMap.has(player.nickname)) {
        playerMap.set(player.nickname, player);
        uniquePlayers.push(player);
      } else {
        // Если игрок с таким никнеймом уже существует, оставляем версию с наивысшим счетом
        const existingPlayer = playerMap.get(player.nickname);
        if ((player.score || 0) > (existingPlayer.score || 0)) {
          playerMap.set(player.nickname, player);
          // Заменяем в массиве
          const index = uniquePlayers.findIndex(p => p.nickname === player.nickname);
          if (index !== -1) {
            uniquePlayers[index] = player;
          }
        }
      }
    });
    
    // Сортируем по убыванию очков
    const sortedPlayers = uniquePlayers.sort((a, b) => (b.score || 0) - (a.score || 0));
    console.log("Sorted unique players:", sortedPlayers);
    
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
              // Дедупликация игроков по никнейму
              const uniquePlayers = [];
              const playerNicknames = new Set();

              players.forEach((player) => {
                if (!playerNicknames.has(player.nickname)) {
                  playerNicknames.add(player.nickname);
                  uniquePlayers.push(player);
                } else {
                  // Если игрок с таким никнеймом уже существует, обновляем очки
                  const existingPlayer = uniquePlayers.find(
                    (p) => p.nickname === player.nickname
                  );
                  if (existingPlayer && player.score > existingPlayer.score) {
                    existingPlayer.score = player.score;
                    existingPlayer.lastAnswer = player.lastAnswer;
                  }
                }
              });

              // Возвращаем отрисовку уникальных игроков
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
    </div>
  );
};

export default HostGame;
