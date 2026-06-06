import Phaser from 'phaser';
import { ASSET_KEYS, SOLDIER_CONFIG } from '../config';
import type { SoldierState, SoldierType, Team } from '../types';

const SOLDIER_TEXTURES: Record<SoldierType, string> = {
  bomber: ASSET_KEYS.bomber,
  infantry: ASSET_KEYS.infantry,
  sniper: ASSET_KEYS.sniper,
  artillery: ASSET_KEYS.artillery
};

export class Soldier {
  state: SoldierState;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  hpBack: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, state: SoldierState) {
    this.state = state;
    this.sprite = scene.add.sprite(state.x, state.y, SOLDIER_TEXTURES[state.type]);
    this.sprite.setScale(0.72);
    this.sprite.setDepth(2);
    if (state.team === 'blue') this.sprite.setFlipX(true);

    this.label = scene.add.text(state.x, state.y + 26, SOLDIER_CONFIG[state.type].label.slice(0, 2), {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#f2e8c6',
      stroke: '#141610',
      strokeThickness: 3
    });
    this.label.setOrigin(0.5);
    this.label.setDepth(2.2);

    this.hpBack = scene.add.rectangle(state.x, state.y + 36, 34, 5, 0x171411, 0.9);
    this.hpBack.setDepth(2.3);
    this.hpFill = scene.add.rectangle(state.x - 17, state.y + 36, 34, 5, 0x50d46b, 0.95);
    this.hpFill.setOrigin(0, 0.5);
    this.hpFill.setDepth(2.4);
    this.syncVisual();
  }

  syncVisual(): void {
    const hpRate = Math.max(0, this.state.hp / this.state.maxHp);
    this.sprite.setAlpha(this.state.isExposed ? 1 : 0.22);
    this.label.setAlpha(this.state.isExposed ? 1 : 0.28);
    this.sprite.setTint(this.state.isExposed ? 0xffffff : 0x394136);
    this.hpBack.setVisible(this.state.isExposed);
    this.hpFill.setVisible(this.state.isExposed);
    this.hpFill.width = 34 * hpRate;
    this.hpFill.setFillStyle(hpRate > 0.55 ? 0x50d46b : hpRate > 0.25 ? 0xffc857 : 0xff5b4f, 0.95);
  }

  destroy(): void {
    this.sprite.destroy();
    this.label.destroy();
    this.hpBack.destroy();
    this.hpFill.destroy();
  }
}
