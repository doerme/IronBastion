import { SOLDIER_CONFIG, TURN_CONFIG } from '../config';
import type { FortLayer, FortState, SoldierType } from '../types';

export function canDeployToLayer(type: SoldierType, layer: FortLayer): boolean {
  const suitLayer = SOLDIER_CONFIG[type].suitLayer;
  if (suitLayer === 'all') return true;
  if (suitLayer === 'middleTop') return layer === 'middle' || layer === 'top';
  return suitLayer === layer;
}

export function canDeploySoldier(fort: FortState, type: SoldierType, slotId: string): boolean {
  if (fort.soldiers.length >= TURN_CONFIG.maxSoldiersPerFort) return false;
  const slot = fort.deploySlots.find((candidate) => candidate.id === slotId);
  if (!slot || slot.occupantId) return false;
  return canDeployToLayer(type, slot.layer);
}

export function assignSoldierToSlot(fort: FortState, type: SoldierType, slotId: string): boolean {
  if (!canDeploySoldier(fort, type, slotId)) return false;

  const slot = fort.deploySlots.find((candidate) => candidate.id === slotId);
  if (!slot) return false;
  const config = SOLDIER_CONFIG[type];

  const soldier = {
    id: `${fort.team}-${type}-${fort.soldiers.length + 1}-${Date.now()}`,
    team: fort.team,
    type,
    layer: slot.layer,
    slotId: slot.id,
    hp: config.maxHp,
    maxHp: config.maxHp,
    isAlive: true,
    isExposed: false,
    visualState: 'deploy' as const,
    x: slot.x,
    y: slot.y
  };

  fort.soldiers.push(soldier);
  slot.occupantId = soldier.id;
  return true;
}
