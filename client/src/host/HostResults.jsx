import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import Avatar from '../shared/Avatar';
import { useSounds } from '../shared/useSounds';

const SCORE_TABLE = [0, 0, 0, 2, 3, 5, 8, 13, 21];

const WORD_COLORS = {
  3: { color: '#84fab0', shadow: '0 0 20px rgba(132,250,176,0.6)' },
  4: { color: '#4de8ff', shadow: '0 0 20px rgba(77,232,255,0.6)' },
  5: { color: '#a78bfa', shadow: '0 0 20px rgba(167,139,250,0.6)' },
  6: { color: '#ff4ecb', shadow: '0 0 20px rgba(255,78,203,0.6)' },
  7: { color: '#fbbf24', shadow: '0 0 20px rgba(251,191,36,0.6)' },
  8: { color: '#f97316', shadow: '0 0 25px rgba(249,115,22,0.7)' },
};

function getWordStyle(word) {
  const len = Math.min(word.length, 8);
  return WORD_COLORS[len] || WORD_COLORS[8];
}

export default function HostResults() {
  const { state, send } = useGame();
  const sfx = useSounds();
  const { results } = state;
  const [revealIdx, setRevealIdx] = useState(-1);
  const [currentWord, setCurrentWord] = useState(null);
  const [runningScores, setRunningScores] = useState({});
  const [showWinner, setShowWinner] = useState(false);
  const [progressCommon, setProgressCommon] = useState(0);
  const [progressUnique, setProgressUnique] = useState(0);
  const [flyingPoints, setFlyingPoints] = useState([]);
  const barRefs = useRef({});
  const stageRef = useRef(null);

  const entries = Object.entries(results || {}).sort((a, b) => b[1].score - a[1].score);
  const maxScore = entries.length > 0 ? entries[0][1].score : 1;

  const allWords = useRef({});
  const sequence = useRef([]);
  const commonCount = useRef(0);

  useEffect(() => {
    const words = {};
    entries.forEach(([name, data]) => {
      data.words.forEach(w => {
        const word = typeof w === 'string' ? w : w.word;
        const path = typeof w === 'string' ? [] : w.path;
        if (!words[word]) words[word] = { players: [], path };
        words[word].players.push(name);
      });
    });
    allWords.current = words;

    const common = Object.entries(words).filter(([, v]) => v.players.length > 1).sort((a, b) => a[0].length - b[0].length);
    const unique = Object.entries(words).filter(([, v]) => v.players.length === 1).sort((a, b) => a[0].length - b[0].length);

    const seq = [];
    common.forEach(([w, v]) => seq.push({ word: w, players: v.players, path: v.path, type: 'common' }));
    unique.forEach(([w, v]) => seq.push({ word: w, players: v.players, path: v.path, type: 'unique' }));

    sequence.current = seq;
    commonCount.current = common.length;

    const scores = {};
    entries.forEach(([name]) => { scores[name] = 0; });
    setRunningScores(scores);

    setTimeout(() => setRevealIdx(0), 1000);
  }, []);

  useEffect(() => {
    if (revealIdx < 0) return;
    if (revealIdx >= sequence.current.length) {
      setCurrentWord(null);
      setShowWinner(true);
      sfx.gameOver();
      return;
    }

    const item = sequence.current[revealIdx];
    const pts = SCORE_TABLE[Math.min(item.word.length, 8)];
    setCurrentWord(item);
    sfx.wordReveal();

    if (item.type === 'common') {
      setProgressCommon(((revealIdx + 1) / commonCount.current) * 100);
    } else {
      setProgressCommon(100);
      const uniqueIdx = revealIdx - commonCount.current + 1;
      const uniqueTotal = sequence.current.length - commonCount.current;
      setProgressUnique((uniqueIdx / uniqueTotal) * 100);
    }

    // Flying points after slight delay
    setTimeout(() => {
      const stageEl = stageRef.current;
      if (stageEl) {
        const stageRect = stageEl.getBoundingClientRect();
        item.players.forEach((name, pIdx) => {
          const barEl = barRefs.current[name];
          if (!barEl) return;
          const barRect = barEl.getBoundingClientRect();
          const id = `${revealIdx}-${name}-${pIdx}`;
          setFlyingPoints(prev => [...prev, {
            id,
            pts,
            startX: stageRect.left + stageRect.width / 2,
            startY: stageRect.bottom + 10,
            endX: barRect.left + barRect.width / 2,
            endY: barRect.top,
          }]);
          setTimeout(() => setFlyingPoints(prev => prev.filter(p => p.id !== id)), 1200);
        });
      }

      setRunningScores(prev => {
        const next = { ...prev };
        item.players.forEach(name => { next[name] = (next[name] || 0) + pts; });
        return next;
      });
    }, 500);

    const timer = setTimeout(() => setRevealIdx(i => i + 1), 1300);
    return () => clearTimeout(timer);
  }, [revealIdx]);

  const totalWords = sequence.current.length;
  const numCommon = commonCount.current;
  const numUnique = totalWords - numCommon;

  return (
    <div className="flex flex-col items-center h-screen p-4 overflow-hidden">
      {/* 1. Title */}
      <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-pink via-yellow-300 to-cyan-300 bg-clip-text text-transparent mb-2">
        🏁 RACE RESULTS!
      </h2>

      {/* 2. Progress bar */}
      <div className="flex justify-between w-full max-w-xl text-xs mb-1 px-1">
        {numCommon > 0 && <span className="text-purple-600">🤝 {numCommon} common</span>}
        <span className="text-yellow-600 ml-auto">⭐ {numUnique} unique</span>
      </div>
      <div className="flex w-full max-w-xl h-4 gap-1 mb-4 rounded-full overflow-hidden shadow-lg border border-white/30">
        {numCommon > 0 && (
          <div className="bg-purple-900/30 backdrop-blur-sm overflow-hidden" style={{ flex: numCommon }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', boxShadow: '0 0 12px rgba(139,92,246,0.5)' }} animate={{ width: `${progressCommon}%` }} transition={{ duration: 0.4 }} />
          </div>
        )}
        <div className="bg-yellow-900/20 backdrop-blur-sm overflow-hidden" style={{ flex: numUnique || 1 }}>
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #ff4ecb, #fbbf24)', boxShadow: '0 0 12px rgba(255,78,203,0.5)' }} animate={{ width: `${progressUnique}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      {/* 3. Board */}
      <div className="flex-1" />
      {state.board && (
        <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: `repeat(${state.gridSize}, 1fr)` }}>
          {state.board.map((letter, i) => {
            const pathIdx = currentWord && currentWord.path ? currentWord.path.indexOf(i) : -1;
            const isHighlighted = pathIdx !== -1;
            return (
              <motion.div
                key={i}
                className="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-lg border"
                animate={{
                  backgroundColor: isHighlighted ? getWordStyle(currentWord.word).color : 'rgba(255,255,255,0.25)',
                  borderColor: isHighlighted ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                  scale: isHighlighted ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{ color: isHighlighted ? '#fff' : 'rgba(45,27,78,0.6)' }}
              >
                {letter === 'Q' ? 'Qu' : letter}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Word */}
      <div ref={stageRef} className="h-16 flex items-center justify-center mb-4">
        <AnimatePresence mode="wait">
          {currentWord && (
            <motion.div
              key={currentWord.word}
              className="font-display text-5xl font-bold"
              style={{
                color: '#fff',
                textShadow: `0 0 20px ${getWordStyle(currentWord.word).color}, 0 0 40px ${getWordStyle(currentWord.word).color}, 0 2px 4px rgba(0,0,0,0.4)`,
                WebkitTextStroke: `1px ${getWordStyle(currentWord.word).color}`,
              }}
              initial={{ scale: 0, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {currentWord.word}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Winner banner */}
      <AnimatePresence>
        {showWinner && entries.length > 0 && (
          <motion.div className="flex flex-col items-center gap-3 mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
            <div className="font-display text-3xl text-pink font-bold">👑 {entries[0][0]} WINS! 👑</div>
            <motion.button className="btn-primary px-8 py-3 text-lg rounded-xl" onClick={() => send({ type: 'restart', gridSize: state.gridSize, minWordLen: state.minWordLen, duration: state.duration })} whileTap={{ scale: 0.95 }}>Next Round</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Player scores */}
      <div className="flex items-end justify-center gap-10 flex-1 w-full max-w-3xl pb-4">
        {entries.map(([name]) => {
          const score = runningScores[name] || 0;
          const barHeight = maxScore > 0 ? Math.max(10, (score / maxScore) * 150) : 10;
          return (
            <div key={name} className="flex flex-col items-center flex-1 max-w-[120px] justify-end h-full">
              <Avatar name={name} size={56} className="mb-1" />
              <span className="text-sm font-semibold truncate w-full text-center mb-1">{name}</span>
              <span className="font-display text-3xl font-bold text-accent">{score}</span>
              <motion.div
                ref={el => { barRefs.current[name] = el; }}
                className="w-full rounded-t-xl border border-white/40"
                style={{ background: 'linear-gradient(180deg, rgba(255,78,203,0.5), rgba(107,33,168,0.5))' }}
                animate={{ height: barHeight }}
                transition={{ type: 'spring', stiffness: 150, damping: 12, mass: 0.8 }}
              />
            </div>
          );
        })}
      </div>

      {/* Flying points */}
      <AnimatePresence>
        {flyingPoints.map(fp => (
          <motion.div
            key={fp.id}
            className="fixed font-display text-4xl font-bold pointer-events-none z-50"
            style={{ left: fp.startX - 15, top: fp.startY + 20, color: '#fff', textShadow: '0 0 12px rgba(255,78,203,0.9), 0 0 24px rgba(107,33,168,0.7), 0 2px 4px rgba(0,0,0,0.5)' }}
            animate={{
              x: [0, (fp.endX - fp.startX) * 0.5 + (fp.endX > fp.startX ? 80 : -80), fp.endX - fp.startX],
              y: [0, (fp.endY - fp.startY) * 0.5, fp.endY - fp.startY - 20],
              scale: [1.2, 1.0, 0.6],
              opacity: [1, 1, 0.7],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.7, ease: 'linear' }}
          >
            +{fp.pts}
          </motion.div>
        ))}
      </AnimatePresence>

      <p className={`text-xs opacity-50 ${showWinner ? '' : 'hidden'}`}>⚡ Waiting for host to start next round...</p>
    </div>
  );
}
