// components/MaxPlayersModal.js
import React, { useState } from "react";
import "./MaxPlayersModal.css";

const MaxPlayersModal = ({ onSubmit, onCancel }) => {
  const [maxPlayers, setMaxPlayers] = useState(10);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(maxPlayers);
  };

  return (
    <div className="modal-overlay">
      <div className="max-players-modal">
        <h2>Game Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="maxPlayers">Maximum Number of Players:</label>
            <input
              type="number"
              id="maxPlayers"
              min="1"
              max="50"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="button-group">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaxPlayersModal;