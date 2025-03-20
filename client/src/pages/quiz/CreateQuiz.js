// client/src/pages/quiz/CreateQuiz.js
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../../services/quizService';
import QuestionForm from '../../components/quiz/QuestionForm';
import Alert from '../../components/ui/Alert';
import './QuizForm.css';

const quizSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .required('Title is required'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
  timeLimit: Yup.number()
    .min(5, 'Time limit must be at least 5 seconds')
    .max(300, 'Time limit must be less than 300 seconds')
    .required('Time limit is required'),
  isPublic: Yup.boolean()
});

const CreateQuiz = () => {
  const [questions, setQuestions] = useState([
    {
      text: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1000
    }
  ]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSaveQuestion = (questionData, index) => {
    const newQuestions = [...questions];
    newQuestions[index] = questionData;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', ''],
        correctAnswer: 0,
        points: 1000
      }
    ]);
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (questions.some(q => !q.text.trim())) {
        setError('All questions must have text');
        setSubmitting(false);
        return;
      }

      const quizData = {
        ...values,
        questions
      };

      const response = await createQuiz(quizData);
      navigate(`/quiz/${response._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz');
      setSubmitting(false);
    }
  };

  return (
    <div className="quiz-form-container">
      <h1>Create a New Quiz</h1>
      
      {error && (
        <Alert 
          type="danger" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      <div className="quiz-form card">
        <Formik
          initialValues={{
            title: '',
            description: '',
            timeLimit: 30,
            isPublic: true
          }}
          validationSchema={quizSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="title">Quiz Title</label>
                <Field 
                  type="text" 
                  name="title" 
                  id="title" 
                  placeholder="Enter quiz title" 
                />
                <ErrorMessage name="title" component="div" className="error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <Field 
                  as="textarea" 
                  name="description" 
                  id="description" 
                  placeholder="Enter quiz description" 
                  rows="3"
                />
                <ErrorMessage name="description" component="div" className="error" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timeLimit">Time Limit (seconds per question)</label>
                  <Field 
                    type="number" 
                    name="timeLimit" 
                    id="timeLimit" 
                    min="5" 
                    max="300" 
                  />
                  <ErrorMessage name="timeLimit" component="div" className="error" />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <Field type="checkbox" name="isPublic" />
                    Make quiz public
                  </label>
                  <ErrorMessage name="isPublic" component="div" className="error" />
                </div>
              </div>
              
              <hr className="divider" />
              
              <h2>Questions</h2>
              
              {questions.map((question, index) => (
                <QuestionForm
                  key={index}
                  question={question}
                  index={index}
                  onSave={handleSaveQuestion}
                  onDelete={questions.length > 1 ? handleDeleteQuestion : null}
                />
              ))}
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddQuestion}
                >
                  Add Question
                </button>
                
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateQuiz;