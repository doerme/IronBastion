import Phaser from 'phaser';
import { ASSET_KEYS, FORT_LAYER_CONFIG } from '../config';
import type { FortBlockState, FortLayer, Team } from '../types';

export class FortBlock {
  state: FortBlockState;
  sprite: Phaser.GameObjects.Sprite;
  cracks: Phaser.GameObjects.Graphics;
  hitFlash: Phaser.GameObjects.Rectangle;
  private lastRenderedCrackLevel = -1;
  private lastRenderedHitAt = -1;

  constructor(scene: Phaser.Scene, state: FortBlockState, team: Team) {
    this.state = state;
    const key = team === 'red' ? ASSET_KEYS.redBlock : ASSET_KEYS.blueBlock;
    this.sprite = scene.add.sprite(state.x, state.y, key);
    this.sprite.setDisplaySize(state.width, state.height);
    this.sprite.setDepth(3);
    this.cracks = scene.add.graphics();
    this.cracks.setDepth(3.2);
    this.hitFlash = scene.add.rectangle(state.x, state.y, state.width, state.height, 0xfff0b0, 0);
    this.hitFlash.setDepth(3.3);
  }

  syncVisual(showInterior = false): void {
    if (this.state.isDestroyed) {
      this.sprite.setVisible(false);
      this.cracks.setVisible(false);
      this.hitFlash.setVisible(false);
      return;
    }

    this.sprite.setVisible(true);
    this.cracks.setVisible(true);
    this.hitFlash.setVisible(true);
    const pct = this.state.hp / this.state.maxHp;
    if (pct < 0.45) this.sprite.setTexture(ASSET_KEYS.damagedBlock);
    this.sprite.setAlpha(showInterior ? 0.24 : 0.7 + pct * 0.3);
    this.cracks.setAlpha(showInterior ? 0.35 : 1);
    this.renderCracks();
    this.renderHitFlash();
  }

  private renderCracks(): void {
    if (this.lastRenderedCrackLevel === this.state.crackLevel) return;
    this.lastRenderedCrackLevel = this.state.crackLevel;
    this.cracks.clear();
    if (this.state.crackLevel <= 0) return;

    const level = Math.min(4, this.state.crackLevel);
    const left = this.state.x - this.state.width / 2;
    const top = this.state.y - this.state.height / 2;
    const centerX = this.state.x;
    const centerY = this.state.y;

    this.cracks.lineStyle(2, 0x0d0b09, 0.85);
    this.cracks.beginPath();
    this.cracks.moveTo(centerX - 2, centerY - 1);
    this.cracks.lineTo(left + this.state.width * 0.2, top + this.state.height * 0.28);
    if (level >= 2) {
      this.cracks.moveTo(centerX, centerY);
      this.cracks.lineTo(left + this.state.width * 0.78, top + this.state.height * 0.24);
    }
    if (level >= 3) {
      this.cracks.moveTo(centerX - 1, centerY + 1);
      this.cracks.lineTo(left + this.state.width * 0.34, top + this.state.height * 0.85);
    }
    if (level >= 4) {
      this.cracks.moveTo(centerX + 2, centerY + 1);
      this.cracks.lineTo(left + this.state.width * 0.88, top + this.state.height * 0.72);
      this.cracks.moveTo(centerX - 5, centerY - 4);
      this.cracks.lineTo(centerX + 6, centerY + 5);
    }
    this.cracks.strokePath();

    this.cracks.lineStyle(1, 0xf4d48a, 0.45);
    this.cracks.strokeCircle(centerX, centerY, 3 + level);
  }

  private renderHitFlash(): void {
    if (this.lastRenderedHitAt === this.state.lastHitAt) return;
    this.lastRenderedHitAt = this.state.lastHitAt;
    if (this.state.lastHitAt <= 0) return;

    this.hitFlash.setAlpha(0.68);
    this.sprite.setX(this.state.x + 2);
    this.sprite.scene.tweens.add({
      targets: [this.sprite, this.cracks, this.hitFlash],
      x: '+=0',
      duration: 60,
      yoyo: true,
      repeat: 2,
      onUpdate: () => {
        const jitter = Phaser.Math.Between(-1, 1);
        this.sprite.setPosition(this.state.x + jitter, this.state.y);
        this.hitFlash.setPosition(this.state.x + jitter, this.state.y);
      },
      onComplete: () => {
        this.sprite.setPosition(this.state.x, this.state.y);
        this.hitFlash.setPosition(this.state.x, this.state.y);
      }
    });
    this.sprite.scene.tweens.add({
      targets: this.hitFlash,
      alpha: 0,
      duration: 260
    });
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
    crackLevel: 0,
    lastHitAt: 0,
    canBearWeight: config.canBearWeight,
    width: config.blockWidth,
    height: config.blockHeight
  };
}
