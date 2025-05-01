import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gameService from '../../services/gameService';
import socketService from '../../services/socketService';
import AnswerHistoryModal from '../../components/AnswerHistoryModal';
import './HostGame.css';

const HostGame = () => {
  const { t } = useTranslation();
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state?.game || null);
  const [loading, setLoading] = useState(!location.state?.game);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [gameState, setGameState] = useState('waiting');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(game?.maxPlayers || 10);
  const [showAnswerHistoryModal, setShowAnswerHistoryModal] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      try {
        setPlayers([]);
        setLoading(true);
        const hostId = localStorage.getItem('userId');

        if (!hostId) {
          throw new Error(t('hostGame.error.notAuthenticated'));
        }

        let gameData = game;

        if (!gameData) {
          gameData = await gameService.getGame(gameId);
          console.log('Loaded game data:', gameData);

          if (!gameData || !gameData.pin) {
            throw new Error(t('hostGame.error.invalidGameData'));
          }
          if (!gameData.quiz || !gameData.quiz.questions) {
            console.error('Quiz or questions missing:', gameData);
            throw new Error(t('hostGame.error.quizMissing'));
          }
          setGame(gameData);
        }

        const socket = socketService.connect();

        socketService.on('updatePlayers', (updatedPlayers) => {
          console.log('Players updated from server:', updatedPlayers);
          if (Array.isArray(updatedPlayers)) {
            setPlayers(updatedPlayers);
          }
        });

        socketService.on('onPlayerJoined', ({ players }) => {
          console.log('Players list updated:', players);
          setPlayers(players);
        });

        socketService.on('onPlayerLeft', (playerId) => {
          console.log('Player left:', playerId);
          setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        });

        socketService.on(
          'onPlayerAnswered',
          ({
            playerId,
            nickname,
            score,
            answerIndex,
            totalAnswered,
            correctCount,
            pointsAwarded,
          }) => {
            console.log('Player answered:', {
              playerId,
              nickname,
              score,
              answerIndex,
              pointsAwarded,
            });

            setPlayers((prev) => {
              const playerIndex = prev.findIndex(
                (p) =>
                  p.id === playerId ||
                  p.socketId === playerId ||
                  (p.nickname === nickname && nickname)
              );

              if (playerIndex !== -1) {
                const updatedPlayers = [...prev];
                updatedPlayers[playerIndex] = {
                  ...updatedPlayers[playerIndex],
                  score: score,
                  lastAnswer: answerIndex,
                  lastPoints: pointsAwarded || 0,
                  isAnswered: true,
                };
                return updatedPlayers;
              } else {
                return [
                  ...prev,
                  {
                    id: playerId,
                    socketId: playerId,
                    nickname: nickname || 'Anonymous',
                    score: score,
                    lastAnswer: answerIndex,
                    lastPoints: pointsAwarded || 0,
                    isAnswered: true,
                  },
                ];
              }
            });

            if (totalAnswered === players.length && players.length > 0) {
              setAllPlayersAnswered(true);
              console.log('All players answered notification received');
            }

            setTimeout(() => {
              setShowCorrectAnswer(true);
            }, 2000);
          }
        );

        socketService.on('onQuestion', (questionData) => {
          setCurrentQuestion(questionData);
          setShowResults(false);
          setShowCorrectAnswer(false);
          setAllPlayersAnswered(false);
          setPlayers((prev) =>
            prev.map((player) => ({
              ...player,
              lastAnswer: null,
              lastPoints: 0,
            }))
          );
        });

        socketService.on('onShowAnswerHistory', (historyData) => {
          console.log('Received answer history from server:', historyData);
          if (Array.isArray(historyData) && historyData.length > 0) {
            setAnswerHistory(historyData);
            setShowAnswerHistoryModal(true);
          } else {
            console.warn('Received empty or invalid answer history data', historyData);
            setShowAnswerHistoryModal(true);
          }
        });

        socketService.on('onGameError', (error) => {
          console.error('Socket error:', error);
          setError(error.message || t('hostGame.error.generic'));
        });

        socketService.hostJoin(gameData.pin, gameData._id, hostId);

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(err.message || t('hostGame.error.generic'));
        setLoading(false);
      }
    };

    initGame();

    return () => {
      socketService.disconnect();
    };
  }, [gameId, t]);

  useEffect(() => {
    if (gameState === 'playing' && currentQuestion && players.length > 0) {
      const playersAnswered = players.filter(
        (p) =>
          typeof p.lastAnswer === 'number' ||
          p.answerIndex !== undefined ||
          p.answer !== undefined
      ).length;

      if (playersAnswered === players.length) {
        setAllPlayersAnswered(true);
        console.log('All players have answered:', players);
      }
    }
  }, [players, currentQuestion, gameState]);

  const handleMaxPlayersChange = (e) => {
    const newMaxPlayers = parseInt(e.target.value, 10);
    setMaxPlayers(newMaxPlayers);

    if (game && game.pin) {
      socketService.updateMaxPlayers(game.pin, newMaxPlayers);
    }
  };

  const handleStartGame = () => {
    if (!game || !game.quiz || game.quiz.questions.length === 0) return;

    setGameState('playing');
    setQuestionIndex(0);
    sendQuestion(0);

    socketService.startGame(game.pin, game._id);
  };

  const sendQuestion = (index) => {
    if (
      !game ||
      !game.quiz ||
      !game.quiz.questions ||
      index >= game.quiz.questions.length
    ) {
      console.warn('Invalid question index or missing quiz data');
      return;
    }

    console.log('sendQuestion called with index:', index);
    const question = game.quiz.questions[index];
    if (!question) return;

    setCurrentQuestion({
      index,
      number: index + 1,
      text: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      totalQuestions: game.quiz.questions.length,
    });

    setShowResults(false);

    socketService.sendQuestion(game.pin, {
      questionNumber: index + 1,
      totalQuestions: game.quiz.questions.length,
      text: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
    });
  };

  const handleNextQuestion = () => {
    if (allPlayersAnswered && !showAnswerHistoryModal) {
      setShowAnswerHistoryModal(true);
      return;
    }

    setShowAnswerHistoryModal(false);
    setShowCorrectAnswer(false);
    setAllPlayersAnswered(false);

    const nextIndex = questionIndex + 1;

    if (nextIndex >= game.quiz.questions.length) {
      handleEndGame();
      return;
    }

    setQuestionIndex(nextIndex);
    sendQuestion(nextIndex);

    socketService.nextQuestion(game.pin, game._id);
  };

  const handleEndGame = () => {
    if (game) {
      const finalResults = [...players].sort((a, b) => b.score - a.score);

      socketService.endGame(game.pin, finalResults, game._id);

      setGameState('finished');
      setShowResults(true);
    }
  };

  const handleKickPlayer = (playerId) => {
    if (game) {
      socketService.kickPlayer(game.pin, playerId);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const isLastQuestion = questionIndex === game.quiz.questions.length - 1;

    const totalPlayersAnswered = players.filter(
      (p) => typeof p.lastAnswer === 'number'
    ).length;
    const showAnswerCounts =
      totalPlayersAnswered === players.length && players.length > 0;

    return (
      <div className="current-question">
        <h2>{t('hostGame.questionTitle').replace('{current}', questionIndex + 1).replace('{total}', game.quiz.questions.length)}</h2>
        <h3>{currentQuestion.text}</h3>

        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => {
            const playersForThisOption = players.filter(
              (p) => typeof p.lastAnswer === 'number' && p.lastAnswer === index
            );

            const answerCount = playersForThisOption.length;
            const playerText = answerCount === 1 ? 'player' : 'players';

            return (
              <div
                key={index}
                className={`answer-box answer-${index} ${
                  showCorrectAnswer && index === currentQuestion.correctAnswer
                    ? 'correct'
                    : ''
                }`}
              >
                <div className="answer-content">
                  <span className="answer-text">{option}</span>
                  {showAnswerCounts && (
                    <span className="answer-count">
                      {answerCount} {playerText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className={`question-control-btn ${
            isLastQuestion ? 'finish-btn' : ''
          } ${allPlayersAnswered ? 'all-answered' : ''}`}
          onClick={handleNextQuestion}
        >
          {isLastQuestion ? t('hostGame.finishQuizButton') : t('hostGame.nextQuestionButton')}
          {allPlayersAnswered && (
            <span className="indicator">{t('hostGame.allAnsweredIndicator')}</span>
          )}
        </button>
      </div>
    );
  };

  const renderFinalResults = () => {
    const uniquePlayers = [];
    const playerMap = new Map();

    console.log('Current players state for final results:', players);

    players.forEach((player) => {
      if (!player.nickname) return;

      if (!playerMap.has(player.nickname)) {
        playerMap.set(player.nickname, player);
        uniquePlayers.push(player);
      } else {
        const existingPlayer = playerMap.get(player.nickname);
        if ((player.score || 0) > (existingPlayer.score || 0)) {
          playerMap.set(player.nickname, player);
          const index = uniquePlayers.findIndex(
            (p) => p.nickname === player.nickname
          );
          if (index !== -1) {
            uniquePlayers[index] = player;
          }
        }
      }
    });

    const sortedPlayers = uniquePlayers.sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    console.log('Sorted unique players for final results:', sortedPlayers);

    return (
      <div className="final-results">
        <h1>{t('hostGame.finalResultsTitle')}</h1>
        <p className="results-info">{t('hostGame.resultsInfo')}</p>

        <div className="top-three">
          {sortedPlayers.slice(0, 3).map((player, index) => (
            <div
              key={player.id || player.socketId || index}
              className={`player-card ${['silver', 'gold', 'bronze'][index]}`}
            >
              <div className="player-avatar"></div>
              <div className="player-name">{player.nickname}</div>
              <div className="player-score">{player.score || 0} pts</div>
            </div>
          ))}
        </div>

        <div className="ranking-list">
          <ul>
            {sortedPlayers.slice(3).map((player, index) => (
              <li key={player.id || player.socketId || index}>
                <span className="rank-number">{index + 4}</span>
                <span className="rank-name">{player.nickname}</span>
                <span className="rank-score">{player.score || 0} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <button className="play-again" onClick={() => navigate('/dashboard')}>
          {t('hostGame.backToDashboardButton')}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="host-game loading">
        <div className="loading-spinner"></div>
        <p>{t('hostGame.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="host-game error">
        <h2>{t('hostGame.error.generic')}</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>
          {t('hostGame.backToDashboardButton')}
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="host-game error">
        <h2>{t('hostGame.error.gameNotFound')}</h2>
        <button onClick={() => navigate('/dashboard')}>
          {t('hostGame.backToDashboardButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="host-game">
      <div className="game-header">
        <h1>{t('hostGame.gamePin').replace('{pin}', game?.pin)}</h1>
        <p>{t('hostGame.quizTitle').replace('{title}', game?.quiz?.title)}</p>
      </div>

      <div className="game-content">
        <div className="players-panel">
          <h2>{t('hostGame.playersSectionTitle').replace('{current}', players.length).replace('{max}', maxPlayers)}</h2>
          <div className="players-list">
            {(() => {
              const uniquePlayers = [];
              const playerNicknames = new Set();

              players.forEach((player) => {
                if (!playerNicknames.has(player.nickname)) {
                  playerNicknames.add(player.nickname);
                  uniquePlayers.push(player);
                } else {
                  const existingPlayer = uniquePlayers.find(
                    (p) => p.nickname === player.nickname
                  );
                  if (existingPlayer && player.score > existingPlayer.score) {
                    existingPlayer.score = player.score;
                    existingPlayer.lastAnswer = player.lastAnswer;
                    existingPlayer.lastPoints = player.lastPoints;
                  }
                }
              });

              return uniquePlayers.map((player) => (
                <div key={player.id || player.socketId} className="player-item">
                  <div className="player-info">
                    <span className="player-nickname">{player.nickname}</span>
                    <span className="player-score">
                      {t('hostGame.playerScore').replace('{score}', player.score?.toLocaleString() || 0)}
                    </span>
                  </div>
                  {gameState === 'waiting' && (
                    <button
                      className="kick-button"
                      onClick={() =>
                        handleKickPlayer(player.id || player.socketId)
                      }
                      aria-label={`Kick ${player.nickname}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ));
            })()}
          </div>
          {players.length === 0 && (
            <p className="no-players">{t('hostGame.noPlayers')}</p>
          )}
        </div>

        <div className="game-main">
          {gameState === 'waiting' && (
            <div className="waiting-screen">
              <h2>{t('hostGame.waitingScreenTitle')}</h2>

              <div className="game-controls">
                <div className="max-players-control">
                  <label htmlFor="maxPlayers">{t('hostGame.maxPlayersLabel')}</label>
                  <select
                    id="maxPlayers"
                    value={maxPlayers}
                    onChange={handleMaxPlayersChange}
                    className="max-players-select"
                  >
                    {[5, 10, 15, 20, 25, 30].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="start-button"
                  onClick={handleStartGame}
                  disabled={players.length === 0}
                >
                  {t('hostGame.startButton')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'playing' && renderQuestion()}

          {gameState === 'finished' && renderFinalResults()}
        </div>
      </div>

      <AnswerHistoryModal
        isOpen={showAnswerHistoryModal}
        onClose={handleNextQuestion}
        players={players}
        currentQuestion={currentQuestion}
      />
    </div>
  );
};

export default HostGame;