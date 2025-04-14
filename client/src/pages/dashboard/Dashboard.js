// client/src/pages/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserQuizzes, deleteQuiz } from '../../services/quizService';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../services/gameService';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import './Dashboard.css';

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getUserQuizzes();
        setQuizzes(data);
      } catch (err) {
        setError('Failed to fetch quizzes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await deleteQuiz(id);
        setQuizzes(quizzes.filter((quiz) => quiz._id !== id));
        setAlert({ type: 'success', message: 'Quiz deleted successfully' });
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to delete quiz' });
      }
    }
  };

  const handleHostGame = async (quizId) => {
    try {
      const game = await createGame(quizId);
      if (game && game.pin) {
        navigate(`/host/${game._id}`);
      }
    } catch (error) {
      console.error('Failed to host game:', error);
      // Show error to user (using your preferred method - alert, toast, etc)
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Quizzes</h1>
        <Link to="/create-quiz" className="btn-primary">
          Create New Quiz
        </Link>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {error && <Alert type="danger" message={error} />}

      {quizzes.length === 0 ? (
        <div className="empty-state card">
          <h3>No quizzes yet</h3>
          <p>Create your first quiz to get started!</p>
          <Link to="/create-quiz" className="btn-primary">
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <div className="quiz-card card" key={quiz._id}>
              <div className="quiz-info">
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <div className="quiz-meta">
                  <span>{quiz.questions.length} questions</span>
                  <span>Time limit: {quiz.timeLimit} seconds</span>
                  <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="quiz-actions">
                <button
                  className="btn-primary"
                  onClick={() => handleHostGame(quiz._id)}
                >
                  Host Game
                </button>
                <Link to={`/quiz/${quiz._id}`} className="btn-secondary">
                  View
                </Link>
                <Link to={`/edit-quiz/${quiz._id}`} className="btn-warning">
                  Edit
                </Link>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteQuiz(quiz._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;