import { describe, expect, it } from 'vitest';
import { FORT_LAYER_CONFIG, TURN_CONFIG } from '../src/config';
import type { FortBlockState, FortLayer, FortState, Team } from '../src/types';
import { canDeployToLayer } from '../src/systems/SoldierDeploy';
import {
  applyExplosionDamage,
  calculateBlockDamage,
  areAllDeployedSoldiersDead,
  findShellCollisionBlock,
  getCollapseProbability,
  getLayerDestroyedRate,
  isPointInsideCrater,
  selectTargetBlock,
  tryCollapse,
  updateSoldierExposure
} from '../src/systems/FortPhysics';
import { TurnBattleSystem } from '../src/systems/TurnBattleSystem';

describe('Soldier deployment rules', () => {
  it('limits soldiers to their planned fortress layers', () => {
    expect(canDeployToLayer('bomber', 'bottom')).toBe(true);
    expect(canDeployToLayer('bomber', 'middle')).toBe(false);
    expect(canDeployToLayer('infantry', 'middle')).toBe(true);
    expect(canDeployToLayer('sniper', 'top')).toBe(true);
    expect(canDeployToLayer('artillery', 'middle')).toBe(true);
    expect(canDeployToLayer('artillery', 'top')).toBe(true);
    expect(canDeployToLayer('artillery', 'bottom')).toBe(false);
  });
});

describe('Fort damage math', () => {
  it('applies armor, layer modifiers, and minimum damage', () => {
    const bottom = block('bottom');
    const top = block('top');

    expect(calculateBlockDamage('infantry', bottom)).toBe(5);
    expect(calculateBlockDamage('bomber', bottom)).toBe(123);
    expect(calculateBlockDamage('artillery', top)).toBe(90);
  });

  it('only damages soldiers after cover has been destroyed and they are exposed', () => {
    const fort = createFort('blue');
    for (const blockState of fort.blocks) {
      blockState.x = 200;
      blockState.y = 200;
    }
    fort.deploySlots.push({ id: 'slot-1', layer: 'bottom', x: 0, y: 0, occupantId: 'soldier-1' });
    fort.soldiers.push({
      id: 'soldier-1',
      team: 'blue',
      type: 'infantry',
      layer: 'bottom',
      slotId: 'slot-1',
      x: 0,
      y: 0,
      hp: 80,
      maxHp: 80,
      isAlive: true,
      isExposed: false
    });

    applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 80, () => 1);
    expect(fort.soldiers[0].hp).toBe(80);

    const cover = fort.blocks.find((candidate) => candidate.layer === 'bottom');
    expect(cover).toBeDefined();
    cover!.x = 0;
    cover!.y = 0;
    cover!.isDestroyed = true;
    cover!.hp = 0;
    updateSoldierExposure(fort);

    const report = applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 80, () => 1);
    expect(report.soldierHits.length).toBe(1);
    expect(fort.soldiers[0].hp).toBeLessThan(80);
  });
});

describe('Crater pass-through rules', () => {
  it('creates a black crater and voids covered fortress blocks', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'covered-block')];

    const report = applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 80, () => 1);

    expect(report.cratersCreated.length).toBe(1);
    expect(fort.craters.length).toBe(1);
    expect(isPointInsideCrater(fort, { x: 0, y: 0 })).toBe(true);
    expect(fort.blocks[0].isVoid).toBe(true);
    expect(fort.blocks[0].isDestroyed).toBe(true);
  });

  it('does not return crater-covered blocks as future targets', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'covered-block'), block('bottom', 'open-block')];
    fort.blocks[1].x = 120;
    fort.craters.push({ id: 'test-crater', x: 0, y: 0, radius: 48, createdBy: 'bomber' });

    expect(selectTargetBlock(fort)?.id).toBe('open-block');
  });

  it('does not damage the same crater-covered empty area again', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'single-block')];

    applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 80, () => 1);
    const craterCount = fort.craters.length;
    const repeat = applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 80, () => 1);

    expect(fort.craters.length).toBe(craterCount);
    expect(repeat.blockHits.length).toBe(0);
  });

  it('detects shell collision only against solid fortress blocks', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'solid-block'), block('bottom', 'void-block'), block('bottom', 'crater-block')];
    fort.blocks[0].x = 0;
    fort.blocks[1].x = 80;
    fort.blocks[1].isVoid = true;
    fort.blocks[2].x = 160;
    fort.craters.push({ id: 'test-crater', x: 160, y: 0, radius: 40, createdBy: 'bomber' });

    expect(findShellCollisionBlock(fort, { x: 0, y: 0 }, 18)?.id).toBe('solid-block');
    expect(findShellCollisionBlock(fort, { x: 80, y: 0 }, 18)).toBeNull();
    expect(findShellCollisionBlock(fort, { x: 160, y: 0 }, 18)).toBeNull();
  });
});

describe('Collapse rules', () => {
  it('reports the configured probability bands', () => {
    expect(getCollapseProbability(0.59)).toBe(0);
    expect(getCollapseProbability(0.6)).toBe(0.35);
    expect(getCollapseProbability(0.72)).toBe(0.65);
    expect(getCollapseProbability(0.86)).toBe(1);
  });

  it('collapses upper blocks after bottom destruction crosses the threshold', () => {
    const fort = createFort('blue');
    for (const blockState of fort.blocks.filter((candidate) => candidate.layer === 'bottom').slice(0, 8)) {
      blockState.isDestroyed = true;
      blockState.hp = 0;
    }

    expect(getLayerDestroyedRate(fort, 'bottom')).toBeCloseTo(8 / 12);

    const randomValues = [0.1, 0.4, 0.5, 0.6, 0.7];
    const report = tryCollapse(fort, () => randomValues.shift() ?? 0.1);

    expect(report.collapsedBlocks.length).toBeGreaterThanOrEqual(2);
    expect(report.collapsedBlocks.length).toBeLessThanOrEqual(4);
    expect(report.coreDamage).toBeGreaterThanOrEqual(40);
    expect(report.coreDamage).toBeLessThanOrEqual(120);
    expect(fort.collapseTriggered).toBe(true);
  });
});

describe('Victory rules', () => {
  it('ends the battle when a core reaches zero', () => {
    const system = new TurnBattleSystem();
    const red = createFort('red');
    const blue = createFort('blue');
    blue.coreHp = 0;

    expect(system.getWinner(red, blue)).toEqual({ winner: 'red', reason: '蓝方堡垒失守' });
  });

  it('uses remaining core hp after twelve rounds', () => {
    const system = new TurnBattleSystem();
    const red = createFort('red');
    const blue = createFort('blue');
    red.coreHp = 620;
    blue.coreHp = 540;
    system.round = TURN_CONFIG.maxRounds + 1;

    expect(system.getWinner(red, blue).winner).toBe('red');
  });

  it('ends the battle when all deployed soldiers are dead', () => {
    const system = new TurnBattleSystem();
    const red = createFort('red');
    const blue = createFort('blue');
    blue.soldiers.push({
      id: 'blue-dead',
      team: 'blue',
      type: 'sniper',
      layer: 'top',
      slotId: 'blue-slot',
      x: 0,
      y: 0,
      hp: 0,
      maxHp: 85,
      isAlive: false,
      isExposed: true
    });

    expect(areAllDeployedSoldiersDead(createFort('red'))).toBe(false);
    expect(system.getWinner(red, blue)).toEqual({ winner: 'red', reason: '蓝方作战单位全灭' });
  });
});

function createFort(team: Team): FortState {
  const layers: FortLayer[] = ['bottom', 'middle', 'top'];
  return {
    team,
    coreHp: TURN_CONFIG.initialCoreHp,
    maxCoreHp: TURN_CONFIG.initialCoreHp,
    collapseTriggered: false,
    deploySlots: [],
    soldiers: [],
    craters: [],
    blocks: layers.flatMap((layer) =>
      Array.from({ length: FORT_LAYER_CONFIG[layer].count }, (_, index) => block(layer, `${team}-${layer}-${index}`))
    )
  };
}

function block(layer: FortLayer, id = `${layer}-block`): FortBlockState {
  const config = FORT_LAYER_CONFIG[layer];
  return {
    id,
    layer,
    x: 0,
    y: 0,
    hp: config.hp,
    maxHp: config.hp,
    defense: config.defense,
    isDestroyed: false,
    isVoid: false,
    canBearWeight: config.canBearWeight,
    width: config.blockWidth,
    height: config.blockHeight
  };
}
