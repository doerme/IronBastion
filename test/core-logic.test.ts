import { describe, expect, it } from 'vitest';
import {
  ACTIVE_THEME_ID,
  AUDIO_CONFIG,
  CHASSIS_CONFIG,
  DEFAULT_CHASSIS_TYPE,
  FORT_LAYER_CONFIG,
  PROJECTILE_CONFIG,
  SOLDIER_CONFIG,
  THEME_CONFIG,
  TURN_CONFIG
} from '../src/config';
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

describe('Projectile identity rules', () => {
  it('gives each soldier type a distinct projectile rhythm and trajectory', () => {
    expect(SOLDIER_CONFIG.bomber.attacksPerTurn).toBe(1);
    expect(SOLDIER_CONFIG.infantry.attacksPerTurn).toBe(3);
    expect(SOLDIER_CONFIG.sniper.attacksPerTurn).toBe(1);
    expect(SOLDIER_CONFIG.artillery.attacksPerTurn).toBe(2);

    expect(PROJECTILE_CONFIG.bomber.trajectory).toBe('heavy-lob');
    expect(PROJECTILE_CONFIG.infantry.trajectory).toBe('flat-burst');
    expect(PROJECTILE_CONFIG.sniper.trajectory).toBe('direct-shot');
    expect(PROJECTILE_CONFIG.artillery.trajectory).toBe('mortar-arc');
  });
});

describe('Battle audio configuration', () => {
  it('defines background music plus shot and explosion profiles for every soldier type', () => {
    expect(AUDIO_CONFIG.bgmBassNotes.length).toBeGreaterThanOrEqual(4);
    expect(AUDIO_CONFIG.bgmHornNotes.length).toBeGreaterThanOrEqual(4);
    expect(AUDIO_CONFIG.bgmPadFrequency).toBeGreaterThan(0);

    for (const type of ['bomber', 'infantry', 'sniper', 'artillery'] as const) {
      expect(AUDIO_CONFIG.shotBySoldier[type].frequency).toBeGreaterThan(0);
      expect(AUDIO_CONFIG.shotBySoldier[type].frequency).toBeLessThanOrEqual(260);
      expect(AUDIO_CONFIG.shotBySoldier[type].duration).toBeGreaterThan(0);
      expect(AUDIO_CONFIG.explosionBySoldier[type].frequency).toBeGreaterThan(0);
      expect(AUDIO_CONFIG.explosionBySoldier[type].duration).toBeGreaterThan(0);
    }
  });
});

describe('Theme and chassis configuration', () => {
  it('provides a layered grassland battlefield theme', () => {
    const theme = THEME_CONFIG[ACTIVE_THEME_ID];

    expect(theme.id).toBe('grassland');
    expect(theme.groundY).toBeGreaterThan(380);
    expect(theme.groundY).toBeLessThan(460);
    expect(Object.keys(theme.layerKeys).sort()).toEqual(['clouds', 'far', 'ground', 'near', 'sky']);
    expect(theme.layerKeys.sky).toContain('grassland');
    expect(theme.layerKeys.ground).toContain('ground');
  });

  it('defines a swappable wheeled chassis for both teams', () => {
    const chassis = CHASSIS_CONFIG[DEFAULT_CHASSIS_TYPE];

    expect(chassis.type).toBe('wheeled-armored');
    expect(chassis.wheelCount).toBeGreaterThanOrEqual(4);
    expect(chassis.wheelRadius).toBeGreaterThan(0);
    expect(chassis.textureByTeam.red).toContain('red');
    expect(chassis.textureByTeam.blue).toContain('blue');
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

  it('marks visible cracks when a block is hit but not destroyed', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'armored-block')];
    fort.blocks[0].x = 0;
    fort.blocks[0].y = 0;

    const report = applyExplosionDamage(fort, 'infantry', { x: 0, y: 0 }, 80, () => 1);

    expect(report.blockHits.length).toBeGreaterThan(0);
    expect(fort.blocks[0].isDestroyed).toBe(false);
    expect(fort.blocks[0].crackLevel).toBeGreaterThan(0);
    expect(fort.blocks[0].lastHitAt).toBeGreaterThan(0);
  });

  it('damages and cracks a block when the explosion overlaps its edge', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'edge-hit-block')];
    fort.blocks[0].x = 42;
    fort.blocks[0].y = 0;

    const report = applyExplosionDamage(fort, 'sniper', { x: 0, y: 0 }, 30, () => 1);

    expect(report.blockHits).toHaveLength(1);
    expect(report.blockHits[0].blockId).toBe('edge-hit-block');
    expect(fort.blocks[0].crackLevel).toBeGreaterThan(0);
    expect(fort.blocks[0].lastHitAt).toBeGreaterThan(0);
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
      isExposed: false,
      visualState: 'idle'
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

    const report = applyExplosionDamage(fort, 'bomber', { x: 0, y: 0 }, 80, () => 1);
    expect(report.soldierHits.length).toBe(1);
    expect(fort.soldiers[0].hp).toBeLessThan(80);
  });
});

describe('Crater pass-through rules', () => {
  it('creates a black crater and voids covered fortress blocks', () => {
    const fort = createFort('blue');
    fort.blocks = [block('bottom', 'covered-block')];

    const report = applyExplosionDamage(fort, 'bomber', { x: 0, y: 0 }, 80, () => 1);

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

    applyExplosionDamage(fort, 'bomber', { x: 0, y: 0 }, 80, () => 1);
    const craterCount = fort.craters.length;
    const repeat = applyExplosionDamage(fort, 'bomber', { x: 0, y: 0 }, 80, () => 1);

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
    expect(fort.collapseTriggered).toBe(true);
  });
});

describe('Victory rules', () => {
  it('does not end the battle just because fortress blocks are destroyed', () => {
    const system = new TurnBattleSystem();
    const red = createFort('red');
    const blue = createFort('blue');
    for (const blockState of blue.blocks) {
      blockState.isDestroyed = true;
      blockState.hp = 0;
    }

    expect(system.getWinner(red, blue)).toEqual({ winner: null, reason: '' });
  });

  it('uses surviving soldiers after twelve rounds', () => {
    const system = new TurnBattleSystem();
    const red = createFort('red');
    const blue = createFort('blue');
    red.soldiers.push(aliveSoldier('red', 'red-1'));
    red.soldiers.push(aliveSoldier('red', 'red-2'));
    blue.soldiers.push(aliveSoldier('blue', 'blue-1'));
    system.round = TURN_CONFIG.maxRounds + 1;

    expect(system.getWinner(red, blue)).toEqual({ winner: 'red', reason: '十二回合后红方存活单位更多' });
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
      isExposed: true,
      visualState: 'idle'
    });

    expect(areAllDeployedSoldiersDead(createFort('red'))).toBe(false);
    expect(system.getWinner(red, blue)).toEqual({ winner: 'red', reason: '蓝方作战单位全灭' });
  });
});

function createFort(team: Team): FortState {
  const layers: FortLayer[] = ['bottom', 'middle', 'top'];
  return {
    team,
    chassisType: DEFAULT_CHASSIS_TYPE,
    collapseTriggered: false,
    deploySlots: [],
    soldiers: [],
    craters: [],
    blocks: layers.flatMap((layer) =>
      Array.from({ length: FORT_LAYER_CONFIG[layer].count }, (_, index) => block(layer, `${team}-${layer}-${index}`))
    )
  };
}

function aliveSoldier(team: Team, id: string) {
  return {
    id,
    team,
    type: 'infantry' as const,
    layer: 'middle' as const,
    slotId: `${id}-slot`,
    x: 0,
    y: 0,
    hp: 80,
    maxHp: 80,
    isAlive: true,
    isExposed: false,
    visualState: 'idle' as const
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
    crackLevel: 0,
    lastHitAt: 0,
    canBearWeight: config.canBearWeight,
    width: config.blockWidth,
    height: config.blockHeight
  };
}
