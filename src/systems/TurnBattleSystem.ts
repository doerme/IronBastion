import { TURN_CONFIG } from '../config';
import { areAllDeployedSoldiersDead } from './FortPhysics';
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

    if (redSoldiersDead && blueSoldiersDead) return { winner: 'draw', reason: '双方作战单位同时全灭' };
    if (redSoldiersDead) return { winner: 'blue', reason: '红方作战单位全灭' };
    if (blueSoldiersDead) return { winner: 'red', reason: '蓝方作战单位全灭' };

    if (this.round > TURN_CONFIG.maxRounds) {
      const redAlive = getAliveSoldierCount(redFort);
      const blueAlive = getAliveSoldierCount(blueFort);
      if (redAlive !== blueAlive) {
        return redAlive > blueAlive
          ? { winner: 'red', reason: '十二回合后红方存活单位更多' }
          : { winner: 'blue', reason: '十二回合后蓝方存活单位更多' };
      }

      const redHp = getAliveSoldierHp(redFort);
      const blueHp = getAliveSoldierHp(blueFort);
      if (redHp !== blueHp) {
        return redHp > blueHp
          ? { winner: 'red', reason: '十二回合后红方剩余兵力更强' }
          : { winner: 'blue', reason: '十二回合后蓝方剩余兵力更强' };
      }

      return { winner: 'draw', reason: '十二回合后存活作战单位持平' };
    }

    return { winner: null, reason: '' };
  }
}

function getAliveSoldierCount(fort: FortState): number {
  return fort.soldiers.filter((soldier) => soldier.isAlive).length;
}

function getAliveSoldierHp(fort: FortState): number {
  return fort.soldiers.reduce((sum, soldier) => sum + (soldier.isAlive ? soldier.hp : 0), 0);
}
