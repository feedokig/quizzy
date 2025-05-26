import React, { useState } from 'react';
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
      localStorage.setItem('playerNickname', nickname.trim());
      navigate(`/play/${pin}`, {
        state: { nickname: nickname.trim() },
      });
    } catch (error) {
      setError(t('joinGame.error.failed'));
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