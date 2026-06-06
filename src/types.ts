export type Team = 'red' | 'blue';
export type FortLayer = 'bottom' | 'middle' | 'top';
export type SoldierType = 'bomber' | 'infantry' | 'sniper' | 'artillery';
export type SoldierVisualState = 'idle' | 'deploy' | 'attack';
export type ProjectileTrajectory = 'heavy-lob' | 'flat-burst' | 'direct-shot' | 'mortar-arc';
export type BattlePhase = 'READY' | 'DEPLOY' | 'ATTACK' | 'SETTLE' | 'GAMEOVER';
export type ThemeId = 'grassland';
export type ThemeVisualLayer = 'sky' | 'clouds' | 'far' | 'near' | 'ground';
export type ChassisType = 'wheeled-armored';

export interface Vec2 {
  x: number;
  y: number;
}

export interface FortBlockState extends Vec2 {
  id: string;
  hp: number;
  maxHp: number;
  defense: number;
  layer: FortLayer;
  isDestroyed: boolean;
  isVoid: boolean;
  crackLevel: number;
  lastHitAt: number;
  canBearWeight: boolean;
  width: number;
  height: number;
}

export interface CraterState extends Vec2 {
  id: string;
  radius: number;
  createdBy: SoldierType;
}

export interface DeploySlot extends Vec2 {
  id: string;
  layer: FortLayer;
  occupantId?: string;
}

export interface SoldierState extends Vec2 {
  id: string;
  team: Team;
  type: SoldierType;
  layer: FortLayer;
  slotId: string;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  isExposed: boolean;
  visualState: SoldierVisualState;
}

export interface SoldierConfig {
  label: string;
  attack: number;
  defBreak: number;
  shellSpeed: number;
  explosionRadius: number;
  trajectory: ProjectileTrajectory;
  maxHp: number;
  suitLayer: FortLayer | 'all' | 'middleTop';
  attacksPerTurn: number;
  description: string;
}

export interface BattleThemeConfig {
  id: ThemeId;
  label: string;
  groundY: number;
  layerKeys: Record<ThemeVisualLayer, string>;
}

export interface ChassisConfig {
  type: ChassisType;
  label: string;
  width: number;
  bodyHeight: number;
  wheelCount: number;
  wheelRadius: number;
  groundClearance: number;
  textureByTeam: Record<Team, string>;
}

export interface FortState {
  team: Team;
  chassisType: ChassisType;
  coreHp: number;
  maxCoreHp: number;
  blocks: FortBlockState[];
  deploySlots: DeploySlot[];
  soldiers: SoldierState[];
  craters: CraterState[];
  collapseTriggered: boolean;
}

export interface DamageReport {
  blockHits: Array<{ blockId: string; damage: number; destroyed: boolean; voided?: boolean }>;
  soldierHits: Array<{ soldierId: string; damage: number; killed: boolean }>;
  cratersCreated: CraterState[];
  effectiveImpact: Vec2;
  coreDamage: number;
  collapsedBlocks: string[];
}

export interface WinnerReport {
  winner: Team | 'draw' | null;
  reason: string;
}
