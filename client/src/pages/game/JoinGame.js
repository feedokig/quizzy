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
    if (!pin || !nickname) {
      setError('Please enter both PIN and nickname');
      return;
    }

    try {
      // Сохраняем никнейм в localStorage для использования в игре
      localStorage.setItem('playerNickname', nickname);
      // Перенаправляем на страницу игры
      navigate(`/play/${pin}`);
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
