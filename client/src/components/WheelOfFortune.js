import React, { useState, useRef } from 'react';
import './WheelOfFortune.css';

const WheelOfFortune = ({ onSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const spinTimeoutRef = useRef(null);
  const wheelRef = useRef(null);

  // Призы с четко видимыми модификаторами
  const prizes = [
    { icon: '🎉', value: 1.2, text: '+20%', color: '#FF9900' },
    { icon: '⭐', value: 1.1, text: '+10%', color: '#2196F3' },
    { icon: '💫', value: 1.05, text: '+5%', color: '#4CAF50' }, 
    { icon: '🔥', value: 0.95, text: '-5%', color: '#E91E63' },
    { icon: '💥', value: 0.9, text: '-10%', color: '#F44336' },
    { icon: '🌟', value: 0.85, text: '-15%', color: '#9C27B0' }
  ];

  // Очистка таймаута при размонтировании
  React.useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Убираем воспроизведение звука, которое вызывает ошибку
    
    // Вычисляем случайный приз
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const randomPrize = prizes[randomIndex];
    
    // Вычисляем вращение для выбранного приза
    const baseAngle = 360 / prizes.length;
    const targetAngle = baseAngle * randomIndex;
    
    // 4-5 полных оборотов для эффекта
    const extraRotations = (4 + Math.floor(Math.random() * 2)) * 360;
    
    // Финальное вращение должно позиционировать приз в указателе наверху
    const finalRotation = extraRotations + (360 - targetAngle - (baseAngle / 2));
    
    setRotation(finalRotation);
    
    // Длительность вращения
    const spinDuration = 4000;
    
    // Сохраняем ссылку на таймаут
    spinTimeoutRef.current = setTimeout(() => {
      setResult(randomPrize);
      setIsSpinning(false);
      
      // Вызываем обработчик с результатом
      if (onSpin && typeof onSpin === 'function') {
        onSpin(randomPrize.value);
      }
    }, spinDuration);
  };
  
  return (
    <div className="wheel-container">
      <h3>Испытайте удачу!</h3>
      <div className="wheel-wrapper">
        {/* Указатель */}
        <div className="wheel-pointer"></div>
        
        {/* Колесо */}
        <div 
          ref={wheelRef}
          className={`wheel ${isSpinning ? 'spinning' : ''}`} 
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? `transform ${4}s cubic-bezier(0.2, 0.8, 0.05, 1)` : 'none'
          }}
        >
          {prizes.map((prize, index) => {
            const rotationAngle = (index * (360 / prizes.length));
            
            return (
              <div 
                key={index} 
                className="wheel-sector"
                style={{ 
                  transform: `rotate(${rotationAngle}deg)`
                }}
              >
                <div className="sector-content">
                  <div className="prize-icon">{prize.icon}</div>
                  <div className="prize-text">{prize.text}</div>
                </div>
              </div>
            );
          })}
          
          {/* Центр колеса */}
          <div className="wheel-center"></div>
        </div>
      </div>
      
      <button 
        className="spin-button"
        onClick={handleSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Вращается...' : 'Крутить!'}
      </button>
      
      {result && (
        <div className="result">
          <p>Ваш выигрыш: <span className="result-highlight">{result.icon} {result.text}</span></p>
        </div>
      )}
    </div>
  );
};

export default WheelOfFortune;