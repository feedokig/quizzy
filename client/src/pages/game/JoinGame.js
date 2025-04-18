import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinGame.css';

const JoinGame = () => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!pin || !nickname.trim()) {
      setError('Please enter both PIN and nickname');
      return;
    }
  
    try {
      // Store nickname in localStorage
      localStorage.setItem('playerNickname', nickname.trim());
      
      // Navigate to game with nickname as state
      navigate(`/play/${pin}`, {
        state: { nickname: nickname.trim() }
      });
    } catch (error) {
      setError('Failed to join game. Please check the PIN and try again.');
    }
  };

  return (
    <div className="join-game-container">
      <div className="join-game-form">
        <h1>Join a Game</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleJoinGame}>
          <input
            type="text"
            placeholder="Enter Game PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
          />
          <input
            type="text"
            placeholder="Choose a nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={15}
          />
          <button type="submit">Join</button>
        </form>
      </div>
    </div>
  );
};

export default JoinGame;
