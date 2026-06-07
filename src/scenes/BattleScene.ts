import Phaser from 'phaser';
import { createMilitaryTextures } from '../assets/createMilitaryTextures';
import {
  ACTIVE_THEME_ID,
  ASSET_KEYS,
  GAME_HEIGHT,
  GAME_WIDTH,
  PHYSICS_CONFIG,
  SOLDIER_CONFIG,
  THEME_CONFIG,
  TURN_CONFIG
} from '../config';
import { MilitaryFort } from '../objects/MilitaryFort';
import { ActiveShell, launchShell } from '../objects/ArtilleryShell';
import {
  applyExplosionDamage,
  findShellCollisionBlock,
  getFortCenter,
  selectExposedSoldierTarget,
  selectTargetBlock,
  updateSoldierExposure
} from '../systems/FortPhysics';
import { assignSoldierToSlot, canDeploySoldier } from '../systems/SoldierDeploy';
import { BattleAudio } from '../systems/BattleAudio';
import { TurnBattleSystem } from '../systems/TurnBattleSystem';
import type { BattleThemeConfig, SoldierState, SoldierType, Team, Vec2, WinnerReport } from '../types';

interface AttackTask {
  soldier: SoldierState;
  targetFort: MilitaryFort;
  target: Vec2;
}

const SOLDIER_TYPES: SoldierType[] = ['bomber', 'infantry', 'sniper', 'artillery'];
const PHASE_LABELS = {
  READY: '备战',
  DEPLOY: '阵地部署',
  ATTACK: '炮火打击',
  SETTLE: '战场结算',
  GAMEOVER: '战局结束'
} as const;
const UI_DEPTH = 20;

export class BattleScene extends Phaser.Scene {
  private turnSystem = new TurnBattleSystem();
  private redFort!: MilitaryFort;
  private blueFort!: MilitaryFort;
  private selectedType: SoldierType = 'bomber';
  private activeShell?: ActiveShell;
  private attackQueue: AttackTask[] = [];
  private cardRects: Phaser.GameObjects.Rectangle[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private fireButton!: Phaser.GameObjects.Rectangle;
  private fireButtonText!: Phaser.GameObjects.Text;
  private gameOverPanel?: Phaser.GameObjects.Container;
  private battleAudio!: BattleAudio;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    createMilitaryTextures(this);
    const theme = THEME_CONFIG[ACTIVE_THEME_ID];
    this.createThemeLayers(theme);
    this.physics.world.gravity.y = PHYSICS_CONFIG.gravity;

    this.redFort = new MilitaryFort(this, 'red', { x: 195, y: 372 }, { groundY: theme.groundY });
    this.blueFort = new MilitaryFort(this, 'blue', { x: 829, y: 372 }, { groundY: theme.groundY });
    this.battleAudio = new BattleAudio(this);
    this.battleAudio.startBgm();
    this.input.once('pointerdown', () => this.battleAudio.unlock());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.battleAudio.destroy());

    this.createUi();
    this.bindInput();
    this.turnSystem.startDeploy('red');
    this.setMessage('选择兵种卡牌，点击红方阵地部署。');
    this.syncAllVisuals();
  }

  private createThemeLayers(theme: BattleThemeConfig): void {
    const layerOrder: Array<keyof BattleThemeConfig['layerKeys']> = ['sky', 'clouds', 'far', 'near', 'ground'];
    for (let i = 0; i < layerOrder.length; i += 1) {
      const layer = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, theme.layerKeys[layerOrder[i]]);
      layer.setDepth(-10 + i * 0.5);
    }
  }

  update(_time: number, delta: number): void {
    if (this.turnSystem.phase === 'DEPLOY') {
      this.turnSystem.deployTimeLeft = Math.max(0, this.turnSystem.deployTimeLeft - delta / 1000);
      if (this.turnSystem.deployTimeLeft <= 0) this.beginAttack();
    }

    if (this.activeShell) this.updateShell();
    this.refreshUi();
  }

  private createUi(): void {
    this.statusText = this.add.text(24, 18, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#fff0ca',
      stroke: '#111',
      strokeThickness: 4
    });
    this.statusText.setDepth(UI_DEPTH);

    this.hpText = this.add.text(GAME_WIDTH - 24, 18, '', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#f7eed7',
      stroke: '#111',
      strokeThickness: 4,
      align: 'right'
    });
    this.hpText.setOrigin(1, 0);
    this.hpText.setDepth(UI_DEPTH);

    this.messageText = this.add.text(GAME_WIDTH / 2, 63, '', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#f9e8b9',
      stroke: '#171a13',
      strokeThickness: 4
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setDepth(UI_DEPTH);

    this.createCards();
    this.createFireButton();
  }

  private createCards(): void {
    const startX = 208;
    for (let i = 0; i < SOLDIER_TYPES.length; i += 1) {
      const type = SOLDIER_TYPES[i];
      const x = startX + i * 146;
      const card = this.add.rectangle(x, 526, 128, 68, 0x20251e, 0.88);
      card.setDepth(UI_DEPTH);
      card.setStrokeStyle(2, 0x746b4d, 0.9);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.selectedType = type;
        this.setMessage(`${SOLDIER_CONFIG[type].label}：${SOLDIER_CONFIG[type].description}`);
        this.syncAllVisuals();
      });
      this.cardRects.push(card);

      this.add.image(x - 43, 514, this.getSoldierTexture(type)).setScale(0.58).setDepth(UI_DEPTH + 0.1);
      this.add.text(x - 14, 498, SOLDIER_CONFIG[type].label, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#fff0ca',
        stroke: '#111',
        strokeThickness: 3
      }).setDepth(UI_DEPTH + 0.1);
      this.add.text(x - 14, 520, `伤${SOLDIER_CONFIG[type].attack} 破${SOLDIER_CONFIG[type].defBreak}`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#d8cfaa',
        stroke: '#111',
        strokeThickness: 3
      }).setDepth(UI_DEPTH + 0.1);
    }
  }

  private createFireButton(): void {
    this.fireButton = this.add.rectangle(854, 526, 150, 68, 0x82412c, 0.92);
    this.fireButton.setDepth(UI_DEPTH);
    this.fireButton.setStrokeStyle(2, 0xffc268, 0.9);
    this.fireButton.setInteractive({ useHandCursor: true });
    this.fireButton.on('pointerdown', () => {
      if (this.turnSystem.phase === 'DEPLOY' && this.turnSystem.activeTeam === 'red') this.beginAttack();
    });
    this.fireButtonText = this.add.text(854, 526, '开始炮火', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#fff0ca',
      stroke: '#111',
      strokeThickness: 4
    });
    this.fireButtonText.setOrigin(0.5);
    this.fireButtonText.setDepth(UI_DEPTH + 0.1);
  }

  private bindInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.turnSystem.phase !== 'DEPLOY' || this.turnSystem.activeTeam !== 'red') return;

      const slot = this.redFort.findSlotAt(pointer.worldX, pointer.worldY);
      if (!slot) return;

      if (!assignSoldierToSlot(this.redFort.state, this.selectedType, slot.id)) {
        this.setMessage('该兵种不能部署到这个阵地，或点位已被占用。');
        return;
      }

      this.setMessage(`${SOLDIER_CONFIG[this.selectedType].label} 已进入 ${slot.layer} 阵地。`);
      updateSoldierExposure(this.redFort.state);
      this.syncAllVisuals();
      this.time.delayedCall(650, () => this.setSoldierVisualState(slot.occupantId, 'idle'));
    });
  }

  private beginAttack(): void {
    if (this.turnSystem.phase !== 'DEPLOY' || this.activeShell) return;

    if (this.turnSystem.activeTeam === 'blue') this.deployEnemyAi();

    this.turnSystem.startAttack();
    this.attackQueue = this.createAttackQueue(this.turnSystem.activeTeam);
    this.setMessage(`${this.turnSystem.activeTeam === 'red' ? '红方' : '蓝方'}炮火打击开始。`);

    if (this.attackQueue.length === 0) {
      this.time.delayedCall(450, () => this.settleTurn());
      return;
    }

    this.fireNextShell();
  }

  private deployEnemyAi(): void {
    const openSlots = this.blueFort.state.deploySlots.filter((slot) => !slot.occupantId);
    const legalChoices = openSlots.flatMap((slot) =>
      SOLDIER_TYPES.filter((type) => canDeploySoldier(this.blueFort.state, type, slot.id)).map((type) => ({ slot, type }))
    );
    if (legalChoices.length === 0) return;

    const choice = legalChoices[Math.floor(Math.random() * legalChoices.length)];
    assignSoldierToSlot(this.blueFort.state, choice.type, choice.slot.id);
    updateSoldierExposure(this.blueFort.state);
    this.syncAllVisuals();
    this.time.delayedCall(650, () => this.setSoldierVisualState(choice.slot.occupantId, 'idle'));
  }

  private createAttackQueue(team: Team): AttackTask[] {
    const sourceFort = team === 'red' ? this.redFort : this.blueFort;
    const targetFort = team === 'red' ? this.blueFort : this.redFort;
    const tasks: AttackTask[] = [];

    for (const soldier of sourceFort.state.soldiers.filter((candidate) => candidate.isAlive)) {
      const config = SOLDIER_CONFIG[soldier.type];
      for (let i = 0; i < config.attacksPerTurn; i += 1) {
        const exposedSoldierTarget = selectExposedSoldierTarget(targetFort.state);
        const targetBlock = selectTargetBlock(targetFort.state);
        const target =
          exposedSoldierTarget && (!targetBlock || Math.random() < 0.75)
            ? exposedSoldierTarget
            : targetBlock
              ? { x: targetBlock.x, y: targetBlock.y }
              : getFortCenter(targetFort.state);
        tasks.push({
          soldier,
          targetFort,
          target
        });
      }
    }

    return tasks;
  }

  private fireNextShell(): void {
    const task = this.attackQueue.shift();
    if (!task) {
      this.time.delayedCall(450, () => this.settleTurn());
      return;
    }

    const speed = SOLDIER_CONFIG[task.soldier.type].shellSpeed;
    this.setSoldierVisualState(task.soldier.id, 'attack');
    this.battleAudio.playShot(task.soldier.type);
    this.activeShell = launchShell(this, task.soldier, task.target, speed);
    this.activeShell.sprite.setData('targetFort', task.targetFort);
    this.time.delayedCall(520, () => this.setSoldierVisualState(task.soldier.id, 'idle'));
  }

  private updateShell(): void {
    if (!this.activeShell) return;
    const shell = this.activeShell.sprite;
    const body = shell.body as Phaser.Physics.Arcade.Body;
    shell.rotation = Math.atan2(body.velocity.y, body.velocity.x);

    const age = this.time.now - this.activeShell.bornAt;
    const distance = Phaser.Math.Distance.Between(shell.x, shell.y, this.activeShell.target.x, this.activeShell.target.y);
    const outOfBounds = shell.x < -40 || shell.x > GAME_WIDTH + 40 || shell.y > GAME_HEIGHT + 80;
    const targetFort = shell.getData('targetFort') as MilitaryFort | undefined;
    const collidedBlock = targetFort
      ? findShellCollisionBlock(targetFort.state, { x: shell.x, y: shell.y }, PHYSICS_CONFIG.shellHitRadius)
      : null;

    if (collidedBlock || distance <= PHYSICS_CONFIG.shellHitRadius || age > 2400 || outOfBounds) {
      this.resolveShellImpact({ x: shell.x, y: shell.y });
    }
  }

  private resolveShellImpact(impact: Vec2): void {
    if (!this.activeShell) return;
    const shell = this.activeShell;
    const targetFort = shell.sprite.getData('targetFort') as MilitaryFort;
    shell.sprite.destroy();
    this.activeShell = undefined;

    const radius = SOLDIER_CONFIG[shell.attacker.type].explosionRadius;
    const report = applyExplosionDamage(targetFort.state, shell.attacker.type, impact, radius);
    this.battleAudio.playExplosion(shell.attacker.type);
    this.playExplosion(report.effectiveImpact, radius);
    targetFort.syncVisuals(undefined, false);

    if (report.soldierHits.some((hit) => hit.killed)) {
      this.setMessage('暴露士兵被命中，作战单位阵亡！');
    } else if (report.soldierHits.length > 0) {
      const totalDamage = report.soldierHits.reduce((sum, hit) => sum + hit.damage, 0);
      this.setMessage(`暴露士兵受创，合计扣血 ${totalDamage}。`);
    } else if (report.collapsedBlocks.length > 0) {
      this.setMessage('底层失稳，敌方上层阵地坍塌！');
    }

    const winner = this.turnSystem.getWinner(this.redFort.state, this.blueFort.state);
    if (winner.winner) {
      this.endGame(winner);
      return;
    }

    this.time.delayedCall(230, () => this.fireNextShell());
  }

  private settleTurn(): void {
    this.turnSystem.startSettle();
    this.syncAllVisuals();
    const winner = this.turnSystem.getWinner(this.redFort.state, this.blueFort.state);
    if (winner.winner) {
      this.endGame(winner);
      return;
    }

    this.time.delayedCall(TURN_CONFIG.settleSeconds * 1000, () => {
      this.turnSystem.finishTurn();
      this.syncAllVisuals();
      if (this.turnSystem.activeTeam === 'blue') {
        this.setMessage('蓝方正在部署作战单位。');
        this.time.delayedCall(700, () => this.beginAttack());
      } else {
        this.setMessage('红方部署阶段，选择兵种继续推进。');
      }
    });
  }

  private endGame(report: WinnerReport): void {
    this.turnSystem.phase = 'GAMEOVER';
    this.activeShell?.sprite.destroy();
    this.activeShell = undefined;
    const title =
      report.winner === 'draw' ? '战局平手' : report.winner === 'red' ? '红方胜利' : '蓝方胜利';

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    panel.setDepth(UI_DEPTH + 5);
    const bg = this.add.rectangle(0, 0, 420, 210, 0x141812, 0.94);
    bg.setStrokeStyle(2, 0xf0c36a, 0.9);
    const titleText = this.add.text(0, -70, title, {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffe2a4',
      stroke: '#050505',
      strokeThickness: 5
    });
    titleText.setOrigin(0.5);
    const body = this.add.text(
      0,
      -18,
      `${report.reason}\n红方作战单位 ${this.getAliveSoldierCount(this.redFort)}/${this.redFort.state.soldiers.length}\n蓝方作战单位 ${this.getAliveSoldierCount(this.blueFort)}/${this.blueFort.state.soldiers.length}`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#f7eed7',
        align: 'center',
        lineSpacing: 8
      }
    );
    body.setOrigin(0.5);
    const restart = this.add.rectangle(0, 68, 170, 46, 0x82412c, 1);
    restart.setStrokeStyle(2, 0xffc268, 0.9);
    restart.setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => this.scene.restart());
    const restartText = this.add.text(0, 68, '重新开始', {
      fontFamily: 'Arial',
      fontSize: '19px',
      color: '#fff0ca',
      stroke: '#111',
      strokeThickness: 4
    });
    restartText.setOrigin(0.5);
    panel.add([bg, titleText, body, restart, restartText]);
    this.gameOverPanel = panel;
  }

  private playExplosion(impact: Vec2, radius: number): void {
    this.cameras.main.shake(PHYSICS_CONFIG.shakeMs, PHYSICS_CONFIG.shakeIntensity);
    const flash = this.add.image(impact.x, impact.y, ASSET_KEYS.explosion);
    flash.setDepth(4.8);
    flash.setDisplaySize(radius * 1.15, radius * 1.15);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.45,
      duration: PHYSICS_CONFIG.explosionMs,
      onComplete: () => flash.destroy()
    });

    const smoke = this.add.image(impact.x + 8, impact.y - 4, ASSET_KEYS.smoke);
    smoke.setDepth(4.7);
    smoke.setDisplaySize(radius, radius);
    this.tweens.add({
      targets: smoke,
      alpha: 0,
      y: smoke.y - 24,
      duration: PHYSICS_CONFIG.smokeMs,
      onComplete: () => smoke.destroy()
    });
  }

  private refreshUi(): void {
    const side = this.turnSystem.activeTeam === 'red' ? '红方' : '蓝方';
    this.statusText.setText(
      `第 ${Math.min(this.turnSystem.round, TURN_CONFIG.maxRounds)} / ${TURN_CONFIG.maxRounds} 回合  ${PHASE_LABELS[this.turnSystem.phase]}  ${side}  ${Math.ceil(this.turnSystem.deployTimeLeft)}s`
    );
    this.hpText.setText(
      `红方作战单位 ${this.getAliveSoldierCount(this.redFort)}/${this.redFort.state.soldiers.length}\n蓝方作战单位 ${this.getAliveSoldierCount(this.blueFort)}/${this.blueFort.state.soldiers.length}`
    );

    for (let i = 0; i < this.cardRects.length; i += 1) {
      const card = this.cardRects[i];
      const active = SOLDIER_TYPES[i] === this.selectedType;
      card.setStrokeStyle(active ? 4 : 2, active ? 0xffe290 : 0x746b4d, active ? 1 : 0.9);
      card.setFillStyle(active ? 0x343323 : 0x20251e, active ? 0.96 : 0.88);
    }

    const redDeploy = this.turnSystem.phase === 'DEPLOY' && this.turnSystem.activeTeam === 'red';
    this.fireButton.setAlpha(redDeploy ? 1 : 0.45);
    this.fireButtonText.setAlpha(redDeploy ? 1 : 0.55);
  }

  private syncAllVisuals(): void {
    const showInterior = this.turnSystem.phase !== 'ATTACK';
    const showRedDeployHints = this.turnSystem.phase === 'DEPLOY' && this.turnSystem.activeTeam === 'red';
    this.redFort.syncVisuals(this.selectedType, showInterior, showRedDeployHints);
    this.blueFort.syncVisuals(undefined, showInterior, false);
    this.refreshUi();
  }

  private setMessage(message: string): void {
    this.messageText.setText(message);
  }

  private getSoldierTexture(type: SoldierType): string {
    return {
      bomber: ASSET_KEYS.bomber,
      infantry: ASSET_KEYS.infantry,
      sniper: ASSET_KEYS.sniper,
      artillery: ASSET_KEYS.artillery
    }[type];
  }

  private getAliveSoldierCount(fort: MilitaryFort): number {
    return fort.state.soldiers.filter((soldier) => soldier.isAlive).length;
  }

  private setSoldierVisualState(soldierId: string | undefined, visualState: 'idle' | 'deploy' | 'attack'): void {
    if (!soldierId) return;
    const soldier = [...this.redFort.state.soldiers, ...this.blueFort.state.soldiers].find(
      (candidate) => candidate.id === soldierId && candidate.isAlive
    );
    if (!soldier) return;
    soldier.visualState = visualState;
    this.syncAllVisuals();
  }
}
