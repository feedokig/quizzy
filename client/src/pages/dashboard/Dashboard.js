import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserQuizzes, deleteQuiz } from '../../services/quizService';
import { useNavigate } from 'react-router-dom';
import gameService from '../../services/gameService';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import LanguageToggle from '../../components/LanguageToggle'; // Импортируем компонент
import { useTranslation } from 'react-i18next'; // Импортируем хук для переводов
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation(); // Хук для доступа к переводам
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
        setError(t('dashboard.error')); // Используем перевод
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [t]);

  const handleDeleteQuiz = async (id) => {
    if (window.confirm(t('dashboard.deleteConfirm'))) {
      try {
        await deleteQuiz(id);
        setQuizzes(quizzes.filter((quiz) => quiz._id !== id));
        setAlert({ type: 'success', message: t('dashboard.deleteSuccess') });
      } catch (err) {
        setAlert({ type: 'danger', message: t('dashboard.deleteFailed') });
      }
    }
  };

  const handleHostGame = async (quizId) => {
  try {
    setAlert(null);
    console.log('Creating game for quiz:', quizId);
    const game = await gameService.createGame(quizId);
    console.log('Game created successfully:', { id: game._id, pin: game.pin });

    if (!game || !game._id || !game.pin) {
      throw new Error(t('dashboard.invalidGameData'));
    }

    navigate(`/host/${game._id}`, { state: { game } });
  } catch (error) {
    console.error('Failed to host game:', error.message);
    setAlert({
      type: 'error',
      message: error.message || t('dashboard.failedToCreateGame'),
    });
  }
};

  if (loading) return <Spinner />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <Link to="/create-quiz" className="btn-primary">
          {t('dashboard.createQuiz')}
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
          <h3>{t('dashboard.noQuizzes')}</h3>
          <p>{t('dashboard.noQuizzesDescription')}</p>
          <Link to="/create-quiz" className="btn-primary">
            {t('dashboard.createQuiz')}
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
                  <span>
                    {quiz.questions.length} {t('dashboard.questions')}
                  </span>
                  <span>
                    {t('dashboard.created')}: {new Date(quiz.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="quiz-actions">
                <button
                  className="btn-primary"
                  onClick={() => handleHostGame(quiz._id)}
                >
                  {t('dashboard.hostGame')}
                </button>
                <Link to={`/quiz/${quiz._id}`} className="btn-secondary">
                  {t('dashboard.view')}
                </Link>
                <Link to={`/edit-quiz/${quiz._id}`} className="btn-warning">
                  {t('dashboard.edit')}
                </Link>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteQuiz(quiz._id)}
                >
                  {t('dashboard.delete')}
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