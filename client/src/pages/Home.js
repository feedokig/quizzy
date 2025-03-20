// client/src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1>Welcome to Quizzy</h1>
          <p>Create and play interactive quizzes in real-time!</p>
          {user ? (
            <div className="action-buttons">
              <Link to="/dashboard" className="btn btn-primary">My Dashboard</Link>
              <Link to="/game/join" className="btn btn-secondary">Join a Game</Link>
            </div>
          ) : (
            <div className="action-buttons">
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
              <Link to="/login" className="btn btn-secondary">Log In</Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Create Quizzes</h3>
              <p>Design your own quizzes with multiple choice questions, images, and time limits.</p>
            </div>
            <div className="feature-card">
              <h3>Real-time Gameplay</h3>
              <p>Play with friends in real-time with live leaderboards and instant feedback.</p>
            </div>
            <div className="feature-card">
              <h3>Points System</h3>
              <p>Earn points based on accuracy and speed. Compete for the top spot!</p>
            </div>
            <div className="feature-card">
              <h3>Easy to Join</h3>
              <p>Join games instantly with a simple PIN code. No account required to play!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;