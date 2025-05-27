// services/socketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      onPlayerJoined: null,
      onPlayerLeft: null,
      onPlayerAnswered: null,
      onUpdatePlayers: null,
      onQuestion: null,
      onGameStarted: null,
      onShowAnswerHistory: null,
      onFiftyFiftyOptions: null,
      onBoostActivated: null,
      onBoostError: null,
      onAnswerResult: null,
      onGameError: null,
      onQuizFinished: null,
      onMaxPlayersUpdated: null,
    };
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'], // Allow polling fallback
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    this.setupListeners();
    return this.socket;
  }

setupListeners() {
    if (!this.socket) return;

    this.socket.on('player-joined', (data) => {
      if (this.callbacks.onPlayerJoined) this.callbacks.onPlayerJoined(data);
    });

    this.socket.on('player-left', (playerId) => {
      if (this.callbacks.onPlayerLeft) this.callbacks.onPlayerLeft(playerId);
    });

    this.socket.on('player-answered', (data) => {
      if (this.callbacks.onPlayerAnswered) this.callbacks.onPlayerAnswered(data);
    });

    this.socket.on('update-players', (players) => {
      if (this.callbacks.onUpdatePlayers) this.callbacks.onUpdatePlayers(players);
    });

    this.socket.on('question', (questionData) => {
      if (this.callbacks.onQuestion) this.callbacks.onQuestion(questionData);
    });

    this.socket.on('game-started', () => {
      if (this.callbacks.onGameStarted) this.callbacks.onGameStarted();
    });

    this.socket.on('show-answer-history', (answerData) => {
      console.log('Received answer history from server:', answerData);
      if (this.callbacks.onShowAnswerHistory) this.callbacks.onShowAnswerHistory(answerData);
    });

    this.socket.on('fifty-fifty-options', (options) => {
      if (this.callbacks.onFiftyFiftyOptions) this.callbacks.onFiftyFiftyOptions(options);
    });

    this.socket.on('boost-activated', (data) => {
      if (this.callbacks.onBoostActivated) this.callbacks.onBoostActivated(data);
    });

    this.socket.on('boost-error', (error) => {
      if (this.callbacks.onBoostError) this.callbacks.onBoostError(error);
    });

    this.socket.on('answer-result', (result) => {
      if (this.callbacks.onAnswerResult) this.callbacks.onAnswerResult(result);
    });

    this.socket.on('game-error', (error) => {
      if (this.callbacks.onGameError) this.callbacks.onGameError(error);
    });

    this.socket.on('join-error', (error) => {
      if (this.callbacks.onGameError) this.callbacks.onGameError(error);
    });

    this.socket.on('quiz:finished', (data) => {
      if (this.callbacks.onQuizFinished) this.callbacks.onQuizFinished(data);
    });

    this.socket.on('max-players-updated', (data) => {
      if (this.callbacks.onMaxPlayersUpdated) this.callbacks.onMaxPlayersUpdated(data);
    });

    this.socket.on('game-joined', () => {
      console.log('Game joined successfully');
      if (this.callbacks.onGameJoined) this.callbacks.onGameJoined();
    });
  }

  // Add callback for game-joined
  on(event, callback) {
    if (event === 'game-joined') {
      this.callbacks.onGameJoined = callback;
    } else if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    } else if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (event === 'game-joined') {
      this.callbacks.onGameJoined = null;
    } else if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = null;
    } else if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    if (!this.socket) this.connect();
    return this.socket;
  }

  // Host methods
  hostJoin(pin, gameId, hostId) {
    if (!this.socket) this.connect();
    this.socket.emit("host-join", { pin, gameId, hostId });
  }

  startGame(pin, gameId) {
    if (!this.socket) this.connect();
    this.socket.emit("start-game", { pin, gameId });
  }

  sendQuestion(pin, questionData) {
    if (!this.socket) this.connect();
    this.socket.emit("new-question", { pin, question: questionData });
  }

  nextQuestion(pin, gameId) {
    if (!this.socket) this.connect();
    this.socket.emit("next-question", { pin, gameId });
  }

  kickPlayer(pin, playerId) {
    if (!this.socket) this.connect();
    this.socket.emit("kick-player", { pin, playerId });
  }

  updateMaxPlayers(pin, maxPlayers) {
    if (!this.socket) this.connect();
    this.socket.emit('update-max-players', { pin, maxPlayers });
    console.log(`Emitting update-max-players with pin ${pin} and maxPlayers ${maxPlayers}`);
  }

  endGame(pin, results, gameId) {
    if (!this.socket) this.connect();
    this.socket.emit("end-game", { pin, results, gameId });
  }

  // Player methods
  playerJoin(pin, nickname) {
    if (!this.socket) this.connect();
    this.socket.emit("player-join", { pin, nickname });
  }

  submitAnswer(pin, answerIndex, timeSpent = 0, boosts = []) {
    if (!this.socket) this.connect();
    this.socket.emit("submit-answer", { pin, answerIndex, timeSpent, boosts });
  }

  activateBoost(pin, boostType, questionIndex) {
    if (!this.socket) this.connect();
    this.socket.emit("activate-boost", { pin, boostType, questionIndex });
  }

  // New method to request answer history
  requestAnswerHistory(pin, questionIndex) {
    if (!this.socket) this.connect();
    console.log("Requesting answer history for:", { pin, questionIndex });
    this.socket.emit("request-answer-history", { pin, questionIndex });
  }
}

const socketService = new SocketService();
export default socketService;