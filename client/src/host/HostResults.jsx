import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import Avatar from '../shared/Avatar';

const SCORE_TABLE = [0, 0, 0, 2, 3, 5, 8, 13, 21];

export default function HostResults() {
  const { state } = useGame();
  const { results } = state;
  const [revealIdx, setRevealIdx] = useState(-1);
  const [currentWord, setCurrentWord] = useState(null);
  const [runningScores, setRunningScores] = useState({});
  const [showWinner, setShowWinner] = useState(false);
  const [progressCommon, setProgressCommon] = useState(0);
  const [progressUnique, setProgressUnique] = useState(0);

  const entries = Object.entries(results || {}).sort((a, b) => b[1].score - a[1].score);
  const maxScore = entries.length > 0 ? entries[0][1].score : 1;

  // Build word sequence: common first, then unique per player
  const allWords = useRef({});
  const sequence = useRef([]);
  const commonCount = useRef(0);

  useEffect(() => {
    const words = {};
    entries.forEach(([name, data]) => {
      data.words.forEach(w => { if (!words[w]) words[w] = []; words[w].push(name); });
    });
    allWords.current = words;

    const common = Object.entries(words).filter(([, p]) => p.length > 1).sort((a, b) => a[0].length - b[0].length);
    const uniqueByPlayer = {};
    entries.forEach(([name]) => { uniqueByPlayer[name] = []; });
    Object.entries(words).forEach(([w, p]) => { if (p.length === 1) uniqueByPlayer[p[0]].push(w); });

    const seq = [];
    common.forEach(([w, p]) => seq.push({ word: w, players: p, type: 'common' }));
    entries.forEach(([name]) => { (uniqueByPlayer[name] || []).forEach(w => seq.push({ word: w, players: [name], type: 'unique' })); });

    sequence.current = seq;
    commonCount.current = common.length;

    const scores = {};
    entries.forEach(([name]) => { scores[name] = 0; });
    setRunningScores(scores);

    // Start reveal
    setTimeout(() => setRevealIdx(0), 1000);
  }, []);

  // Reveal loop
  useEffect(() => {
    if (revealIdx < 0) return;
    if (revealIdx >= sequence.current.length) {
      setCurrentWord(null);
      setShowWinner(true);
      return;
    }

    const item = sequence.current[revealIdx];
    const pts = SCORE_TABLE[Math.min(item.word.length, 8)];
    setCurrentWord(item);

    // Update progress
    if (item.type === 'common') {
      setProgressCommon(((revealIdx + 1) / commonCount.current) * 100);
    } else {
      setProgressCommon(100);
      const uniqueIdx = revealIdx - commonCount.current + 1;
      const uniqueTotal = sequence.current.length - commonCount.current;
      setProgressUnique((uniqueIdx / uniqueTotal) * 100);
    }

    // Update scores
    setTimeout(() => {
      setRunningScores(prev => {
        const next = { ...prev };
        item.players.forEach(name => { next[name] = (next[name] || 0) + pts; });
        return next;
      });
    }, 300);

    const timer = setTimeout(() => setRevealIdx(i => i + 1), 900);
    return () => clearTimeout(timer);
  }, [revealIdx]);

  const totalWords = sequence.current.length;
  const numCommon = commonCount.current;
  const numUnique = totalWords - numCommon;

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <h2 className="font-display text-3xl font-bold bg-gradient-to-r from-pink via-yellow-300 to-cyan-300 bg-clip-text text-transparent mb-4">
        🏁 RACE RESULTS!
      </h2>

      {/* Progress bar labels */}
      <div className="flex justify-between w-full max-w-2xl text-sm mb-1 px-1">
        {numCommon > 0 && <span className="text-purple-600">🤝 {numCommon} common</span>}
        <span className="text-yellow-600 ml-auto">⭐ {numUnique} unique</span>
      </div>

      {/* Progress bar */}
      <div className="flex w-full max-w-2xl h-3 gap-1 mb-6">
        {numCommon > 0 && (
          <div className="rounded-l-full bg-white/10 border border-white/20 overflow-hidden" style={{ flex: numCommon }}>
            <motion.div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-l-full" animate={{ width: `${progressCommon}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}
        <div className="rounded-r-full bg-white/10 border border-white/20 overflow-hidden" style={{ flex: numUnique }}>
          <motion.div className="h-full bg-gradient-to-r from-pink to-yellow-300 rounded-r-full" animate={{ width: `${progressUnique}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Stage word */}
      <div className="h-24 flex items-center justify-center mb-6">
        <AnimatePresence mode="wait">
          {currentWord && (
            <motion.div
              key={currentWord.word}
              className={`font-display text-4xl font-bold ${currentWord.type === 'common' ? 'text-purple-500' : 'text-yellow-400'}`}
              style={{ textShadow: currentWord.type === 'common' ? '0 0 30px rgba(138,43,226,0.6)' : '0 0 30px rgba(255,215,0,0.6)' }}
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
          <motion.div
            className="font-display text-3xl text-pink font-bold mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6, type: 'spring' }}
          >
            👑 {entries[0][0]} WINS! 👑
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bar chart - fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex items-end justify-center gap-4 px-5 h-[45vh]">
        {entries.map(([name, data], i) => {
          const score = runningScores[name] || 0;
          const barHeight = maxScore > 0 ? Math.max(10, (score / maxScore) * 180) : 10;
          return (
            <div key={name} className="flex flex-col items-center flex-1 max-w-[100px] h-full justify-end">
              <Avatar name={name} size={48} className="mb-1" />
              <span className="text-xs font-semibold truncate w-full text-center">{name}</span>
              <motion.span
                className="font-display text-sm font-bold text-accent"
                key={score}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
              >
                {score}
              </motion.span>
              <motion.div
                className="w-full rounded-t-xl border border-white/40"
                style={{ background: 'linear-gradient(180deg, rgba(255,78,203,0.5), rgba(107,33,168,0.5))' }}
                animate={{ height: barHeight }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            </div>
          );
        })}
      </div>

      <p className="fixed bottom-2 text-xs opacity-50">⚡ Waiting for host to start next round...</p>
    </div>
  );
}
