import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PlayerGame.css';
import socketService from '../../services/socketService';

const PlayerGame = () => {
  const { t } = useTranslation();
  const { pin } = useParams();
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const navigate = useNavigate();
  const [availableBoosts, setAvailableBoosts] = useState({
    fifty_fifty: true,
  });
  const [activeBoosts, setActiveBoosts] = useState({
    fifty_fifty: false,
  });
  const [reducedOptions, setReducedOptions] = useState(null);
  const hasJoined = useRef(false);
  
  useEffect(() => {
    const socket = socketService.connect();
  
    localStorage.setItem('gamePin', pin);
  
    const handleQuestion = (questionData) => {
      console.log('Received question:', questionData);
      setQuestion(questionData);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setReducedOptions(null);
    };

    const handleAnswerResult = (result) => {
      console.log('Answer result:', result);
      
      if (result.totalScore !== undefined) {
        setScore(result.totalScore);
      }
      
      setCorrectAnswer(result.correctAnswer);
    };

    const handleUpdatePlayers = (players) => {
      console.log('Updated players list received:', players);
      const currentPlayer = players.find(p => p.socketId === socketService.getSocket().id || p.id === socketService.getSocket().id);
      if (currentPlayer && typeof currentPlayer.score === 'number') {
        setScore(currentPlayer.score);
      }
    };

    const handlePlayerRejoined = (data) => {
      console.log('Player rejoined with data:', data);
      if (typeof data.score === 'number') {
        setScore(data.score);
      }
    };

    const handleFiftyFiftyOptions = (options) => {
      console.log('Received reduced options:', options);
      setReducedOptions(options);
    };

    const handleGameEnded = () => {
      setGameState('ended');
    };

    const handleQuizFinished = (data) => {
      console.log('Quiz finished event received:', data);
      navigate(`/game/results`, {
        state: {
          finalScore: score
        },
      });
    };

    const handleMaxPlayersUpdated = ({ maxPlayers }) => {
      setMaxPlayers(maxPlayers);
    };

    const handleJoinError = (error) => {
      console.error('Join error:', error);
    };

    socketService.on('question', handleQuestion);
    socketService.on('answer-result', handleAnswerResult);
    socketService.on('update-players', handleUpdatePlayers);
    socketService.on('player-rejoined', handlePlayerRejoined);
    socketService.on('fifty-fifty-options', handleFiftyFiftyOptions);
    socketService.on('game-ended', handleGameEnded);
    socketService.on('quiz:finished', handleQuizFinished);
    socketService.on('max-players-updated', handleMaxPlayersUpdated);
    socketService.on('join-error', handleJoinError);

    const nickname = localStorage.getItem('playerNickname');
    if (!hasJoined.current) {
      console.log('Joining game:', { pin, nickname });
      socketService.playerJoin(pin, nickname);
      hasJoined.current = true;
    }

    return () => {
      socketService.off('question', handleQuestion);
      socketService.off('answer-result', handleAnswerResult);
      socketService.off('update-players', handleUpdatePlayers);
      socketService.off('player-rejoined', handlePlayerRejoined);
      socketService.off('fifty-fifty-options', handleFiftyFiftyOptions);
      socketService.off('game-ended', handleGameEnded);
      socketService.off('quiz:finished', handleQuizFinished);
      socketService.off('max-players-updated', handleMaxPlayersUpdated);
      socketService.off('join-error', handleJoinError);
    };
  }, [pin, navigate, score]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || !question) return;
    setSelectedAnswer(index);
    console.log('Submitting answer:', index);
    
    const activeBoostsList = Object.entries(activeBoosts)
      .filter(([_, isActive]) => isActive)
      .map(([boostType]) => boostType);
    
    console.log('Active boosts when answering:', activeBoostsList);
    
    socketService.submitAnswer(pin, index, 0, activeBoostsList);

    if (activeBoosts.fifty_fifty) {
      setActiveBoosts(prev => ({
        ...prev,
        fifty_fifty: false
      }));
    }
  };

  const activateBoost = (boostType) => {
    if (!availableBoosts[boostType]) return;
    
    console.log(`Activating boost: ${boostType}`);
    
    setAvailableBoosts(prev => ({
      ...prev,
      [boostType]: false
    }));
    
    setActiveBoosts(prev => ({
      ...prev,
      [boostType]: true
    }));
    
    if (boostType === 'fifty_fifty') {
      socketService.activateBoost(pin, boostType, question.questionNumber - 1);
    }
  };

  const renderBoostButtons = () => (
    <div className="boosts-container">
      <button 
        className={`boost-button fifty-fifty ${!availableBoosts.fifty_fifty ? 'used' : ''} ${activeBoosts.fifty_fifty ? 'active' : ''}`}
        onClick={() => activateBoost('fifty_fifty')}
        disabled={!availableBoosts.fifty_fifty || selectedAnswer !== null}
      >
        <span className="boost-icon">{t('playerGame.boost.fiftyFiftyIcon')}</span>
        <span className="boost-name">{t('playerGame.boost.fiftyFiftyName')}</span>
        <span className="boost-status">
          {!availableBoosts.fifty_fifty
            ? t('playerGame.boost.used')
            : activeBoosts.fifty_fifty
            ? t('playerGame.boost.active')
            : t('playerGame.boost.available')}
        </span>
      </button>
    </div>
  );

  const renderAnswer = (option, index) => {
    if (reducedOptions && !reducedOptions.includes(index)) {
      return null;
    }
    
    return (
      <button
        key={index}
        className={`answer-button answer-${index} ${
          selectedAnswer === index ? 'selected' : ''
        } ${correctAnswer !== null && index === correctAnswer ? 'correct' : ''} ${
          correctAnswer !== null &&
          selectedAnswer === index &&
          index !== correctAnswer
            ? 'wrong'
            : ''
        }`}
        onClick={() => handleAnswer(index)}
        disabled={selectedAnswer !== null}
      >
        {option}
      </button>
    );
  };

  return (
    <div className="player-game">
      {gameState === 'ended' ? (
        <div className="game-ended">
          <h2>{t('playerGame.gameOver')}</h2>
          <div className="final-score">{t('playerGame.finalScore').replace('{score}', score)}</div>
        </div>
      ) : question ? (
        <>
          <div className="game-header">
            <div className="question-count">
              {t('playerGame.questionCount').replace('{current}', question.questionNumber).replace('{total}', question.totalQuestions)}
            </div>
            <div className="score-display">{t('playerGame.scoreDisplay').replace('{score}', score)}</div>
          </div>
          
          <div className="question-container">
            <h2 className="question-text">{question.text}</h2>
            {renderBoostButtons()}
            <div className="answers-grid">
              {question.options.map((option, index) =>
                renderAnswer(option, index)
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="waiting">
          <h2>{t('playerGame.waiting')}</h2>
          {score > 0 && (
            <div className="current-score">{t('playerGame.scoreDisplay').replace('{score}', score)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerGame;