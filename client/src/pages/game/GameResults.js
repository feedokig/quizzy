// pages/game/GameResults

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameResults.css';

const GameResults = ({ players }) => {
  const navigate = useNavigate();
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  return (
    <div className="game-results">
      <h1 className="results-title">🏆 Quiz Over – Final Rankings</h1>

      <div className="top-three">
        {topThree.map((player, index) => {
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

      <div className="ranking-list">
        <ul>
          {rest.map((player, index) => (
            <li key={player.id}>
              <span className="rank-number">{index + 4}</span>
              <span className="rank-name">{player.nickname}</span>
              <span className="rank-score">{player.score} pts</span>
            </li>
          ))}
        </ul>
      </div>

      <button className="play-again" onClick={() => navigate('/dashboard')}>
        🔁 Back to Dashboard
      </button>
    </div>
  );
};

export default GameResults;
