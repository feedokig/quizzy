import React from 'react';
import { useTranslation } from 'react-i18next';
import './AnswerHistoryModal.css';

const AnswerHistoryModal = ({ isOpen, onClose, players, currentQuestion }) => {
  const { t } = useTranslation();

  if (!isOpen || !currentQuestion) return null;

  // Filter players who have answered this question - ensure we catch all answer formats
  const playersWithAnswers = players.filter(
    (player) => {
      // Check all possible ways an answer might be stored
      return (
        typeof player.lastAnswer === 'number' || 
        player.answerIndex !== undefined ||
        (player.answer !== undefined)
      );
    }
  );
  
  console.log('Modal received players:', players);
  console.log('Filtered players with answers:', playersWithAnswers);

  return (
    <div className="answer-history-modal-overlay">
      <div className="answer-history-modal">
        <div className="modal-header">
          <h2>{t('answerHistoryModal.title').replace('{number}', currentQuestion.number)}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="question-info">
            <p className="question-text">{currentQuestion.text}</p>
          </div>

          <div className="answer-table-container">
            {playersWithAnswers.length > 0 ? (
              <table className="answer-table">
                <thead>
                  <tr>
                    <th>{t('answerHistoryModal.playerColumn')}</th>
                    <th>{t('answerHistoryModal.answerColumn')}</th>
                    <th>{t('answerHistoryModal.statusColumn')}</th>
                    <th>{t('answerHistoryModal.pointsColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {playersWithAnswers
                    .sort((a, b) => {
                      // Sort by points (highest first)
                      const pointsA = a.lastPoints || a.pointsAwarded || 0;
                      const pointsB = b.lastPoints || b.pointsAwarded || 0;
                      return pointsB - pointsA;
                    })
                    .map((player) => {
                      // Handle both direct answer history format and player object format
                      const answerIndex = player.answerIndex !== undefined ? 
                        player.answerIndex : (player.answer !== undefined ? player.answer : player.lastAnswer);
                      
                      const isCorrect = player.isCorrect !== undefined ? 
                        player.isCorrect : (answerIndex === currentQuestion.correctAnswer);
                      
                      const answerText = player.answerText || 
                        (currentQuestion.options && answerIndex !== undefined ? 
                          currentQuestion.options[answerIndex] : 'No answer');
                      
                      const points = player.pointsAwarded || player.lastPoints || 0;
                      
                      return (
                        <tr
                          key={player.id || player.socketId || player.playerId}
                          className={isCorrect ? 'correct-answer' : 'wrong-answer'}
                        >
                          <td>{player.nickname}</td>
                          <td>{answerText}</td>
                          <td className={`status ${isCorrect ? 'correct' : 'wrong'}`}>
                            {isCorrect ? t('answerHistoryModal.correctStatus') : t('answerHistoryModal.wrongStatus')}
                          </td>
                          <td>{points} pts</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div className="no-answers">{t('answerHistoryModal.noAnswers')}</div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="continue-button" onClick={onClose}>
            {t('answerHistoryModal.continueButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnswerHistoryModal;