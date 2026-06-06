import Phaser from 'phaser';
import { ASSET_KEYS, FORT_LAYER_CONFIG } from '../config';
import type { FortBlockState, FortLayer, Team } from '../types';

export class FortBlock {
  state: FortBlockState;
  sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, state: FortBlockState, team: Team) {
    this.state = state;
    const key = team === 'red' ? ASSET_KEYS.redBlock : ASSET_KEYS.blueBlock;
    this.sprite = scene.add.sprite(state.x, state.y, key);
    this.sprite.setDisplaySize(state.width, state.height);
    this.sprite.setDepth(3);
  }

  syncVisual(): void {
    if (this.state.isDestroyed) {
      this.sprite.setVisible(false);
      return;
    }

    const pct = this.state.hp / this.state.maxHp;
    if (pct < 0.45) this.sprite.setTexture(ASSET_KEYS.damagedBlock);
    this.sprite.setAlpha(0.7 + pct * 0.3);
  }
}

export function createFortBlockState(id: string, x: number, y: number, layer: FortLayer): FortBlockState {
  const config = FORT_LAYER_CONFIG[layer];
  return {
    id,
    x,
    y,
    hp: config.hp,
    maxHp: config.hp,
    defense: config.defense,
    layer,
    isDestroyed: false,
    isVoid: false,
    canBearWeight: config.canBearWeight,
    width: config.blockWidth,
    height: config.blockHeight
  };
}
