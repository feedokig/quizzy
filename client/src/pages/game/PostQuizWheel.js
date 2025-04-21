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
  const [finalScore, setFinalScore] = useState(score);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    // Создаем новое подключение для страницы с колесом
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-wheel', { pin, gameId });

    newSocket.on('wheel-result', ({ updatedScore }) => {
      setFinalScore(updatedScore);
      // Даем время увидеть результат
      setTimeout(() => {
        navigate(`/game/${gameId}/results`, {
          state: { finalScore: updatedScore }
        });
      }, 3000);
    });

    return () => newSocket.disconnect();
  }, [pin, gameId, navigate]);

  const handleSpin = async (multiplier) => {
    setHasSpun(true);
    if (socket) {
      socket.emit('wheel-spin', {
        pin,
        gameId,
        multiplier,
        currentScore: score
      });
    }
  };

  const handleSkip = () => {
    navigate(`/game/${gameId}/results`, {
      state: { finalScore: score }
    });
  };

  if (!location.state) {
    return <div>Invalid access</div>;
  }

  return (
    <div className="post-quiz-wheel">
      <h1>🎡 Wheel of Fortune</h1>
      <div className="score-display">
        Current Score: {score}
      </div>

      {!hasSpun ? (
        <div className="wheel-container">
          <WheelOfFortune
            options={[
              { label: '🎉 +10%', value: 1.1 },
              { label: '⭐ +5%', value: 1.05 },
              { label: '😬 -5%', value: 0.95 },
              { label: '💥 -10%', value: 0.9 }
            ]}
            onSpinEnd={handleSpin}
          />
          <button 
            className="skip-button"
            onClick={handleSkip}
          >
            Skip Wheel ⏩
          </button>
        </div>
      ) : (
        <div className="result-display">
          <h2>Your final score will appear soon...</h2>
          <div className="loader">🎲</div>
        </div>
      )}
    </div>
  );
};

export default PostQuizWheel;