import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  console.log('Navbar user:', user);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <h1>{t('navbar.home')}</h1>
        </Link>
        
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">{t('navbar.dashboard')}</Link>
              <Link to="/create-quiz" className="nav-link">{t('navbar.createQuiz')}</Link>
              <span className="nav-username">
                {user?.username ? (
                  // Попробуем интерполяцию, но с явной проверкой
                  <Link to="/profile/edit">
                    {t('navbar.profile').replace('{username}', user.username)}
                    </Link>
                ) : (
                  <span>{t('navbar.loading')}</span>
                )}
              </span>
              <button onClick={handleLogout} className="btn-logout">{t('navbar.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">{t('navbar.login')}</Link>
              <Link to="/register" className="nav-link">{t('navbar.register')}</Link>
            </>
          )}
          <div className="language-toggle">
            <button
              className={i18n.language === 'en' ? 'active' : ''}
              onClick={() => changeLanguage('en')}
              title={t('languageToggle.en')}
            >
              EN
            </button>
            <button
              className={i18n.language === 'uk' ? 'active' : ''}
              onClick={() => changeLanguage('uk')}
              title={t('languageToggle.uk')}
            >
              UA
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;