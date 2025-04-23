// client/src/pages/quiz/EditQuiz.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CreateQuiz.css'; // Reusing the same CSS

const EditQuiz = () => {
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

  // Fetch quiz data on component mount
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAlert({
            show: true,
            message: 'You must be logged in to edit a quiz',
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
          message: error.response?.data?.message || 'Error fetching quiz data',
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id, navigate]);

  // Function to add or update a question
  const addQuestion = (e) => {
    e.preventDefault();
    if (!currentQuestion.question || currentQuestion.correctAnswer === null || 
        currentQuestion.options.some(opt => !opt)) {
      setAlert({
        show: true,
        message: 'Please fill all fields and select the correct answer',
        type: 'error'
      });
      return;
    }

    // If we're editing an existing question
    if (editIndex !== null) {
      const updatedQuestions = [...quizData.questions];
      updatedQuestions[editIndex] = {...currentQuestion};
      
      setQuizData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
      setEditIndex(null);
    } else {
      // Adding a new question
      setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, {...currentQuestion}]
      }));
    }

    // Reset current question form
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: null
    });
  };

  // Function to handle form submission
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
          message: 'You must be logged in to edit a quiz',
          type: 'error'
        });
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/quiz/${id}`,
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
          message: 'Quiz updated successfully!',
          type: 'success'
        });
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Error updating quiz. Please try again.',
        type: 'error'
      });
    }
  };

  // Function to edit a question
  const handleEditQuestion = (index) => {
    setCurrentQuestion({...quizData.questions[index]});
    setEditIndex(index);
  };

  // Function to delete a question
  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  // Alert component
  const Alert = ({ type, message }) => (
    <div className={`alert alert-${type}`}>
      {message}
    </div>
  );

  if (loading) {
    return (
      <div className="create-quiz-container">
        <div className="create-quiz-form">
          <h1>Loading Quiz Data...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="create-quiz-container">
      <div className="create-quiz-form">
        <h1>Edit Quiz</h1>
        
        {alert.show && <Alert type={alert.type} message={alert.message} />}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="quiz-title-input"
              placeholder="Quiz Title"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="question-form">
            <h2>{editIndex !== null ? 'Edit Question' : 'Add New Question'}</h2>
            
            <div className="form-group">
              <textarea
                className="question-input"
                placeholder="Question text"
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
                      value={index}
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: index
                      })}
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="add-question-btn" 
              onClick={addQuestion}
            >
              {editIndex !== null ? 'Save Changes' : 'Add Question'}
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
                Cancel
              </button>
            )}
          </div>

          <div className="questions-preview">
            <h2>Questions ({quizData.questions.length})</h2>
            
            {quizData.questions.length === 0 ? (
              <div className="empty-questions">
                <p>No questions added yet. Create your first question!</p>
              </div>
            ) : (
              <div className="questions-list">
                {quizData.questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-content">
                      <span className="question-number">Question {idx + 1}</span>
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
                        ✏️ Edit
                      </button>
                      <button type="button" className="delete-btn" onClick={() => handleDeleteQuestion(idx)}>
                        ❌ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="create-quiz-btn">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditQuiz;