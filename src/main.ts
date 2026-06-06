import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#11150f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 576
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false
    }
  },
  scene: [BattleScene]
});

export default game;
