import { useSound } from 'react-sounds';

export function useSounds() {
  const { play: cellTap } = useSound('ui/button_soft');
  const { play: wordAccepted } = useSound('ui/success_chime');
  const { play: wordRejected } = useSound('ui/buzz');
  const { play: alreadyFound } = useSound('ui/blocked');
  const { play: gameStart } = useSound('arcade/power_up');
  const { play: gameOver } = useSound('arcade/level_down');
  const { play: playerJoin } = useSound('arcade/coin_bling');
  const { play: timerTick } = useSound('ui/button_hard');
  const { play: timerWarning } = useSound('notification/warning');
  const { play: click } = useSound('ui/button_medium');

  return {
    cellTap: () => cellTap({ volume: 0.3 }),
    wordAccepted: () => wordAccepted({ volume: 0.5 }),
    wordRejected: () => wordRejected({ volume: 0.4 }),
    alreadyFound: () => alreadyFound({ volume: 0.4 }),
    gameStart: () => gameStart({ volume: 0.5 }),
    gameOver: () => gameOver({ volume: 0.5 }),
    playerJoin: () => playerJoin({ volume: 0.4 }),
    timerTick: () => timerTick({ volume: 0.2 }),
    timerWarning: () => timerWarning({ volume: 0.3 }),
    click: () => click({ volume: 0.3 }),
  };
}
