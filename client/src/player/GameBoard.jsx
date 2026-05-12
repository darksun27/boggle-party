import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';

function getAdj(idx, size) {
  const r = Math.floor(idx / size), c = idx % size, adj = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) adj.push(nr * size + nc);
  }
  return adj;
}

export default function GameBoard() {
  const { state, send, dispatch } = useGame();
  const [selected, setSelected] = useState([]);
  const [dragging, setDragging] = useState(false);
  const boardRef = useRef(null);

  const { board, gridSize, timeLeft, duration, score, words, lastResult, paused } = state;

  const getCellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (el && el.dataset.idx !== undefined) return parseInt(el.dataset.idx);
    return -1;
  };

  const onStart = (idx) => {
    setDragging(true);
    setSelected([idx]);
    navigator.vibrate && navigator.vibrate(10);
  };

  const onMove = (x, y) => {
    if (!dragging) return;
    const idx = getCellFromPoint(x, y);
    if (idx < 0) return;
    setSelected(prev => {
      if (prev.length >= 2 && idx === prev[prev.length - 2]) return prev.slice(0, -1);
      if (prev.includes(idx)) return prev;
      if (getAdj(prev[prev.length - 1], gridSize).includes(idx)) {
        navigator.vibrate && navigator.vibrate(10);
        return [...prev, idx];
      }
      return prev;
    });
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (selected.length > 0) {
      send({ type: 'submit-word', path: selected });
    }
    setSelected([]);
  };

  // Clear result feedback after delay
  useEffect(() => {
    if (lastResult) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_RESULT' }), 1500);
      return () => clearTimeout(t);
    }
  }, [lastResult, dispatch]);

  const currentWord = selected.map(i => board[i] === 'Q' ? 'QU' : board[i]).join('');
  const timerPct = duration > 0 ? timeLeft / duration : 1;
  const timerUrgent = timeLeft <= 10;
  const timerWarn = timeLeft <= 30;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="screen game-screen">
      {paused && (
        <div className="pause-overlay">
          <div className="glass-card"><h3>⏸ Paused</h3><p>{state.pausedPlayer} disconnected</p></div>
        </div>
      )}

      <div className="game-header">
        <motion.div
          className={`timer ${timerUrgent ? 'urgent' : timerWarn ? 'warn' : ''}`}
          animate={timerUrgent ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {formatTime(timeLeft)}
        </motion.div>
        <div className="score-display">{score} pts</div>
      </div>

      <div className="timer-bar">
        <motion.div className="timer-fill" animate={{ width: `${timerPct * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
      </div>

      <div
        className="board"
        ref={boardRef}
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        onMouseDown={(e) => { const c = e.target.closest('[data-idx]'); if (c) { e.preventDefault(); onStart(parseInt(c.dataset.idx)); } }}
        onMouseMove={(e) => dragging && onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onTouchStart={(e) => { const c = e.target.closest('[data-idx]'); if (c) { e.preventDefault(); onStart(parseInt(c.dataset.idx)); } }}
        onTouchMove={(e) => { if (dragging) { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY); } }}
        onTouchEnd={onEnd}
      >
        {board && board.map((letter, i) => (
          <motion.div
            key={i}
            data-idx={i}
            className={`cell ${selected.includes(i) ? 'selected' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02, type: 'spring', stiffness: 500 }}
          >
            {letter === 'Q' ? 'Qu' : letter}
          </motion.div>
        ))}
      </div>

      <div className="current-word">{currentWord || '\u00A0'}</div>

      <AnimatePresence>
        {lastResult && (
          <motion.div
            className={`result-toast ${lastResult.valid ? 'success' : 'error'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastResult.valid ? `+${lastResult.points} ${lastResult.word}` : lastResult.reason}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="found-words">
        {words.map((w, i) => (
          <motion.span key={w} className="word-chip" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            {w}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
