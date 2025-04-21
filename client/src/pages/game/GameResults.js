// pages/game/GameResults

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameResults.css';

const GameResults = ({ players: propPlayers }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState(propPlayers || location.state?.players || []);
  
  // Если результаты пришли из колеса фортуны для текущего игрока
  useEffect(() => {
    if (location.state?.finalScore) {
      // Обновляем счет текущего игрока в локальном представлении (без отправки на сервер)
      const playerNickname = localStorage.getItem('playerNickname');
      if (playerNickname) {
        setPlayers(prevPlayers => {
          // Если игрок уже существует в списке - обновляем его счет
          const updatedPlayers = [...prevPlayers];
          const playerIndex = updatedPlayers.findIndex(p => p.nickname === playerNickname);
          
          if (playerIndex !== -1) {
            updatedPlayers[playerIndex] = {
              ...updatedPlayers[playerIndex],
              score: location.state.finalScore
            };
          }
          return updatedPlayers;
        });
      }
    }
  }, [location.state]);

  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="game-results">
      <h1 className="results-title">🏆 Quiz Over – Final Rankings</h1>

      <div className="top-three">
        {sortedPlayers.map((player, index) => {
          const medals = ['silver', 'gold', 'bronze'];
          const position = index === 1 ? 0 : index === 0 ? 1 : 2;
          
          return (
            <div key={player.id} className={`player-card ${medals[position]}`}>
              <div className="player-avatar"></div>
              <div className="player-name">{player.nickname}</div>
              <div className="player-score">{player.score} pts</div>
            </div>
          );
        })}
      </div>

      {/* <div className="ranking-list">
        <ul>
          {rest.map((player, index) => (
            <li key={player.id}>
              <span className="rank-number">{index + 4}</span>
              <span className="rank-name">{player.nickname}</span>
              <span className="rank-score">{player.score} pts</span>
            </li>
          ))}
        </ul>
      </div> */}

      <button className="play-again" onClick={() => navigate('/dashboard')}>
        🔁 Back to Dashboard
      </button>
    </div>
  );
};

export default GameResults;
