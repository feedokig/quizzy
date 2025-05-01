// services/socketService.js
import io from "socket.io-client";

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
      onShowAnswerHistory: null, // Callback for answer history
      onFiftyFiftyOptions: null,
      onBoostActivated: null,
      onBoostError: null,
      onAnswerResult: null,
      onGameError: null,
      onQuizFinished: null,
      onMaxPlayersUpdated: null, // Added for max players updates
    };
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    if (!this.socket) return;

    // Player events
    this.socket.on("player-joined", (data) => {
      if (this.callbacks.onPlayerJoined) this.callbacks.onPlayerJoined(data);
    });

    this.socket.on("player-left", (playerId) => {
      if (this.callbacks.onPlayerLeft) this.callbacks.onPlayerLeft(playerId);
    });

    this.socket.on("player-answered", (data) => {
      if (this.callbacks.onPlayerAnswered) this.callbacks.onPlayerAnswered(data);
    });

    this.socket.on("update-players", (players) => {
      if (this.callbacks.onUpdatePlayers) this.callbacks.onUpdatePlayers(players);
    });

    // Question events
    this.socket.on("question", (questionData) => {
      if (this.callbacks.onQuestion) this.callbacks.onQuestion(questionData);
    });

    // Game state events
    this.socket.on("game-started", () => {
      if (this.callbacks.onGameStarted) this.callbacks.onGameStarted();
    });

    // Answer history event - properly implemented
    this.socket.on("show-answer-history", (answerData) => {
      console.log("Received answer history from server:", answerData);
      if (this.callbacks.onShowAnswerHistory) this.callbacks.onShowAnswerHistory(answerData);
    });

    // Boost-related events
    this.socket.on("fifty-fifty-options", (options) => {
      if (this.callbacks.onFiftyFiftyOptions) this.callbacks.onFiftyFiftyOptions(options);
    });

    this.socket.on("boost-activated", (data) => {
      if (this.callbacks.onBoostActivated) this.callbacks.onBoostActivated(data);
    });

    this.socket.on("boost-error", (error) => {
      if (this.callbacks.onBoostError) this.callbacks.onBoostError(error);
    });

    // Result events
    this.socket.on("answer-result", (result) => {
      if (this.callbacks.onAnswerResult) this.callbacks.onAnswerResult(result);
    });

    // Error events
    this.socket.on("game-error", (error) => {
      if (this.callbacks.onGameError) this.callbacks.onGameError(error);
    });

    // Quiz finished event
    this.socket.on("quiz:finished", (data) => {
      if (this.callbacks.onQuizFinished) this.callbacks.onQuizFinished(data);
    });

    // Max players updated event
    this.socket.on("max-players-updated", (data) => {
      if (this.callbacks.onMaxPlayersUpdated) this.callbacks.onMaxPlayersUpdated(data);
    });
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

  // Register callback functions for events
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
      return;
    }
    
    // If it's not in our callbacks map, register directly with socket.io
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Add the off method to unregister event listeners
  off(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = null;
      return;
    }
    
    // If it's not in our callbacks map, unregister directly with socket.io
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Clean up when disconnecting
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Access the underlying socket directly when needed
  getSocket() {
    if (!this.socket) this.connect();
    return this.socket;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;