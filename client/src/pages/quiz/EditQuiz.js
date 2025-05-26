import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './CreateQuiz.css';

const EditQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [quizData, setQuizData] = useState({
    title: '',
    questions: [],
    wheelEnabled: true
  });

  const [editIndex, setEditIndex] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: null
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAlert({
            show: true,
            message: t('editQuiz.error.unauthorized'),
            type: 'error'
          });
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/quiz/${id}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        setQuizData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setAlert({
          show: true,
          message: error.response?.data?.message || t('editQuiz.error.fetchFailed'),
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id, navigate, t]);

  const addQuestion = (e) => {
    e.preventDefault();
    if (!currentQuestion.question || currentQuestion.correctAnswer === null || 
        currentQuestion.options.some(opt => !opt)) {
      setAlert({
        show: true,
        message: t('editQuiz.error.fillAllFields'),
        type: 'error'
      });
      return;
    }

    if (editIndex !== null) {
      const updatedQuestions = [...quizData.questions];
      updatedQuestions[editIndex] = {...currentQuestion};
      
      setQuizData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
      setEditIndex(null);
    } else {
      setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, {...currentQuestion}]
      }));
    }

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quizData.title || quizData.questions.length === 0) {
      setAlert({
        show: true,
        message: t('editQuiz.error.titleAndQuestionsRequired'),
        type: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({
          show: true,
          message: t('editQuiz.error.unauthorized'),
          type: 'error'
        });
        return;
      }

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/quiz/${id}`,
        quizData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (response.data) {
        setAlert({
          show: true,
          message: t('editQuiz.success.updated'),
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || t('editQuiz.error.updateFailed'),
        type: 'error'
      });
    }
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion({...quizData.questions[index]});
    setEditIndex(index);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

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

  return (
    <div className="create-quiz-container">
      <div className="create-quiz-form">
        <h1>{t('editQuiz.title')}</h1>
        
        {alert.show && <Alert type={alert.type} message={alert.message} />}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="quiz-title-input"
              placeholder={t('editQuiz.quizTitlePlaceholder')}
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="question-form">
            <h2>{editIndex !== null ? t('editQuiz.editQuestionTitle') : t('editQuiz.addQuestionTitle')}</h2>
            
            <div className="form-group">
              <textarea
                className="question-input"
                placeholder={t('editQuiz.questionPlaceholder')}
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question: e.target.value 
                })}
              />
            </div>
            
            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    placeholder={t('editQuiz.optionPlaceholder').replace('{index}', index + 1)}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, options: newOptions });
                    }}
                  />
                  <label className="correct-answer-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={index}
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: index
                      })}
                    />
                    <span>{t('editQuiz.correctLabel')}</span>
                  </label>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="add-question-btn" 
              onClick={addQuestion}
            >
              {editIndex !== null ? t('editQuiz.saveChangesButton') : t('editQuiz.addQuestionButton')}
            </button>

            {editIndex !== null && (
              <button 
                type="button" 
                className="cancel-edit-btn" 
                onClick={() => {
                  setEditIndex(null);
                  setCurrentQuestion({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: null
                  });
                }}
              >
                {t('editQuiz.cancelButton')}
              </button>
            )}
          </div>

          <div className="questions-preview">
            <h2>{t('editQuiz.questionsSectionTitle').replace('{count}', quizData.questions.length)}</h2>
            
            {quizData.questions.length === 0 ? (
              <div className="empty-questions">
                <p>{t('editQuiz.noQuestions')}</p>
              </div>
            ) : (
              <div className="questions-list">
                {quizData.questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-content">
                      <span className="question-number">{t('editQuiz.questionNumber').replace('{number}', idx + 1)}</span>
                      <p className="question-text">{q.question}</p>
                      
                      <div className="options-preview">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className={`option-item ${optIdx === q.correctAnswer ? 'correct' : ''}`}>
                            {opt} {optIdx === q.correctAnswer && <span className="correct-badge">✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="question-actions">
                      <button type="button" className="edit-btn" onClick={() => handleEditQuestion(idx)}>
                        ✏️ {t('editQuiz.editButton')}
                      </button>
                      <button type="button" className="delete-btn" onClick={() => handleDeleteQuestion(idx)}>
                        ❌ {t('editQuiz.deleteButton')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="create-quiz-btn">
            {t('editQuiz.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditQuiz;