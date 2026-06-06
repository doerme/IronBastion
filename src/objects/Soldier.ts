import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';
import type { SoldierState, SoldierType, SoldierVisualState } from '../types';

const SOLDIER_TEXTURES: Record<SoldierType, Record<SoldierVisualState, string>> = {
  bomber: {
    idle: ASSET_KEYS.bomber,
    deploy: ASSET_KEYS.bomberDeploy,
    attack: ASSET_KEYS.bomberAttack
  },
  infantry: {
    idle: ASSET_KEYS.infantry,
    deploy: ASSET_KEYS.infantryDeploy,
    attack: ASSET_KEYS.infantryAttack
  },
  sniper: {
    idle: ASSET_KEYS.sniper,
    deploy: ASSET_KEYS.sniperDeploy,
    attack: ASSET_KEYS.sniperAttack
  },
  artillery: {
    idle: ASSET_KEYS.artillery,
    deploy: ASSET_KEYS.artilleryDeploy,
    attack: ASSET_KEYS.artilleryAttack
  }
};

export class Soldier {
  state: SoldierState;
  sprite: Phaser.GameObjects.Sprite;
  hpBack: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, state: SoldierState) {
    this.state = state;
    this.sprite = scene.add.sprite(state.x, state.y, SOLDIER_TEXTURES[state.type][state.visualState]);
    this.sprite.setScale(0.72);
    this.sprite.setDepth(2);
    if (state.team === 'blue') this.sprite.setFlipX(true);

    this.hpBack = scene.add.rectangle(state.x, state.y + 33, 34, 5, 0x171411, 0.9);
    this.hpBack.setDepth(2.3);
    this.hpFill = scene.add.rectangle(state.x - 17, state.y + 33, 34, 5, 0x50d46b, 0.95);
    this.hpFill.setOrigin(0, 0.5);
    this.hpFill.setDepth(2.4);
    this.syncVisual(false);
  }

  syncVisual(showInterior = false): void {
    const hpRate = Math.max(0, this.state.hp / this.state.maxHp);
    const visibleInside = showInterior || this.state.isExposed;
    this.sprite.setTexture(SOLDIER_TEXTURES[this.state.type][this.state.visualState]);
    this.sprite.setAlpha(visibleInside ? 1 : 0.22);
    this.sprite.setTint(visibleInside ? 0xffffff : 0x394136);
    this.hpBack.setVisible(visibleInside);
    this.hpFill.setVisible(visibleInside);
    this.hpFill.width = 34 * hpRate;
    this.hpFill.setFillStyle(hpRate > 0.55 ? 0x50d46b : hpRate > 0.25 ? 0xffc857 : 0xff5b4f, 0.95);
  }

  destroy(): void {
    this.sprite.destroy();
    this.hpBack.destroy();
    this.hpFill.destroy();
  }
}
