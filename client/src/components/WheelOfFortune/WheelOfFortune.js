import React, { useState } from 'react';
import './WheelOfFortune.css';

const WheelOfFortune = ({ onSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const prizes = [
    { icon: '🎉', value: 1.1, text: '+10%' },
    { icon: '⭐', value: 1.05, text: '+5%' },
    { icon: '😬', value: 0.95, text: '-5%' },
    { icon: '💥', value: 0.9, text: '-10%' }
  ];

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    
    setTimeout(() => {
      setResult(randomPrize);
      setIsSpinning(false);
      onSpin(randomPrize.value);
    }, 3000);
  };

  return (
    <div className="wheel-container">
      <h3>Spin the Wheel of Fortune!</h3>
      <div className={`wheel ${isSpinning ? 'spinning' : ''}`}>
        {prizes.map((prize, index) => (
          <div key={index} className="wheel-section">
            {prize.icon}
          </div>
        ))}
      </div>
      <button 
        onClick={handleSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Spinning...' : 'Spin!'}
      </button>
      {result && (
        <div className="result">
          <p>You got: {result.icon} ({result.text})</p>
        </div>
      )}
    </div>
  );
};

export default WheelOfFortune;