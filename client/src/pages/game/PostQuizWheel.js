import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import WheelOfFortune from '../../components/WheelOfFortune';
import './PostQuizWheel.css';

const PostQuizWheel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const { score, pin, gameId } = location.state || {};
  const [currentScore, setCurrentScore] = useState(score);
  const [finalScore, setFinalScore] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [multiplier, setMultiplier] = useState(null);
  const nickname = localStorage.getItem('playerNickname');

  useEffect(() => {
    if (!pin || !gameId) return;

    // Create new connection for the wheel page
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join the wheel room
    newSocket.emit('join-wheel', { pin, gameId, nickname });

    // Listen for wheel result updates
    newSocket.on('wheel-result', ({ updatedScore, multiplier }) => {
      console.log('Received wheel result:', updatedScore, multiplier);
      setFinalScore(updatedScore);
    });

    return () => newSocket.disconnect();
  }, [pin, gameId, nickname]);

  const handleSpin = async (multiplierValue) => {
    setHasSpun(true);
    setMultiplier(multiplierValue);
    
    if (socket) {
      // Calculate new score locally (for immediate feedback)
      const newScore = Math.round(currentScore * multiplierValue);
      setFinalScore(newScore);
      
      // Send to server for persistence and broadcast to host
      socket.emit('wheel-spin', {
        pin,
        gameId,
        multiplier: multiplierValue,
        currentScore,
        nickname
      });
    }
  };

  const handleSkip = () => {
    // If user skips, we still need to inform the server
    if (socket) {
      socket.emit('wheel-skip', {
        pin,
        gameId,
        nickname,
        currentScore
      });
    }
    
    // Navigate to results with current score
    navigate(`/game/${gameId}/results`, {
      state: { finalScore: currentScore }
    });
  };

  const goToResults = () => {
    navigate(`/game/${gameId}/results`, {
      state: { finalScore: finalScore || currentScore }
    });
  };

  if (!location.state) {
    return <div>Invalid access</div>;
  }

  return (
    <div className="post-quiz-wheel">
      <h1>🎡 Wheel of Fortune</h1>
      <div className="score-display">
        Current Score: {currentScore}
      </div>

      {!hasSpun ? (
        <div className="wheel-container">
          <WheelOfFortune onSpin={handleSpin} />
          <button 
            className="skip-button"
            onClick={handleSkip}
          >
            Skip Wheel ⏩
          </button>
        </div>
      ) : (
        <div className="result-section">
          <h2>Spin Result</h2>
          <div className="score-change">
            <span className="old-score">{currentScore}</span>
            <span className="arrow">➡️</span>
            <span className="new-score">{finalScore}</span>
          </div>
          <div className="multiplier-info">
            Multiplier: {multiplier < 1 ? (multiplier - 1) * 100 + '%' : '+' + (multiplier - 1) * 100 + '%'}
          </div>
          <button 
            className="continue-button"
            onClick={goToResults}
          >
            Continue to Results ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default PostQuizWheel;