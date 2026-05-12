import { useSound } from 'react-sounds';

export const ALL_SOUNDS = [
  'ui/button_soft',
  'arcade/power_up',
  'arcade/level_down',
  'arcade/coin_bling',
  'arcade/coin',
  'ui/button_hard',
  'notification/warning',
  'ui/button_medium',
];

export function useSounds() {
  const { play: cellTap } = useSound('ui/button_soft');
  const { play: gameStart } = useSound('arcade/power_up');
  const { play: gameOver } = useSound('arcade/level_down');
  const { play: playerJoin } = useSound('arcade/coin_bling');
  const { play: wordReveal } = useSound('arcade/coin');
  const { play: timerTick } = useSound('ui/button_hard');
  const { play: timerWarning } = useSound('notification/warning');
  const { play: click } = useSound('ui/button_medium');

  return {
    cellTap: () => cellTap({ volume: 0.3 }),
    gameStart: () => gameStart({ volume: 0.5 }),
    gameOver: () => gameOver({ volume: 0.5 }),
    playerJoin: () => playerJoin({ volume: 0.4 }),
    wordReveal: () => wordReveal({ volume: 0.5 }),
    timerTick: () => timerTick({ volume: 0.2 }),
    timerWarning: () => timerWarning({ volume: 0.3 }),
    click: () => click({ volume: 0.3 }),
  };
}
