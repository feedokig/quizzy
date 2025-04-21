// client/src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Quiz pages
import Dashboard from './pages/dashboard/Dashboard';
import CreateQuiz from './pages/quiz/CreateQuiz';
import EditQuiz from './pages/quiz/EditQuiz';
import QuizDetails from './pages/quiz/QuizDetails';

// Game pages
import JoinGame from './pages/game/JoinGame';
import PlayerGame from './pages/game/PlayerGame';
import HostGame from './pages/game/HostGame';
import GameResults from './pages/game/GameResults';
import PostQuizWheel from './pages/game/PostQuizWheel';

// Profile pages
import EditProfile from './pages/profile/EditProfile';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-quiz" element={
            <ProtectedRoute>
              <CreateQuiz />
            </ProtectedRoute>
          } />
          <Route path="/edit-quiz/:id" element={
            <ProtectedRoute>
              <EditQuiz />
            </ProtectedRoute>
          } />
          <Route path="/quiz/:id" element={
            <ProtectedRoute>
              <QuizDetails />
            </ProtectedRoute>
          } />
          <Route path="/host/:id" element={
            <ProtectedRoute>
              <HostGame />
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } />
          
          {/* Public Game Routes */}
          <Route path="/" element={<JoinGame />} />
          <Route path="/host/:gameId" element={<HostGame />} />
          <Route path="/play/:pin" element={<PlayerGame />} />
          <Route path="/game/join" element={<JoinGame />} />          
          <Route path="/results/:id" element={<GameResults />} />
          <Route path="/game/:pin/wheel" element={<PostQuizWheel />} />

          {/* Default route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;