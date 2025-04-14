import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./JoinGame.css";

const JoinGame = () => {
  const [gameState, setGameState] = useState("join"); // join, waiting, playing, finished
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [boosts, setBoosts] = useState({
    doublePoints: false,
    fiftyFifty: false,
    timeFreeze: false,
  });
  const [score, setScore] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const handleJoinGame = async () => {
    try {
      if (!pin || !nickname) {
        setError("Please enter both PIN and nickname");
        return;
      }

      socket.emit("player-join", { pin, nickname });

      socket.on("game-joined", () => {
        setGameState("waiting");
        setError("");
      });

      socket.on("game-error", (error) => {
        setError(error);
      });

      socket.on("game-started", () => {
        setGameState("playing");
      });

      socket.on("question", (question) => {
        setCurrentQuestion(question);
      });

      socket.on("game-ended", (finalScore) => {
        setGameState("finished");
        setScore(finalScore);
      });
    } catch (err) {
      setError("Failed to join the game. Please check the PIN and try again.");
    }
  };

  const handleAnswer = (answerIndex) => {
    socket.emit("submit-answer", {
      pin,
      answerIndex,
      boosts: Object.keys(boosts).filter((boost) => boosts[boost]),
    });
  };

  const useBoost = (boostType) => {
    if (!boosts[boostType]) {
      setBoosts((prev) => ({ ...prev, [boostType]: true }));
      socket.emit("use-boost", { pin, boostType });
    }
  };

  const handleBoost = (boostType) => {
    if (!boosts[boostType]) {
      setBoosts((prev) => ({ ...prev, [boostType]: true }));
      socket.emit("use-boost", { pin, boostType });
    }
  };

  const renderGameState = () => {
    switch (gameState) {
      case "join":
        return (
          <div className="game-form">
            <h1>Join a Game</h1>
            <input
              type="text"
              placeholder="Enter Game PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
            />
            <input
              type="text"
              placeholder="Enter Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            <button onClick={handleJoinGame}>Join</button>
          </div>
        );

      case "waiting":
        return (
          <div className="waiting-screen">
            <h2>Waiting for host to start the game...</h2>
            <p>You've joined as: {nickname}</p>
          </div>
        );

      case "playing":
        return (
          <div className="game-screen">
            {currentQuestion && (
              <>
                <div className="question">
                  <h2>{currentQuestion.text}</h2>
                  <div className="answers">
                    {currentQuestion.options.map((option, index) => (
                      <button key={index} onClick={() => handleAnswer(index)}>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="boosts">
                  <button
                    onClick={() => handleBoost("doublePoints")}
                    disabled={boosts.doublePoints}
                  >
                    🔥 X2 Points
                  </button>
                  <button
                    onClick={() => handleBoost("fiftyFifty")}
                    disabled={boosts.fiftyFifty}
                  >
                    🛡️ 50/50
                  </button>
                  <button
                    onClick={() => handleBoost("timeFreeze")}
                    disabled={boosts.timeFreeze}
                  >
                    ❄️ Time Freeze
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case "finished":
        return (
          <div className="game-end">
            <h2>Game Finished!</h2>
            <p>Your score: {score}</p>
          </div>
        );
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="join-game-container">
      {renderGameState()}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default JoinGame;
