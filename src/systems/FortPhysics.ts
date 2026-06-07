import { COLLAPSE_RULES, CRATER_CONFIG, FORT_LAYER_CONFIG, SOLDIER_CONFIG } from '../config';
import type { CraterState, DamageReport, FortBlockState, FortLayer, FortState, SoldierType, Vec2 } from '../types';

export function getDistance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function calculateBlockDamage(type: SoldierType, block: FortBlockState): number {
  const soldier = SOLDIER_CONFIG[type];
  const layerConfig = FORT_LAYER_CONFIG[block.layer];
  let modifier = layerConfig.damageModifier;

  if (block.layer === 'bottom' && type !== 'bomber') modifier *= 0.6;
  if (block.layer === 'bottom' && type === 'bomber') modifier *= 1.5;

  return Math.max(5, Math.round((soldier.attack * soldier.defBreak - block.defense) * modifier));
}

export function getLayerDestroyedRate(fort: FortState, layer: FortLayer): number {
  const blocks = fort.blocks.filter((block) => block.layer === layer);
  if (blocks.length === 0) return 1;
  return blocks.filter((block) => block.isDestroyed).length / blocks.length;
}

export function getCollapseProbability(bottomDestroyedRate: number): number {
  if (bottomDestroyedRate < COLLAPSE_RULES.threshold) return 0;
  if (bottomDestroyedRate < COLLAPSE_RULES.low.max) return COLLAPSE_RULES.low.probability;
  if (bottomDestroyedRate < COLLAPSE_RULES.medium.max) return COLLAPSE_RULES.medium.probability;
  return COLLAPSE_RULES.high.probability;
}

export function areAllBlocksDestroyed(fort: FortState): boolean {
  return fort.blocks.every((block) => block.isDestroyed);
}

export function areAllDeployedSoldiersDead(fort: FortState): boolean {
  return fort.soldiers.length > 0 && fort.soldiers.every((soldier) => !soldier.isAlive);
}

export function isPointInsideCrater(fort: FortState, point: Vec2): boolean {
  return fort.craters.some((crater) => getDistance(crater, point) <= crater.radius);
}

export function isBlockCoveredByCrater(fort: FortState, block: FortBlockState): boolean {
  return fort.craters.some((crater) => getDistance(crater, block) <= crater.radius);
}

export function getFortCenter(fort: FortState): Vec2 {
  const aliveBlocks = fort.blocks.filter((block) => !block.isDestroyed);
  const source = aliveBlocks.length > 0 ? aliveBlocks : fort.blocks;
  const x = source.reduce((sum, block) => sum + block.x, 0) / source.length;
  const y = source.reduce((sum, block) => sum + block.y, 0) / source.length;
  return { x, y };
}

export function selectTargetBlock(fort: FortState): FortBlockState | null {
  const alive = fort.blocks.filter((block) => !block.isDestroyed && !block.isVoid && !isBlockCoveredByCrater(fort, block));
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}

export function selectExposedSoldierTarget(fort: FortState): Vec2 | null {
  const exposed = fort.soldiers.filter((soldier) => soldier.isAlive && soldier.isExposed);
  if (exposed.length === 0) return null;
  const target = exposed[Math.floor(Math.random() * exposed.length)];
  return { x: target.x, y: target.y };
}

export function findShellCollisionBlock(
  fort: FortState,
  shellPosition: Vec2,
  shellRadius: number
): FortBlockState | null {
  const candidates = fort.blocks.filter(
    (block) => !block.isDestroyed && !block.isVoid && !isBlockCoveredByCrater(fort, block)
  );

  for (const block of candidates) {
    if (circleIntersectsBlock(shellPosition, shellRadius, block)) return block;
  }

  return null;
}

export function applyExplosionDamage(
  fort: FortState,
  attackerType: SoldierType,
  impact: Vec2,
  radius: number,
  random: () => number = Math.random
): DamageReport {
  const startedInsideCrater = isPointInsideCrater(fort, impact);
  const effectiveImpact = startedInsideCrater ? getPassThroughImpact(fort, impact) : impact;
  const report: DamageReport = {
    blockHits: [],
    soldierHits: [],
    cratersCreated: [],
    effectiveImpact,
    collapsedBlocks: []
  };

  const blocksInRange = fort.blocks.filter(
    (block) =>
      !block.isDestroyed &&
      !block.isVoid &&
      !isBlockCoveredByCrater(fort, block) &&
      circleIntersectsBlock(effectiveImpact, radius, block)
  );

  for (const block of blocksInRange) {
    const damage = calculateBlockDamage(attackerType, block);
    block.hp = Math.max(0, block.hp - damage);
    if (block.hp <= 0) block.isDestroyed = true;
    if (!block.isDestroyed) {
      const damageRatio = 1 - block.hp / block.maxHp;
      block.crackLevel = Math.max(block.crackLevel, Math.max(1, Math.ceil(damageRatio * 4)));
      block.lastHitAt += 1;
    }
    report.blockHits.push({ blockId: block.id, damage, destroyed: block.isDestroyed });
  }

  if (!startedInsideCrater && blocksInRange.some((block) => block.isDestroyed)) {
    const crater = createCrater(fort, attackerType, effectiveImpact);
    report.cratersCreated.push(crater);
    voidBlocksCoveredByCrater(fort, crater, report);
  }

  updateSoldierExposure(fort);

  const collapse = tryCollapse(fort, random);
  report.collapsedBlocks.push(...collapse.collapsedBlocks);
  updateSoldierExposure(fort);

  for (const soldier of fort.soldiers) {
    if (!soldier.isAlive || !soldier.isExposed || getDistance(soldier, effectiveImpact) > radius) continue;
    const damage = calculateSoldierDamage(attackerType, getDistance(soldier, effectiveImpact), radius);
    soldier.hp = Math.max(0, soldier.hp - damage);
    if (soldier.hp <= 0) {
      soldier.isAlive = false;
      soldier.isExposed = true;
      const slot = fort.deploySlots.find((candidate) => candidate.id === soldier.slotId);
      if (slot) slot.occupantId = undefined;
    }
    report.soldierHits.push({ soldierId: soldier.id, damage, killed: !soldier.isAlive });
  }

  return report;
}

export function updateSoldierExposure(fort: FortState): void {
  for (const soldier of fort.soldiers) {
    if (!soldier.isAlive) continue;
    const nearbyDestroyed = fort.blocks.some(
      (block) =>
        block.layer === soldier.layer &&
        (block.isDestroyed || block.isVoid || isBlockCoveredByCrater(fort, block)) &&
        Math.abs(block.x - soldier.x) <= block.width * 1.4 &&
        Math.abs(block.y - soldier.y) <= block.height * 1.6
    );
    soldier.isExposed = nearbyDestroyed;
  }
}

export function calculateSoldierDamage(type: SoldierType, distanceFromImpact = 0, radius = 1): number {
  const config = SOLDIER_CONFIG[type];
  const falloff = Math.max(0.45, 1 - distanceFromImpact / Math.max(radius, 1) * 0.45);
  const typeModifier = type === 'sniper' ? 1.2 : type === 'artillery' ? 0.85 : 1;
  return Math.max(8, Math.round(config.attack * falloff * typeModifier));
}

function getPassThroughImpact(fort: FortState, impact: Vec2): Vec2 {
  const exposedSoldiers = fort.soldiers.filter((soldier) => soldier.isAlive && soldier.isExposed);
  const nearestSoldier = getNearest(exposedSoldiers, impact);
  if (nearestSoldier) return { x: nearestSoldier.x, y: nearestSoldier.y };

  const openBlocks = fort.blocks.filter((block) => !block.isDestroyed && !block.isVoid && !isBlockCoveredByCrater(fort, block));
  const nearestBlock = getNearest(openBlocks, impact);
  if (nearestBlock) return { x: nearestBlock.x, y: nearestBlock.y };

  return getFortCenter(fort);
}

function getNearest<T extends Vec2>(items: T[], point: Vec2): T | null {
  if (items.length === 0) return null;
  return items.reduce((nearest, item) => (getDistance(item, point) < getDistance(nearest, point) ? item : nearest));
}

function createCrater(fort: FortState, createdBy: SoldierType, point: Vec2): CraterState {
  const radius = PhaserMathClamp(
    SOLDIER_CONFIG[createdBy].explosionRadius * CRATER_CONFIG.radiusScaleBySoldier[createdBy],
    CRATER_CONFIG.minRadius,
    CRATER_CONFIG.maxRadius
  );
  const crater: CraterState = {
    id: `${fort.team}-crater-${fort.craters.length + 1}`,
    x: point.x,
    y: point.y,
    radius,
    createdBy
  };
  fort.craters.push(crater);
  return crater;
}

function voidBlocksCoveredByCrater(fort: FortState, crater: CraterState, report: DamageReport): void {
  for (const block of fort.blocks) {
    if (block.isVoid || getDistance(crater, block) > crater.radius) continue;
    const damage = block.hp;
    block.hp = 0;
    block.isDestroyed = true;
    block.isVoid = true;
    const existingHit = report.blockHits.find((hit) => hit.blockId === block.id);
    if (existingHit) {
      existingHit.destroyed = true;
      existingHit.voided = true;
    } else {
      report.blockHits.push({ blockId: block.id, damage, destroyed: true, voided: true });
    }
  }
}

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function circleIntersectsBlock(circle: Vec2, radius: number, block: FortBlockState): boolean {
  const halfWidth = block.width / 2;
  const halfHeight = block.height / 2;
  const closestX = PhaserMathClamp(circle.x, block.x - halfWidth, block.x + halfWidth);
  const closestY = PhaserMathClamp(circle.y, block.y - halfHeight, block.y + halfHeight);
  return getDistance(circle, { x: closestX, y: closestY }) <= radius;
}

export function tryCollapse(
  fort: FortState,
  random: () => number = Math.random
): Pick<DamageReport, 'collapsedBlocks'> {
  if (fort.collapseTriggered) return { collapsedBlocks: [] };

  const rate = getLayerDestroyedRate(fort, 'bottom');
  const probability = getCollapseProbability(rate);
  if (probability <= 0 || random() > probability) return { collapsedBlocks: [] };

  const candidates = fort.blocks.filter(
    (block) => !block.isDestroyed && (block.layer === 'middle' || block.layer === 'top')
  );
  if (candidates.length === 0) return { collapsedBlocks: [] };

  fort.collapseTriggered = true;

  const destroyCount = Math.min(
    candidates.length,
    randomInt(COLLAPSE_RULES.minBlocks, COLLAPSE_RULES.maxBlocks, random)
  );
  const shuffled = [...candidates].sort(() => random() - 0.5);
  const collapsed = shuffled.slice(0, destroyCount);
  for (const block of collapsed) {
    block.hp = 0;
    block.isDestroyed = true;
  }

  return { collapsedBlocks: collapsed.map((block) => block.id) };
}

function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
