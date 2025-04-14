// client/src/pages/quiz/CreateQuiz.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert';
import './CreateQuiz.css';
import './QuizForm.css';
import axios from 'axios';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [quizData, setQuizData] = useState({
    title: '',
    questions: [],
    boosts: {
      fifty_fifty: true,
      double_points: true,
      time_freeze: true,
      nutrition_bonus: true
    },
    nutritionBonus: {
      enabled: true,
      correctTypes: 0
    },
    wheelEnabled: true
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: null
  });

  const addQuestion = (e) => {
    e.preventDefault();
    if (!currentQuestion.question || !currentQuestion.correctAnswer || 
        currentQuestion.options.some(opt => !opt)) {
      setAlert({
        show: true,
        message: 'Please fill all fields and select correct answer',
        type: 'error'
      });
      return;
    }

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: null
    });
  };

  const handleCorrectAnswerSelect = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswer: index
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quizData.title || quizData.questions.length === 0) {
      setAlert({
        show: true,
        message: 'Please add a title and at least one question',
        type: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({
          show: true,
          message: 'You must be logged in to create a quiz',
          type: 'error'
        });
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/quiz',  // Update this URL to match your backend
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
          message: 'Quiz created successfully!',
          type: 'success'
        });
        
        // Clear form data
        setQuizData({
          title: '',
          questions: [],
          boosts: {
            fifty_fifty: true,
            double_points: true,
            time_freeze: true,
            nutrition_bonus: true
          },
          nutritionBonus: {
            enabled: true,
            correctTypes: 0
          },
          wheelEnabled: true
        });
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Error creating quiz. Please try again.',
        type: 'error'
      });
    }
};

  return (
    <div className="quiz-form-container">
      {alert.show && <Alert type={alert.type} message={alert.message} />}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="quiz-title-input"
          placeholder="Quiz Title"
          value={quizData.title}
          onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
          required
        />
        
        <div className="question-form">
          <input
            type="text"
            className="question-input"
            placeholder="Question"
            value={currentQuestion.question}
            onChange={(e) => setCurrentQuestion({ 
              ...currentQuestion, 
              question: e.target.value 
            })}
          />
          
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="option-row">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
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
                    checked={currentQuestion.correctAnswer === index}
                    onChange={() => handleCorrectAnswerSelect(index)}
                  />
                  Correct Answer
                </label>
              </div>
            ))}
          </div>

          <button type="button" className="add-question-btn" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        <div className="boosts-section">
          <h3>Boosts</h3>
          <div className="boost-options">
            <label>
              <input
                type="checkbox"
                checked={quizData.boosts.fifty_fifty}
                onChange={(e) => setQuizData({
                  ...quizData,
                  boosts: { ...quizData.boosts, fifty_fifty: e.target.checked }
                })}
              />
              🛡️ 50/50
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.boosts.double_points}
                onChange={(e) => setQuizData({
                  ...quizData,
                  boosts: { ...quizData.boosts, double_points: e.target.checked }
                })}
              />
              🔥 X2 Points
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.boosts.time_freeze}
                onChange={(e) => setQuizData({
                  ...quizData,
                  boosts: { ...quizData.boosts, time_freeze: e.target.checked }
                })}
              />
              ❄️ Time Freeze
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.nutritionBonus.enabled}
                onChange={(e) => setQuizData({
                  ...quizData,
                  nutritionBonus: { ...quizData.nutritionBonus, enabled: e.target.checked }
                })}
              />
              🐐 Nutrition Bonus
            </label>
          </div>
        </div>

        <div className="wheel-section">
          <label>
            <input
              type="checkbox"
              checked={quizData.wheelEnabled}
              onChange={(e) => setQuizData({
                ...quizData,
                wheelEnabled: e.target.checked
              })}
            />
            Enable Wheel of Fortune
          </label>
        </div>

        <div className="questions-preview">
          <h3>Added Questions ({quizData.questions.length})</h3>
          {quizData.questions.map((q, idx) => (
            <div key={idx} className="question-preview">
              <p><strong>Q{idx + 1}:</strong> {q.question}</p>
            </div>
          ))}
        </div>

        <button type="submit" className="create-quiz-btn">
          Create Quiz
        </button>
      </form>
    </div>
  );
};

export default CreateQuiz;