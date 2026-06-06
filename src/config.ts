import type { BattleThemeConfig, ChassisConfig, ChassisType, FortLayer, ProjectileTrajectory, SoldierType, ThemeId } from './types';

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

export const ASSET_KEYS = {
  background: 'battlefield-bg.png',
  grasslandSky: 'grassland-sky.png',
  grasslandClouds: 'grassland-clouds.png',
  grasslandFar: 'grassland-far.png',
  grasslandNear: 'grassland-near.png',
  grasslandGround: 'grassland-ground.png',
  redBlock: 'red-fort-block.png',
  blueBlock: 'blue-fort-block.png',
  damagedBlock: 'damaged-fort-block.png',
  redCore: 'red-core.png',
  blueCore: 'blue-core.png',
  redWheeledChassis: 'red-wheeled-chassis.png',
  blueWheeledChassis: 'blue-wheeled-chassis.png',
  bomber: 'bomber-sprite.png',
  infantry: 'infantry-sprite.png',
  sniper: 'sniper-sprite.png',
  artillery: 'artillery-sprite.png',
  bomberDeploy: 'bomber-deploy-sprite.png',
  infantryDeploy: 'infantry-deploy-sprite.png',
  sniperDeploy: 'sniper-deploy-sprite.png',
  artilleryDeploy: 'artillery-deploy-sprite.png',
  bomberAttack: 'bomber-attack-sprite.png',
  infantryAttack: 'infantry-attack-sprite.png',
  sniperAttack: 'sniper-attack-sprite.png',
  artilleryAttack: 'artillery-attack-sprite.png',
  shell: 'shell.png',
  bomberShell: 'bomber-shell.png',
  infantryShell: 'infantry-shell.png',
  sniperShell: 'sniper-shell.png',
  artilleryShell: 'artillery-shell.png',
  explosion: 'explosion-flash.png',
  smoke: 'smoke.png'
} as const;

export const ACTIVE_THEME_ID: ThemeId = 'grassland';

export const THEME_CONFIG: Record<ThemeId, BattleThemeConfig> = {
  grassland: {
    id: 'grassland',
    label: '大草原',
    groundY: 425,
    layerKeys: {
      sky: ASSET_KEYS.grasslandSky,
      clouds: ASSET_KEYS.grasslandClouds,
      far: ASSET_KEYS.grasslandFar,
      near: ASSET_KEYS.grasslandNear,
      ground: ASSET_KEYS.grasslandGround
    }
  }
};

export const DEFAULT_CHASSIS_TYPE: ChassisType = 'wheeled-armored';

export const CHASSIS_CONFIG: Record<ChassisType, ChassisConfig> = {
  'wheeled-armored': {
    type: 'wheeled-armored',
    label: '轮式装甲底盘',
    width: 264,
    bodyHeight: 38,
    wheelCount: 6,
    wheelRadius: 13,
    groundClearance: 4,
    textureByTeam: {
      red: ASSET_KEYS.redWheeledChassis,
      blue: ASSET_KEYS.blueWheeledChassis
    }
  }
};

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

export const PROJECTILE_CONFIG: Record<
  SoldierType,
  {
    texture: string;
    scale: number;
    trajectory: ProjectileTrajectory;
    travelTimeMin: number;
    travelTimeMax: number;
    launchLift: number;
  }
> = {
  bomber: {
    texture: ASSET_KEYS.bomberShell,
    scale: 0.95,
    trajectory: 'heavy-lob',
    travelTimeMin: 1.05,
    travelTimeMax: 1.55,
    launchLift: -120
  },
  infantry: {
    texture: ASSET_KEYS.infantryShell,
    scale: 0.72,
    trajectory: 'flat-burst',
    travelTimeMin: 0.55,
    travelTimeMax: 0.9,
    launchLift: -10
  },
  sniper: {
    texture: ASSET_KEYS.sniperShell,
    scale: 0.88,
    trajectory: 'direct-shot',
    travelTimeMin: 0.35,
    travelTimeMax: 0.7,
    launchLift: 0
  },
  artillery: {
    texture: ASSET_KEYS.artilleryShell,
    scale: 1.05,
    trajectory: 'mortar-arc',
    travelTimeMin: 1.25,
    travelTimeMax: 1.8,
    launchLift: -165
  }
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
    trajectory: 'heavy-lob',
    maxHp: 150,
    suitLayer: 'bottom',
    attacksPerTurn: 1,
    description: '破甲暴击，撕开底层防线'
  },
  infantry: {
    label: '突击步兵',
    attack: 42,
    defBreak: 1,
    shellSpeed: 430,
    explosionRadius: 38,
    trajectory: 'flat-burst',
    maxHp: 115,
    suitLayer: 'middle',
    attacksPerTurn: 3,
    description: '三连发低平弹，快速压制'
  },
  sniper: {
    label: '狙击兵',
    attack: 95,
    defBreak: 1.2,
    shellSpeed: 620,
    explosionRadius: 30,
    trajectory: 'direct-shot',
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
    explosionRadius: 96,
    trajectory: 'mortar-arc',
    maxHp: 120,
    suitLayer: 'middleTop',
    attacksPerTurn: 2,
    description: '双发迫击高抛，范围压制'
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
