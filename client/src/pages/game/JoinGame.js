// pages/game/JoinGame

import React, { useState } from 'react';
import axios from 'axios';

const JoinGame = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleJoinGame = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/game/join', { pin });
      console.log('Game joined:', response.data);
      // Redirect or show game details
    } catch (err) {
      setError('Failed to join the game. Please check the PIN and try again.');
    }
  };

  return (
    <div>
      <h1>Join a Game</h1>
      <input
        type="text"
        placeholder="Enter Game PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      <button onClick={handleJoinGame}>Join</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default JoinGame;
