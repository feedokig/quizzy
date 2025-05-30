// client/src/components/JoinGame.js
import React, { useState } from 'react';
import gameService from '../../services/gameService';
import socketService from '../../services/socketService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './JoinGame.css';

const JoinGame = () => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!pin || !nickname.trim()) {
      setError(t('joinGame.error.emptyFields'));
      return;
    }

    try {
      console.log('Attempting to join game with PIN:', pin.trim());
      const game = await gameService.getGameByPin(pin.trim());
      console.log('Game found:', game);

      localStorage.setItem('playerNickname', nickname.trim());
      localStorage.setItem('gamePin', pin.trim());

      socketService.connect();
      socketService.playerJoin(pin.trim(), nickname.trim());

      socketService.on('game-joined', () => {
        console.log('Successfully joined game with PIN:', pin);
        navigate(`/play/${pin.trim()}`, {
          state: { nickname: nickname.trim(), game },
        });
      });

      socketService.on('join-error', (err) => {
        console.error('Join error:', err);
        setError(err.message || t('joinGame.error.failed'));
      });
    } catch (error) {
      console.error('Join game error:', error.message);
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