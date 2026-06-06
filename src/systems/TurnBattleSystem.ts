import { TURN_CONFIG } from '../config';
import { areAllBlocksDestroyed, areAllDeployedSoldiersDead } from './FortPhysics';
import type { BattlePhase, FortState, Team, WinnerReport } from '../types';

export class TurnBattleSystem {
  phase: BattlePhase = 'READY';
  activeTeam: Team = 'red';
  round = 1;
  deployTimeLeft: number = TURN_CONFIG.deploySeconds;

  startDeploy(team: Team): void {
    this.activeTeam = team;
    this.phase = 'DEPLOY';
    this.deployTimeLeft = TURN_CONFIG.deploySeconds;
  }

  startAttack(): void {
    this.phase = 'ATTACK';
  }

  startSettle(): void {
    this.phase = 'SETTLE';
  }

  finishTurn(): void {
    if (this.activeTeam === 'red') {
      this.activeTeam = 'blue';
      this.phase = 'DEPLOY';
      this.deployTimeLeft = TURN_CONFIG.deploySeconds;
      return;
    }

    this.activeTeam = 'red';
    this.round += 1;
    this.phase = 'DEPLOY';
    this.deployTimeLeft = TURN_CONFIG.deploySeconds;
  }

  getWinner(redFort: FortState, blueFort: FortState): WinnerReport {
    const redSoldiersDead = areAllDeployedSoldiersDead(redFort);
    const blueSoldiersDead = areAllDeployedSoldiersDead(blueFort);
    const redDefeated = redFort.coreHp <= 0 || areAllBlocksDestroyed(redFort) || redSoldiersDead;
    const blueDefeated = blueFort.coreHp <= 0 || areAllBlocksDestroyed(blueFort) || blueSoldiersDead;

    if (redDefeated && blueDefeated) return { winner: 'draw', reason: '双方阵地同时失守' };
    if (redDefeated) return { winner: 'blue', reason: redSoldiersDead ? '红方作战单位全灭' : '红方堡垒失守' };
    if (blueDefeated) return { winner: 'red', reason: blueSoldiersDead ? '蓝方作战单位全灭' : '蓝方堡垒失守' };

    if (this.round > TURN_CONFIG.maxRounds) {
      if (redFort.coreHp === blueFort.coreHp) return { winner: 'draw', reason: '十二回合后核心血量持平' };
      return redFort.coreHp > blueFort.coreHp
        ? { winner: 'red', reason: '十二回合后红方核心血量更高' }
        : { winner: 'blue', reason: '十二回合后蓝方核心血量更高' };
    }

    return { winner: null, reason: '' };
  }
}
