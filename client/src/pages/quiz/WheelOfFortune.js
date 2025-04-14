import React, { useState } from 'react';

const WheelOfFortune = ({ onComplete }) => {
  const [spinning, setSpinning] = useState(false);
  
  const wheelOptions = [
    { text: '+10%', value: 0.1, type: 'bonus' },
    { text: '+5%', value: 0.05, type: 'bonus' },
    { text: '-5%', value: -0.05, type: 'penalty' },
    { text: '-10%', value: -0.1, type: 'penalty' }
  ];

  const spinWheel = () => {
    setSpinning(true);
    const randomDegrees = Math.floor(Math.random() * 360);
    const selectedIndex = Math.floor(randomDegrees / (360 / wheelOptions.length));
    
    setTimeout(() => {
      setSpinning(false);
      onComplete(wheelOptions[selectedIndex]);
    }, 3000);
  };

  return (
    <div className="wheel-container">
      <div className={`wheel ${spinning ? 'spinning' : ''}`}>
        {wheelOptions.map((option, index) => (
          <div
            key={index}
            className="wheel-section"
            style={{
              transform: `rotate(${index * (360 / wheelOptions.length)}deg)`
            }}
          >
            {option.text}
          </div>
        ))}
      </div>
      <button onClick={spinWheel} disabled={spinning}>
        Spin the Wheel
      </button>
      <button onClick={() => onComplete(null)}>Skip</button>
    </div>
  );
};

export default WheelOfFortune;