// pages/game/HostGame
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import gameService from "../../services/gameService";
import "./HostGame.css";

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const initGame = async () => {
      try {
        setLoading(true);
        const hostId = localStorage.getItem("userId");
        
        if (!hostId) {
          throw new Error("User not authenticated");
        }

        if (!quizId) {
          throw new Error("Quiz ID is required");
        }

        // Use gameService instead of direct axios call
        const gameData = await gameService.createGame(quizId, hostId);
        console.log("Game created:", gameData); // Debug log

        if (!gameData || !gameData.pin) {
          throw new Error("Invalid game data received");
        }

        setGame(gameData);

        // Initialize socket connection
        const newSocket = io("http://localhost:5000", {
          transports: ['websocket'],
          query: {
            gameId: gameData._id,
            hostId
          }
        });
        
        // Join host to game room
        newSocket.emit("host-join", { 
          pin: gameData.pin,
          gameId: gameData._id,
          hostId 
        });

        // Listen for player joins
        newSocket.on("player-joined", (player) => {
          console.log("Player joined:", player); // Debug log
          setPlayers(prev => [...prev, player]);
        });

        // Listen for errors
        newSocket.on("error", (error) => {
          console.error("Socket error:", error);
          setError(error.message || "Connection error");
        });

        setSocket(newSocket);
        setLoading(false);

      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError(err.message || "Failed to create game");
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [quizId]);

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
        <h1>Game PIN: {game.pin}</h1>
        <p className="quiz-name">Quiz: {game.quiz.title}</p>
      </div>

      <div className="players-section">
        <h2>Players ({players.length})</h2>
        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className="player-item">
              {player.nickname}
            </div>
          ))}
        </div>
        {players.length === 0 && (
          <p className="no-players">Waiting for players to join...</p>
        )}
      </div>

      <div className="game-controls">
        <button 
          className="start-button"
          disabled={players.length === 0}
          onClick={() => socket.emit("start-game", { pin: game.pin })}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HostGame;