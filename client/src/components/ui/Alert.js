// client/src/components/ui/Alert.js
import React from 'react';
import './Alert.css';

const Alert = ({ type, message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <p>{message}</p>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;