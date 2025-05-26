import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './CreateQuiz.css';

const CreateQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [quizData, setQuizData] = useState({
    title: '',
    questions: [],
    wheelEnabled: true,
  });

  const [editIndex, setEditIndex] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: null,
  });

  const addQuestion = (e) => {
    e.preventDefault();
    if (
      !currentQuestion.question ||
      currentQuestion.correctAnswer === null ||
      currentQuestion.options.some((opt) => !opt)
    ) {
      setAlert({
        show: true,
        message: t('createQuiz.error.fillAllFields'),
        type: 'error',
      });
      return;
    }

    if (editIndex !== null) {
      const updatedQuestions = [...quizData.questions];
      updatedQuestions[editIndex] = { ...currentQuestion };

      setQuizData((prev) => ({
        ...prev,
        questions: updatedQuestions,
      }));
      setEditIndex(null);
    } else {
      setQuizData((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion }],
      }));
    }

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizData.title || quizData.questions.length === 0) {
      setAlert({
        show: true,
        message: t('createQuiz.error.titleAndQuestionsRequired'),
        type: 'error',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({
          show: true,
          message: t('createQuiz.error.unauthorized'),
          type: 'error',
        });
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quiz`,
        quizData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        }
      );

      if (response.data) {
        setAlert({
          show: true,
          message: t('createQuiz.success.created'),
          type: 'success',
        });

        setQuizData({
          title: '',
          questions: [],
          wheelEnabled: true,
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setAlert({
        show: true,
        message:
          error.response?.data?.message || t('createQuiz.error.createFailed'),
        type: 'error',
      });
    }
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion({ ...quizData.questions[index] });
    setEditIndex(index);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const Alert = ({ type, message }) => (
    <div className={`alert alert-${type}`}>{message}</div>
  );

  return (
    <div className="create-quiz-container">
      <div className="create-quiz-form">
        <h1>{t('createQuiz.title')}</h1>

        {alert.show && <Alert type={alert.type} message={alert.message} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="quiz-title-input"
              placeholder={t('createQuiz.quizTitlePlaceholder')}
              value={quizData.title}
              onChange={(e) =>
                setQuizData({ ...quizData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="question-form">
            <h2>
              {editIndex !== null ? t('createQuiz.editQuestionTitle') : t('createQuiz.addQuestionTitle')}
            </h2>

            <div className="form-group">
              <textarea
                className="question-input"
                placeholder={t('createQuiz.questionPlaceholder')}
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    question: e.target.value,
                  })
                }
              />
            </div>

            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    placeholder={t('createQuiz.optionPlaceholder').replace('{index}', index + 1)}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({
                        ...currentQuestion,
                        options: newOptions,
                      });
                    }}
                  />
                  <label className="correct-answer-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={index}
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: index,
                        })
                      }
                    />
                    <span>{t('createQuiz.correctLabel')}</span>
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-question-btn"
              onClick={addQuestion}
            >
              {editIndex !== null ? t('createQuiz.saveChangesButton') : t('createQuiz.addQuestionButton')}
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
                    correctAnswer: null,
                  });
                }}
              >
                {t('createQuiz.cancelButton')}
              </button>
            )}
          </div>

          <div className="questions-preview">
            <h2>{t('createQuiz.questionsSectionTitle').replace('{count}', quizData.questions.length)}</h2>

            {quizData.questions.length === 0 ? (
              <div className="empty-questions">
                <p>{t('createQuiz.noQuestions')}</p>
              </div>
            ) : (
              <div className="questions-list">
                {quizData.questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-content">
                      <span className="question-number">
                        {t('editQuiz.questionNumber').replace('{number}', idx + 1)}
                      </span>
                      <p className="question-text">{q.question}</p>

                      <div className="options-preview">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`option-item ${optIdx === q.correctAnswer ? 'correct' : ''}`}
                          >
                            {opt}
                            {optIdx === q.correctAnswer && <span className="correct-badge">✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEditQuestion(idx)}
                      >
                        ✏️ {t('editQuiz.editButton')}
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteQuestion(idx)}
                      >
                        ❌ {t('editQuiz.deleteButton')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="create-quiz-btn">
            {t('createQuiz.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;