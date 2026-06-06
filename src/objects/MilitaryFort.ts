import Phaser from 'phaser';
import { ASSET_KEYS, CHASSIS_CONFIG, DEFAULT_CHASSIS_TYPE, DEPLOY_LAYOUT, FORT_LAYER_CONFIG, TURN_CONFIG } from '../config';
import { canDeploySoldier } from '../systems/SoldierDeploy';
import { createFortBlockState, FortBlock } from './FortBlock';
import { Soldier } from './Soldier';
import type { ChassisType, DeploySlot, FortLayer, FortState, SoldierType, Team, Vec2 } from '../types';

const LAYERS: FortLayer[] = ['bottom', 'middle', 'top'];

export class MilitaryFort {
  state: FortState;
  blocks: FortBlock[] = [];
  soldierViews = new Map<string, Soldier>();
  chassis: Phaser.GameObjects.Sprite;
  core: Phaser.GameObjects.Sprite;
  coreText: Phaser.GameObjects.Text;
  slotViews: Phaser.GameObjects.Arc[];
  interiorViews: Phaser.GameObjects.Rectangle[] = [];

  constructor(
    private scene: Phaser.Scene,
    team: Team,
    origin: Vec2,
    options: { groundY?: number; chassisType?: ChassisType } = {}
  ) {
    const chassisType = options.chassisType ?? DEFAULT_CHASSIS_TYPE;
    this.state = {
      team,
      chassisType,
      coreHp: TURN_CONFIG.initialCoreHp,
      maxCoreHp: TURN_CONFIG.initialCoreHp,
      blocks: [],
      deploySlots: [],
      soldiers: [],
      craters: [],
      collapseTriggered: false
    };

    this.chassis = this.createChassis(origin, options.groundY ?? origin.y + 53, chassisType);
    this.createBlocks(origin);
    this.createInteriorViews();
    this.createDeploySlots(origin);
    const coreKey = team === 'red' ? ASSET_KEYS.redCore : ASSET_KEYS.blueCore;
    this.core = scene.add.sprite(origin.x, origin.y - 74, coreKey);
    this.core.setDepth(3.5);
    this.coreText = scene.add.text(origin.x, origin.y - 35, '核心', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#f7edcf',
      stroke: '#111',
      strokeThickness: 3
    });
    this.coreText.setOrigin(0.5);
    this.coreText.setDepth(4);
    this.slotViews = this.createSlotViews();
  }

  syncVisuals(selectedType?: SoldierType, showInterior = false, showDeployHints = Boolean(selectedType)): void {
    for (const block of this.blocks) block.syncVisual(showInterior);
    this.core.setAlpha(showInterior ? 0.34 : 0.55 + (this.state.coreHp / this.state.maxCoreHp) * 0.45);
    this.coreText.setAlpha(showInterior ? 0.45 : 1);
    this.syncSoldiers(showInterior);

    for (const slotView of this.slotViews) {
      const slot = this.state.deploySlots.find((candidate) => candidate.id === slotView.name);
      if (!slot) continue;
      const legal = selectedType && showDeployHints ? canDeploySoldier(this.state, selectedType, slot.id) : false;
      slotView.setFillStyle(legal ? 0xf3d36b : 0x1b211a, legal ? 0.8 : 0.45);
      slotView.setStrokeStyle(2, legal ? 0xfff2a4 : 0x566052, legal ? 0.9 : 0.6);
      slotView.setAlpha(slot.occupantId ? 0.25 : 1);
    }
  }

  findSlotAt(x: number, y: number): DeploySlot | undefined {
    return this.state.deploySlots.find((slot) => Phaser.Math.Distance.Between(x, y, slot.x, slot.y) <= 22);
  }

  getCorePosition(): Vec2 {
    return { x: this.core.x, y: this.core.y };
  }

  getBlockView(blockId: string): FortBlock | undefined {
    return this.blocks.find((block) => block.state.id === blockId);
  }

  private createBlocks(origin: Vec2): void {
    const layerY: Record<FortLayer, number> = {
      bottom: origin.y,
      middle: origin.y - 42,
      top: origin.y - 82
    };

    for (const layer of LAYERS) {
      const config = FORT_LAYER_CONFIG[layer];
      const columns = layer === 'bottom' ? 6 : layer === 'middle' ? 5 : 4;
      const rows = Math.ceil(config.count / columns);
      const startX = origin.x - ((columns - 1) * 36) / 2;

      for (let i = 0; i < config.count; i += 1) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = startX + col * 36;
        const y = layerY[layer] - row * 30;
        const blockState = createFortBlockState(`${this.state.team}-${layer}-${i}`, x, y, layer);
        this.state.blocks.push(blockState);
        this.blocks.push(new FortBlock(this.scene, blockState, this.state.team));
      }
    }
  }

  private createDeploySlots(origin: Vec2): void {
    const yByLayer: Record<FortLayer, number> = {
      bottom: origin.y - 18,
      middle: origin.y - 64,
      top: origin.y - 107
    };

    for (const layer of LAYERS) {
      const count = DEPLOY_LAYOUT[layer];
      for (let i = 0; i < count; i += 1) {
        const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 70;
        this.state.deploySlots.push({
          id: `${this.state.team}-slot-${layer}-${i}`,
          layer,
          x: origin.x + spread,
          y: yByLayer[layer]
        });
      }
    }
  }

  private createSlotViews(): Phaser.GameObjects.Arc[] {
    return this.state.deploySlots.map((slot) => {
      const view = this.scene.add.circle(slot.x, slot.y, 18, 0x1b211a, 0.45);
      view.name = slot.id;
      view.setStrokeStyle(2, 0x566052, 0.6);
      view.setDepth(5);
      return view;
    });
  }

  private syncSoldiers(showInterior = false): void {
    const activeIds = new Set(this.state.soldiers.filter((soldier) => soldier.isAlive).map((soldier) => soldier.id));
    for (const [id, view] of this.soldierViews) {
      if (!activeIds.has(id)) {
        view.destroy();
        this.soldierViews.delete(id);
      }
    }

    for (const soldier of this.state.soldiers) {
      if (!soldier.isAlive) continue;
      if (!this.soldierViews.has(soldier.id)) {
        this.soldierViews.set(soldier.id, new Soldier(this.scene, soldier));
      }
      this.soldierViews.get(soldier.id)?.syncVisual(showInterior);
    }
  }

  private createInteriorViews(): void {
    for (const block of this.state.blocks) {
      const fill = block.layer === 'bottom' ? 0x25231c : block.layer === 'middle' ? 0x222820 : 0x1c241f;
      const view = this.scene.add.rectangle(block.x, block.y, block.width + 2, block.height + 2, fill, 0.95);
      view.setStrokeStyle(1, 0x070807, 0.5);
      view.setDepth(1);
      this.interiorViews.push(view);
    }
  }

  private createChassis(origin: Vec2, groundY: number, chassisType: ChassisType): Phaser.GameObjects.Sprite {
    const config = CHASSIS_CONFIG[chassisType];
    const textureHeight = config.bodyHeight + config.wheelRadius * 2 + config.groundClearance + 10;
    const chassis = this.scene.add.sprite(origin.x, groundY - textureHeight / 2 + 1, config.textureByTeam[this.state.team]);
    chassis.setDepth(1.45);
    return chassis;
  }

}
