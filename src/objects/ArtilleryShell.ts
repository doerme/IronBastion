import Phaser from 'phaser';
import { PHYSICS_CONFIG, PROJECTILE_CONFIG } from '../config';
import type { SoldierState, Vec2 } from '../types';

export interface ActiveShell {
  sprite: Phaser.GameObjects.Sprite;
  attacker: SoldierState;
  target: Vec2;
  bornAt: number;
}

export function launchShell(scene: Phaser.Scene, attacker: SoldierState, target: Vec2, speed: number): ActiveShell {
  const projectile = PROJECTILE_CONFIG[attacker.type];
  const shell = scene.add.sprite(attacker.x, attacker.y - 12, projectile.texture);
  shell.setScale(projectile.scale);
  scene.physics.add.existing(shell);

  const body = shell.body as Phaser.Physics.Arcade.Body;
  const dx = target.x - attacker.x;
  const dy = target.y - (attacker.y - 12);
  const direction = Math.sign(dx) || 1;

  body.setCircle(PHYSICS_CONFIG.shellHitRadius);

  if (projectile.trajectory === 'direct-shot') {
    const angle = Math.atan2(dy, dx);
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  } else if (projectile.trajectory === 'flat-burst') {
    const angle = Math.atan2(dy, dx);
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed + projectile.launchLift);
  } else {
    const travelTime = Phaser.Math.Clamp(Math.abs(dx) / speed, projectile.travelTimeMin, projectile.travelTimeMax);
    const vx = dx / travelTime;
    const vy =
      (target.y - (attacker.y - 12) - 0.5 * PHYSICS_CONFIG.gravity * travelTime * travelTime) / travelTime +
      projectile.launchLift;
    body.setAllowGravity(true);
    body.setVelocity(vx, vy);
  }

  shell.rotation = direction > 0 ? 0 : Math.PI;

  return { sprite: shell, attacker, target, bornAt: scene.time.now };
}
