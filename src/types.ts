export type Team = 'red' | 'blue';
export type FortLayer = 'bottom' | 'middle' | 'top';
export type SoldierType = 'bomber' | 'infantry' | 'sniper' | 'artillery';
export type BattlePhase = 'READY' | 'DEPLOY' | 'ATTACK' | 'SETTLE' | 'GAMEOVER';

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
}

export interface SoldierConfig {
  label: string;
  attack: number;
  defBreak: number;
  shellSpeed: number;
  explosionRadius: number;
  maxHp: number;
  suitLayer: FortLayer | 'all' | 'middleTop';
  attacksPerTurn: number;
  description: string;
}

export interface FortState {
  team: Team;
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
