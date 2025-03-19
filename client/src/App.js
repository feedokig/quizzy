import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { QuizProvider } from './contexts/QuizContext';
import { GameProvider } from './contexts/GameContext';
import Routes from './Routes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <QuizProvider>
            <GameProvider>
              <Routes />
            </GameProvider>
          </QuizProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;