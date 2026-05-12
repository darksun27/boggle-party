import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

const GameContext = createContext(null);

const initialState = {
  screen: 'loading', // loading | lobby | playing | ended
  roomCode: null,
  players: [],
  hostName: null,
  board: null,
  gridSize: 4,
  minWordLen: 3,
  duration: 180,
  timeLeft: 180,
  // Player-specific
  playerName: null,
  isHost: false,
  score: 0,
  words: [],
  lastResult: null,
  // Host-specific
  typingCount: 0,
  results: null,
  paused: false,
  pausedPlayer: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ROOM_CREATED':
      return { ...state, screen: 'lobby', roomCode: action.code, gridSize: action.gridSize, minWordLen: action.minWordLen, duration: action.duration };
    case 'JOINED':
      return { ...state, screen: action.state === 'playing' ? 'playing' : 'lobby', playerName: action.name, isHost: action.isHost, board: action.board, gridSize: action.gridSize, minWordLen: action.minWordLen, duration: action.duration, timeLeft: action.timeLeft };
    case 'PLAYER_LIST':
      return { ...state, players: action.players, hostName: action.hostName };
    case 'TYPING_UPDATE':
      return { ...state, typingCount: action.count };
    case 'SETTINGS_CHANGED':
      return { ...state, gridSize: action.gridSize, minWordLen: action.minWordLen, duration: action.duration };
    case 'GAME_START':
      return { ...state, screen: 'playing', board: action.board, gridSize: action.gridSize, minWordLen: action.minWordLen, duration: action.duration, timeLeft: action.timeLeft, score: 0, words: [], lastResult: null, results: null };
    case 'TICK':
      return { ...state, timeLeft: action.timeLeft };
    case 'WORD_RESULT':
      if (action.valid) {
        return { ...state, score: action.totalScore, words: [...state.words, action.word], lastResult: action };
      }
      return { ...state, lastResult: action };
    case 'SCORE_UPDATE':
      return { ...state, players: action.players };
    case 'GAME_END':
      return { ...state, screen: 'ended', results: action.results, hostName: action.hostName, isHost: action.hostName === state.playerName, board: action.board || state.board, gridSize: action.gridSize || state.gridSize };
    case 'NEW_ROUND':
      return { ...state, screen: 'lobby', board: action.board, gridSize: action.gridSize, minWordLen: action.minWordLen, duration: action.duration, players: action.players, hostName: action.hostName, score: 0, words: [], results: null };
    case 'GAME_PAUSED':
      return { ...state, paused: true, pausedPlayer: action.disconnectedPlayer, players: action.players };
    case 'GAME_RESUMED':
      return { ...state, paused: false, pausedPlayer: null, timeLeft: action.timeLeft };
    case 'HOST_CHANGED':
      return { ...state, hostName: action.hostName, isHost: action.hostName === state.playerName, players: action.players };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_RESULT':
      return { ...state, lastResult: null };
    default:
      return state;
  }
}

export function GameProvider({ children, role }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const onMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'room-created': dispatch({ ...msg, type: 'ROOM_CREATED' }); break;
      case 'joined': dispatch({ ...msg, type: 'JOINED' }); break;
      case 'player-joined':
      case 'player-left':
      case 'score-update':
        dispatch({ type: msg.type === 'score-update' ? 'SCORE_UPDATE' : 'PLAYER_LIST', players: msg.players, hostName: msg.hostName }); break;
      case 'host-changed': dispatch({ ...msg, type: 'HOST_CHANGED' }); break;
      case 'typing-update': dispatch({ type: 'TYPING_UPDATE', count: msg.count }); break;
      case 'settings-changed': dispatch({ ...msg, type: 'SETTINGS_CHANGED' }); break;
      case 'game-start': dispatch({ ...msg, type: 'GAME_START' }); break;
      case 'tick': dispatch({ type: 'TICK', timeLeft: msg.timeLeft }); break;
      case 'word-result': dispatch({ ...msg, type: 'WORD_RESULT' }); break;
      case 'game-end': dispatch({ ...msg, type: 'GAME_END' }); break;
      case 'new-round': dispatch({ ...msg, type: 'NEW_ROUND' }); break;
      case 'game-paused': dispatch({ ...msg, type: 'GAME_PAUSED' }); break;
      case 'game-resumed': dispatch({ ...msg, type: 'GAME_RESUMED' }); break;
      case 'error': dispatch({ type: 'ERROR', message: msg.message }); break;
    }
  }, []);

  const roomCreated = useRef(false);

  const onConnect = useCallback((ws) => {
    if (window.__TEST_RESULTS__) return; // skip in test mode
    if (role === 'host' && !roomCreated.current) {
      roomCreated.current = true;
      ws.send(JSON.stringify({ type: 'create-room' }));
    }
  }, [role]);

  const { send, connected } = useWebSocket(onMessage, onConnect);

  // Load test results if available (via /test-results endpoint)
  useEffect(() => {
    if (window.__TEST_RESULTS__) {
      dispatch({ ...window.__TEST_RESULTS__, type: 'GAME_END' });
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, send, connected, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
