import Phaser from 'phaser';
import { ASSET_KEYS, DEPLOY_LAYOUT, FORT_LAYER_CONFIG, TURN_CONFIG } from '../config';
import { canDeploySoldier } from '../systems/SoldierDeploy';
import { createFortBlockState, FortBlock } from './FortBlock';
import { Soldier } from './Soldier';
import type { CraterState, DeploySlot, FortLayer, FortState, SoldierState, SoldierType, Team, Vec2 } from '../types';

const LAYERS: FortLayer[] = ['bottom', 'middle', 'top'];

export class MilitaryFort {
  state: FortState;
  blocks: FortBlock[] = [];
  soldierViews = new Map<string, Soldier>();
  core: Phaser.GameObjects.Sprite;
  coreText: Phaser.GameObjects.Text;
  slotViews: Phaser.GameObjects.Arc[];
  interiorViews: Phaser.GameObjects.Rectangle[] = [];
  craterViews = new Map<string, Phaser.GameObjects.Graphics>();

  constructor(private scene: Phaser.Scene, team: Team, origin: Vec2) {
    this.state = {
      team,
      coreHp: TURN_CONFIG.initialCoreHp,
      maxCoreHp: TURN_CONFIG.initialCoreHp,
      blocks: [],
      deploySlots: [],
      soldiers: [],
      craters: [],
      collapseTriggered: false
    };

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

  syncVisuals(selectedType?: SoldierType): void {
    this.syncCraters();
    for (const block of this.blocks) block.syncVisual();
    this.core.setAlpha(0.55 + (this.state.coreHp / this.state.maxCoreHp) * 0.45);
    this.syncSoldiers();

    for (const slotView of this.slotViews) {
      const slot = this.state.deploySlots.find((candidate) => candidate.id === slotView.name);
      if (!slot) continue;
      const legal = selectedType ? canDeploySoldier(this.state, selectedType, slot.id) : false;
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

  private syncSoldiers(): void {
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
      this.soldierViews.get(soldier.id)?.syncVisual();
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

  private syncCraters(): void {
    const activeIds = new Set(this.state.craters.map((crater) => crater.id));
    for (const [id, view] of this.craterViews) {
      if (!activeIds.has(id)) {
        view.destroy();
        this.craterViews.delete(id);
      }
    }

    for (const crater of this.state.craters) {
      if (!this.craterViews.has(crater.id)) {
        const view = this.scene.add.graphics();
        view.setDepth(1.6);
        drawCrater(view, crater);
        this.craterViews.set(crater.id, view);
      }
    }
  }
}

function drawCrater(graphics: Phaser.GameObjects.Graphics, crater: CraterState): void {
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18;
    const wobble = 0.82 + Math.sin(i * 2.17 + crater.radius * 0.31) * 0.12 + Math.cos(i * 1.41) * 0.08;
    points.push(
      new Phaser.Math.Vector2(
        crater.x + Math.cos(angle) * crater.radius * wobble,
        crater.y + Math.sin(angle) * crater.radius * wobble
      )
    );
  }

  graphics.clear();
  graphics.fillStyle(0x030303, 0.98);
  graphics.fillPoints(points, true, true);
  graphics.lineStyle(5, 0x0b0805, 0.95);
  graphics.strokePoints(points, true, true);
  graphics.lineStyle(2, 0x4c2c18, 0.75);
  graphics.strokeCircle(crater.x, crater.y, crater.radius * 0.9);
  graphics.fillStyle(0x15100a, 0.65);
  graphics.fillCircle(crater.x - crater.radius * 0.22, crater.y + crater.radius * 0.12, crater.radius * 0.35);
}
