import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameResults.css';

const GameResults = ({ players: propPlayers }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState(propPlayers || location.state?.players || []);
  
  // If results came from the wheel of fortune for current player
  useEffect(() => {
    if (location.state?.finalScore) {
      // Update current player's score in local view
      const playerNickname = localStorage.getItem('playerNickname');
      if (playerNickname) {
        setPlayers(prevPlayers => {
          // Create a copy if prevPlayers is empty
          const currentPlayers = prevPlayers.length ? [...prevPlayers] : [{ 
            nickname: playerNickname, 
            score: location.state.finalScore 
          }];
          
          // If player already exists in the list - update their score
          const playerIndex = currentPlayers.findIndex(p => p.nickname === playerNickname);
          
          if (playerIndex !== -1) {
            currentPlayers[playerIndex] = {
              ...currentPlayers[playerIndex],
              score: location.state.finalScore
            };
          } else {
            // Add player if not found
            currentPlayers.push({
              nickname: playerNickname,
              score: location.state.finalScore,
              id: Date.now().toString() // Temporary ID for rendering
            });
          }
          return currentPlayers;
        });
      }
    }
  }, [location.state]);

  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="game-results">
      <h1 className="results-title">🏆 Quiz Over – Final Rankings</h1>

      {sortedPlayers.length > 0 ? (
        <>
          <div className="top-three">
            {sortedPlayers.slice(0, 3).map((player, index) => {
              const medals = ['silver', 'gold', 'bronze'];
              const position = index === 1 ? 0 : index === 0 ? 1 : 2;
              
              return (
                <div key={player.id || index} className={`player-card ${medals[position]}`}>
                  <div className="player-avatar"></div>
                  <div className="player-name">{player.nickname}</div>
                  <div className="player-score">{player.score} pts</div>
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
                    <span className="rank-score">{player.score} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="no-results">
          <p>No player data available</p>
        </div>
      )}

      <button className="play-again" onClick={() => navigate('/dashboard')}>
        🔁 Back to Dashboard
      </button>
    </div>
  );
};

export default GameResults;