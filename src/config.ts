import type { FortLayer, SoldierType } from './types';

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

export const ASSET_KEYS = {
  background: 'battlefield-bg.png',
  redBlock: 'red-fort-block.png',
  blueBlock: 'blue-fort-block.png',
  damagedBlock: 'damaged-fort-block.png',
  redCore: 'red-core.png',
  blueCore: 'blue-core.png',
  bomber: 'bomber-sprite.png',
  infantry: 'infantry-sprite.png',
  sniper: 'sniper-sprite.png',
  artillery: 'artillery-sprite.png',
  shell: 'shell.png',
  explosion: 'explosion-flash.png',
  smoke: 'smoke.png'
} as const;

export const TURN_CONFIG = {
  maxRounds: 12,
  deploySeconds: 15,
  settleSeconds: 3,
  maxSoldiersPerFort: 6,
  initialCoreHp: 1000,
  allBlocksDestroyedCorePenalty: 80
} as const;

export const PHYSICS_CONFIG = {
  gravity: 600,
  launchOffsetY: -120,
  shellHitRadius: 18,
  explosionMs: 400,
  smokeMs: 1200,
  shakeMs: 80,
  shakeIntensity: 0.012
} as const;

export const CRATER_CONFIG = {
  minRadius: 20,
  maxRadius: 46,
  radiusScaleBySoldier: {
    bomber: 0.46,
    infantry: 0.5,
    sniper: 0.55,
    artillery: 0.38
  }
} as const satisfies {
  minRadius: number;
  maxRadius: number;
  radiusScaleBySoldier: Record<SoldierType, number>;
};

export const FORT_LAYER_CONFIG: Record<
  FortLayer,
  {
    label: string;
    count: number;
    hp: number;
    defense: number;
    canBearWeight: boolean;
    damageModifier: number;
    blockWidth: number;
    blockHeight: number;
  }
> = {
  bottom: {
    label: '重装工事',
    count: 12,
    hp: 120,
    defense: 35,
    canBearWeight: true,
    damageModifier: 1,
    blockWidth: 34,
    blockHeight: 30
  },
  middle: {
    label: '作战平台',
    count: 10,
    hp: 80,
    defense: 20,
    canBearWeight: true,
    damageModifier: 1,
    blockWidth: 34,
    blockHeight: 28
  },
  top: {
    label: '炮兵阵地',
    count: 8,
    hp: 50,
    defense: 8,
    canBearWeight: false,
    damageModifier: 1.3,
    blockWidth: 34,
    blockHeight: 26
  }
};

export const SOLDIER_CONFIG: Record<SoldierType, import('./types').SoldierConfig> = {
  bomber: {
    label: '爆破工兵',
    attack: 65,
    defBreak: 1.8,
    shellSpeed: 280,
    explosionRadius: 90,
    maxHp: 150,
    suitLayer: 'bottom',
    attacksPerTurn: 1,
    description: '破甲暴击，撕开底层防线'
  },
  infantry: {
    label: '突击步兵',
    attack: 42,
    defBreak: 1,
    shellSpeed: 320,
    explosionRadius: 50,
    maxHp: 115,
    suitLayer: 'middle',
    attacksPerTurn: 2,
    description: '高频压制，稳定清场'
  },
  sniper: {
    label: '狙击兵',
    attack: 95,
    defBreak: 1.2,
    shellSpeed: 380,
    explosionRadius: 35,
    maxHp: 85,
    suitLayer: 'top',
    attacksPerTurn: 1,
    description: '精准破核，直击核心+25%'
  },
  artillery: {
    label: '野战炮兵',
    attack: 55,
    defBreak: 1.4,
    shellSpeed: 260,
    explosionRadius: 120,
    maxHp: 120,
    suitLayer: 'middleTop',
    attacksPerTurn: 1,
    description: '范围轰炸，多层溅射'
  }
};

export const COLLAPSE_RULES = {
  threshold: 0.6,
  low: { min: 0.6, max: 0.7, probability: 0.35 },
  medium: { min: 0.7, max: 0.85, probability: 0.65 },
  high: { min: 0.85, max: 1.01, probability: 1 },
  minBlocks: 2,
  maxBlocks: 4,
  minCoreDamage: 40,
  maxCoreDamage: 120
} as const;

export const DEPLOY_LAYOUT: Record<FortLayer, number> = {
  bottom: 2,
  middle: 2,
  top: 2
};
