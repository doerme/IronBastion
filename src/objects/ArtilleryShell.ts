import Phaser from 'phaser';
import { ASSET_KEYS, PHYSICS_CONFIG } from '../config';
import type { SoldierState, Vec2 } from '../types';

export interface ActiveShell {
  sprite: Phaser.GameObjects.Sprite;
  attacker: SoldierState;
  target: Vec2;
  bornAt: number;
}

export function launchShell(scene: Phaser.Scene, attacker: SoldierState, target: Vec2, speed: number): ActiveShell {
  const shell = scene.add.sprite(attacker.x, attacker.y - 12, ASSET_KEYS.shell);
  shell.setScale(0.8);
  scene.physics.add.existing(shell);

  const body = shell.body as Phaser.Physics.Arcade.Body;
  const dx = target.x - attacker.x;
  const direction = Math.sign(dx) || 1;
  const travelTime = Phaser.Math.Clamp(Math.abs(dx) / speed, 0.72, 1.35);
  const vx = dx / travelTime;
  const vy = (target.y - attacker.y - 0.5 * PHYSICS_CONFIG.gravity * travelTime * travelTime) / travelTime - 42;

  body.setAllowGravity(true);
  body.setCircle(PHYSICS_CONFIG.shellHitRadius);
  body.setVelocity(vx, vy);
  shell.rotation = direction > 0 ? 0 : Math.PI;

  return { sprite: shell, attacker, target, bornAt: scene.time.now };
}
