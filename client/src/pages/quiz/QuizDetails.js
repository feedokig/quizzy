import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './CreateQuiz.css';

const QuizDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError(t('quizDetails.error.unauthorized'));
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz/${id}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        setQuiz(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.message || t('quizDetails.error.fetchFailed'));
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id, t]);

  const Alert = ({ type, message }) => (
    <div className={`alert alert-${type}`}>
      {message}
    </div>
  );

  if (loading) {
    return (
      <div className="create-quiz-container">
        <div className="create-quiz-form">
          <h1>{t('quizDetails.loading')}</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-quiz-container">
        <div className="create-quiz-form">
          <Alert type="error" message={error} />
          <button 
            className="create-quiz-btn" 
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: '20px' }}
          >
            {t('quizDetails.backToDashboardButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-quiz-container">
      <div className="create-quiz-form">
        <h1>{quiz.title}</h1>
        
        {quiz.wheelEnabled && (
          <div className="wheel-toggle" style={{ justifyContent: 'center', marginBottom: '20px' }}>
            🎡 {t('quizDetails.wheelEnabled')}
          </div>
        )}
        
        <div className="questions-preview">
          <h2>{t('quizDetails.questionsSectionTitle', { count: quiz.questions.length })}</h2>
          
          {quiz.questions.length === 0 ? (
            <div className="empty-questions">
              <p>{t('quizDetails.noQuestions')}</p>
            </div>
          ) : (
            <div className="questions-list">
              {quiz.questions.map((q, idx) => (
                <div key={idx} className="question-card">
                  <div className="question-content">
                    <span className="question-number">{t('createQuiz.questionNumber', { number: idx + 1 })}</span>
                    <p className="question-text">{q.question}</p>
                    
                    <div className="options-preview">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className={`option-item ${optIdx === q.correctAnswer ? 'correct' : ''}`}>
                          {opt} {optIdx === q.correctAnswer && <span className="correct-badge">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            className="add-question-btn" 
            onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
            style={{ flex: 1 }}
          >
            {t('quizDetails.editQuizButton')}
          </button>
          
          <button 
            className="create-quiz-btn" 
            onClick={() => navigate('/dashboard')}
            style={{ flex: 1 }}
          >
            {t('quizDetails.backToDashboardButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizDetails;