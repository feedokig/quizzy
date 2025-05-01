import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/LanguageToggle';
import './GameResults.css';

const GameResults = ({ players: propPlayers }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState(propPlayers || location.state?.players || []);

  useEffect(() => {
    if (location.state?.finalScore) {
      const playerNickname = localStorage.getItem('playerNickname');
      if (playerNickname) {
        setPlayers((prevPlayers) => {
          const currentPlayers = prevPlayers.length
            ? [...prevPlayers]
            : [{ nickname: playerNickname, score: location.state.finalScore }];

          const playerIndex = currentPlayers.findIndex(
            (p) => p.nickname === playerNickname
          );

          if (playerIndex !== -1) {
            currentPlayers[playerIndex] = {
              ...currentPlayers[playerIndex],
              score: location.state.finalScore,
            };
          } else {
            currentPlayers.push({
              nickname: playerNickname,
              score: location.state.finalScore,
              id: Date.now().toString(),
            });
          }
          return currentPlayers;
        });
      }
    }
  }, [location.state]);

  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  return (
    <div className="game-results">
      <LanguageToggle />
      <h1 className="results-title">{t('gameResults.title')}</h1>

      {sortedPlayers.length > 0 ? (
        <>
          <div className="top-three">
            {sortedPlayers.slice(0, 3).map((player, index) => {
              const medals = ['silver', 'gold', 'bronze'];
              const position = index === 1 ? 0 : index === 0 ? 1 : 2;

              return (
                <div
                  key={player.id || index}
                  className={`player-card ${medals[position]}`}
                >
                  <div className="player-avatar"></div>
                  <div className="player-name">{player.nickname}</div>
                  <div className="player-score">{player.score} {t('gameResults.points')}</div>
                </div>
              );
            })}
          </div>

          {sortedPlayers.length > 3 && (
            <div className="ranking-list">
              <ul>
                {sortedPlayers.slice(3).map((player, index) => (
                  <li key={player.id || `player-${index}`}>
                    <span className="rank-number">{index + 4}</span>
                    <span className="rank-name">{player.nickname}</span>
                    <span className="rank-score">{player.score} {t('gameResults.points')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="no-results">
          <p>{t('gameResults.noResults')}</p>
        </div>
      )}

      <button className="play-again" onClick={() => navigate('/dashboard')}>
        {t('gameResults.playAgain')}
      </button>
    </div>
  );
};

export default GameResults;