// client/src/pages/quiz/EditQuiz.js
import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuizById, updateQuiz } from '../../services/quizService';
import QuestionForm from '../../components/quiz/QuestionForm';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
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

const EditQuiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getQuizById(id);
        setQuiz(data);
        setQuestions(data.questions);
      } catch (err) {
        setError('Failed to fetch quiz');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

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

      await updateQuiz(id, quizData);
      navigate(`/quiz/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz');
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error && !quiz) return <Alert type="danger" message={error} />;

  return (
    <div className="quiz-form-container">
      <h1>Edit Quiz</h1>
      
      {error && (
        <Alert 
          type="danger" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      <div className="quiz-form card">
        {quiz && (
          <Formik
            initialValues={{
              title: quiz.title,
              description: quiz.description || '',
              timeLimit: quiz.timeLimit,
              isPublic: quiz.isPublic
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
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default EditQuiz;