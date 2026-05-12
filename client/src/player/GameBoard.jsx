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
    if (selected.length > 0) send({ type: 'submit-word', path: selected });
    setSelected([]);
  };

  useEffect(() => {
    if (lastResult) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_RESULT' }), 1500);
      return () => clearTimeout(t);
    }
  }, [lastResult, dispatch]);

  const currentWord = selected.map(i => board[i] === 'Q' ? 'QU' : board[i]).join('');
  const timerPct = duration > 0 ? timeLeft / duration : 1;
  const urgent = timeLeft <= 10;
  const warn = timeLeft <= 30;

  return (
    <div className="flex flex-col items-center min-h-screen p-3 pt-4">
      {paused && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-lg flex items-center justify-center">
          <div className="glass p-6 text-center">
            <h3 className="font-display text-accent font-bold">⏸ Paused</h3>
            <p className="text-sm mt-2 opacity-70">{state.pausedPlayer} disconnected</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center w-full max-w-sm mb-2">
        <div className={`font-display text-xl font-bold px-3 py-1 rounded-xl glass ${urgent ? 'text-red-500' : warn ? 'text-orange-500' : 'text-accent'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="font-display text-lg font-bold text-accent">{score} pts</div>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-sm h-1.5 rounded-full bg-white/20 mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: urgent ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #84fab0, #4de8ff)' }}
          animate={{ width: `${timerPct * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="board grid gap-2 mb-3 relative"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        onMouseDown={(e) => { const c = e.target.closest('[data-idx]'); if (c) { e.preventDefault(); onStart(parseInt(c.dataset.idx)); } }}
        onMouseMove={(e) => dragging && onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onTouchStart={(e) => { const c = e.target.closest('[data-idx]'); if (c) { e.preventDefault(); onStart(parseInt(c.dataset.idx)); } }}
        onTouchMove={(e) => { if (dragging) { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY); } }}
        onTouchEnd={onEnd}
      >
        {/* Trail SVG */}
        {selected.length >= 2 && boardRef.current && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <polyline
              points={selected.map(idx => {
                const cell = boardRef.current.querySelector(`[data-idx="${idx}"]`);
                if (!cell) return '0,0';
                const br = boardRef.current.getBoundingClientRect();
                const cr = cell.getBoundingClientRect();
                return `${cr.left + cr.width / 2 - br.left},${cr.top + cr.height / 2 - br.top}`;
              }).join(' ')}
              stroke="rgba(107,33,168,0.5)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
        {board && board.map((letter, i) => (
          <motion.div
            key={i}
            data-idx={i}
            className={`cell glass w-[56px] h-[56px] flex items-center justify-center text-xl font-bold ${selected.includes(i) ? 'selected' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02, type: 'spring', stiffness: 500 }}
          >
            {letter === 'Q' ? 'Qu' : letter}
          </motion.div>
        ))}
      </div>

      {/* Current word */}
      <div className="font-display text-xl tracking-widest text-accent min-h-[1.5em] mb-2">
        {currentWord || '\u00A0'}
      </div>

      {/* Result toast */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl font-semibold text-base backdrop-blur-md z-50
              ${lastResult.valid ? 'bg-green-500/20 border border-green-500/50 text-green-700' : 'bg-red-500/20 border border-red-500/50 text-red-700'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastResult.valid ? `+${lastResult.points} ${lastResult.word}` : lastResult.reason}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Found words */}
      <div className="flex flex-wrap gap-1.5 justify-center mt-2 max-h-28 overflow-y-auto px-2">
        {words.map((w) => (
          <motion.span
            key={w}
            className="glass px-2 py-0.5 text-xs font-semibold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {w}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
