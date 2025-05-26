// client/src/components/JoinGame.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gameService from '../services/gameService';
import socketService from '../services/socketService';
import './JoinGame.css';

const JoinGame = () => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || !nickname.trim()) {
      setError(t('joinGame.error.emptyFields'));
      return;
    }

    try {
      // Validate PIN
      const game = await gameService.getGameByPin(pin.trim());
      console.log('Game found:', game);

      // Store nickname
      localStorage.setItem('playerNickname', nickname.trim());

      // Connect to Socket.IO and join game
      socketService.connect();
      socketService.playerJoin(pin.trim(), nickname.trim());

      // Wait for confirmation
      socketService.on('game-joined', () => {
        console.log('Successfully joined game:', pin);
        navigate(`/play/${game._id}`, {
          state: { game, nickname: nickname.trim() },
        });
      });

      socketService.on('join-error', (error) => {
        console.error('Join error:', error);
        setError(error.message || t('joinGame.error.failed'));
      });
    } catch (error) {
      console.error('Join game error:', error);
      setError(error.message || t('joinGame.error.failed'));
    }
  };

  return (
    <div className="join-game-container">
      <div className="join-game-form">
        <h1>{t('joinGame.title')}</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleJoinGame}>
          <input
            type="text"
            placeholder={t('joinGame.pinPlaceholder')}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
          />
          <input
            type="text"
            placeholder={t('joinGame.nicknamePlaceholder')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={15}
          />
          <button type="submit">{t('joinGame.joinButton')}</button>
        </form>
      </div>
    </div>
  );
};

export default JoinGame;