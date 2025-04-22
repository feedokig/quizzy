import React, { useState, useEffect, useRef } from 'react';
import './WheelOfFortune.css';

const WheelOfFortune = ({ onSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const spinTimeoutRef = useRef(null);
  const wheelRef = useRef(null);

  const prizes = [
    { icon: '🎉', value: 1.1, text: '+10%', color: '#f6d365' },
    { icon: '⭐', value: 1.05, text: '+5%', color: '#fda085' },
    { icon: '😬', value: 0.95, text: '-5%', color: '#a8e063' },
    { icon: '💥', value: 0.9, text: '-10%', color: '#e74c3c' }
  ];

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Calculate random prize
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const randomPrize = prizes[randomIndex];
    
    // Calculate rotation to land on the selected prize
    // Each segment is 90 degrees (360/4), so we calculate the rotation to land 
    // precisely at the selected segment plus some extra rotations for effect
    const baseAngle = 360 / prizes.length;
    const targetAngle = baseAngle * randomIndex;
    const extraRotations = 3 * 360; // 3 full rotations for effect
    
    // Final rotation needs to position the prize at the top pointer
    // 90 degrees is the offset to place the pointer at top
    const finalRotation = extraRotations + (360 - targetAngle - 90);
    
    setRotation(finalRotation);
    
    // Save reference to timeout
    spinTimeoutRef.current = setTimeout(() => {
      setResult(randomPrize);
      setIsSpinning(false);
      
      // Call the provided handler with the result
      if (onSpin && typeof onSpin === 'function') {
        onSpin(randomPrize.value);
      }
    }, 3000);
  };

  return (
    <div className="wheel-container">
      <h3>Spin to modify your score!</h3>
      <div className="wheel-wrapper">
        <div className="wheel-pointer"></div>
        <div 
          ref={wheelRef}
          className={`wheel ${isSpinning ? 'spinning' : ''}`} 
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {prizes.map((prize, index) => {
            // Calculate rotation for each segment
            const segmentRotation = (index * (360 / prizes.length));
            
            return (
              <div 
                key={index} 
                className="wheel-section"
                style={{ 
                  transform: `rotate(${segmentRotation}deg)`,
                  backgroundColor: prize.color
                }}
              >
                <div className="wheel-content">
                  <div className="prize-icon">{prize.icon}</div>
                  <div className="prize-text">{prize.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button 
        className="spin-button"
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