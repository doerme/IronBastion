import Phaser from 'phaser';
import { ASSET_KEYS, CHASSIS_CONFIG, GAME_HEIGHT, GAME_WIDTH, THEME_CONFIG } from '../config';
import type { Team } from '../types';

export function createMilitaryTextures(scene: Phaser.Scene): void {
  createGrasslandTheme(scene);
  createBlock(scene, ASSET_KEYS.redBlock, '#7f2f2b', '#d4533f');
  createBlock(scene, ASSET_KEYS.blueBlock, '#244c7d', '#3d8be0');
  createBlock(scene, ASSET_KEYS.damagedBlock, '#3b352d', '#8d7b63');
  createCore(scene, ASSET_KEYS.redCore, '#ff5a45');
  createCore(scene, ASSET_KEYS.blueCore, '#55a9ff');
  createChassis(scene, ASSET_KEYS.redWheeledChassis, 'red');
  createChassis(scene, ASSET_KEYS.blueWheeledChassis, 'blue');
  createSoldier(scene, ASSET_KEYS.bomber, '#e04a32', 'B');
  createSoldier(scene, ASSET_KEYS.infantry, '#d6b14a', 'I');
  createSoldier(scene, ASSET_KEYS.sniper, '#62c36d', 'S');
  createSoldier(scene, ASSET_KEYS.artillery, '#9d7de0', 'A');
  createSoldier(scene, ASSET_KEYS.bomberDeploy, '#e04a32', 'B', 'deploy');
  createSoldier(scene, ASSET_KEYS.infantryDeploy, '#d6b14a', 'I', 'deploy');
  createSoldier(scene, ASSET_KEYS.sniperDeploy, '#62c36d', 'S', 'deploy');
  createSoldier(scene, ASSET_KEYS.artilleryDeploy, '#9d7de0', 'A', 'deploy');
  createSoldier(scene, ASSET_KEYS.bomberAttack, '#e04a32', 'B', 'attack');
  createSoldier(scene, ASSET_KEYS.infantryAttack, '#d6b14a', 'I', 'attack');
  createSoldier(scene, ASSET_KEYS.sniperAttack, '#62c36d', 'S', 'attack');
  createSoldier(scene, ASSET_KEYS.artilleryAttack, '#9d7de0', 'A', 'attack');
  createShell(scene, ASSET_KEYS.shell, 'generic');
  createShell(scene, ASSET_KEYS.bomberShell, 'bomber');
  createShell(scene, ASSET_KEYS.infantryShell, 'infantry');
  createShell(scene, ASSET_KEYS.sniperShell, 'sniper');
  createShell(scene, ASSET_KEYS.artilleryShell, 'artillery');
  createExplosion(scene);
  createSmoke(scene);
}

function createGrasslandTheme(scene: Phaser.Scene): void {
  createGrasslandSky(scene);
  createGrasslandClouds(scene);
  createGrasslandFar(scene);
  createGrasslandNear(scene);
  createGrasslandGround(scene);
}

function createGrasslandSky(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.grasslandSky)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const bands = [
    { y: 0, height: 58, color: 0x72b6ee },
    { y: 58, height: 58, color: 0x8cc8f4 },
    { y: 116, height: 64, color: 0xb5ddf6 },
    { y: 180, height: 76, color: 0xd4edec },
    { y: 256, height: 90, color: 0xe5eed0 },
    { y: 346, height: GAME_HEIGHT - 346, color: 0xd8dfaf }
  ];
  for (const band of bands) {
    g.fillStyle(band.color, 1);
    g.fillRect(0, band.y, GAME_WIDTH, band.height);
  }
  g.fillStyle(0xffffff, 0.12);
  for (let i = 0; i < 8; i += 1) {
    const y = 36 + i * 33;
    g.fillRect(0, y, GAME_WIDTH, 2);
  }
  g.fillStyle(0xffefad, 0.18);
  g.fillCircle(840, 92, 82);
  g.generateTexture(ASSET_KEYS.grasslandSky, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

function createGrasslandClouds(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.grasslandClouds)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const clouds = [
    { x: 98, y: 86, scale: 1.1, alpha: 0.72 },
    { x: 330, y: 58, scale: 0.78, alpha: 0.58 },
    { x: 575, y: 112, scale: 1.28, alpha: 0.64 },
    { x: 850, y: 72, scale: 0.92, alpha: 0.66 },
    { x: 985, y: 145, scale: 0.72, alpha: 0.48 }
  ];
  for (const cloud of clouds) {
    drawCloud(g, cloud.x, cloud.y, cloud.scale, cloud.alpha);
  }
  g.generateTexture(ASSET_KEYS.grasslandClouds, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

function createGrasslandFar(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.grasslandFar)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  drawRollingHill(g, 328, 0x7aa180, 0.72, [
    { x: -90, y: 322, r: 190 },
    { x: 160, y: 300, r: 230 },
    { x: 410, y: 316, r: 210 },
    { x: 680, y: 292, r: 250 },
    { x: 980, y: 318, r: 220 }
  ]);
  drawRollingHill(g, 368, 0x5f8e5e, 0.78, [
    { x: -60, y: 362, r: 160 },
    { x: 190, y: 350, r: 190 },
    { x: 470, y: 364, r: 170 },
    { x: 760, y: 342, r: 205 },
    { x: 1040, y: 360, r: 170 }
  ]);
  g.fillStyle(0x345d3b, 0.16);
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 41) % GAME_WIDTH;
    const y = 298 + Math.sin(i * 1.7) * 20;
    g.fillRect(x, y, 3, 35 + (i % 5) * 5);
  }
  g.generateTexture(ASSET_KEYS.grasslandFar, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

function createGrasslandNear(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.grasslandNear)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x4e8b3e, 0.4);
  for (let i = 0; i < 28; i += 1) {
    const x = -20 + i * 42;
    const y = 382 + Math.sin(i * 0.9) * 10;
    g.fillEllipse(x, y, 92, 28);
  }
  for (let i = 0; i < 190; i += 1) {
    const x = (i * 37) % GAME_WIDTH;
    const baseY = 384 + ((i * 11) % 36);
    const height = 12 + (i % 7) * 3;
    const color = i % 3 === 0 ? 0x2f6d31 : i % 3 === 1 ? 0x6aa33e : 0x9dbd55;
    g.lineStyle(1 + (i % 2), color, 0.75);
    g.lineBetween(x, baseY, x + Math.sin(i) * 6, baseY - height);
  }
  g.fillStyle(0x2f3629, 0.36);
  for (let i = 0; i < 26; i += 1) {
    const x = (i * 83) % GAME_WIDTH;
    const y = 403 + (i % 4) * 7;
    g.fillEllipse(x, y, 22 + (i % 3) * 6, 8 + (i % 2) * 3);
  }
  g.generateTexture(ASSET_KEYS.grasslandNear, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

function createGrasslandGround(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.grasslandGround)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const groundY = THEME_CONFIG.grassland.groundY;
  g.fillGradientStyle(0x4f8f33, 0x5f9c3a, 0x2f5c2b, 0x274f28);
  g.fillRect(0, groundY - 32, GAME_WIDTH, 54);
  g.fillStyle(0x815f38, 0.96);
  g.fillRect(0, groundY + 18, GAME_WIDTH, GAME_HEIGHT - groundY - 18);
  g.fillStyle(0x4b3522, 0.55);
  for (let i = 0; i < 10; i += 1) {
    g.fillRect(0, groundY + 34 + i * 13, GAME_WIDTH, 2);
  }
  g.fillStyle(0x27351f, 0.22);
  for (let i = 0; i < 150; i += 1) {
    const x = (i * 53) % GAME_WIDTH;
    const y = groundY + 29 + ((i * 19) % 124);
    g.fillCircle(x, y, 1 + (i % 4));
  }
  g.lineStyle(3, 0xcee27d, 0.72);
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 31) % GAME_WIDTH;
    g.lineBetween(x, groundY - 22, x + Math.cos(i) * 5, groundY - 35 - (i % 4) * 3);
  }
  g.lineStyle(2, 0x23371e, 0.65);
  g.beginPath();
  g.moveTo(0, groundY + 18);
  for (let x = 0; x <= GAME_WIDTH; x += 32) {
    g.lineTo(x, groundY + 16 + Math.sin(x * 0.035) * 4);
  }
  g.strokePath();
  g.generateTexture(ASSET_KEYS.grasslandGround, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

function drawCloud(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  alpha: number
): void {
  g.fillStyle(0xffffff, alpha);
  g.fillEllipse(x, y + 12 * scale, 78 * scale, 28 * scale);
  g.fillCircle(x - 26 * scale, y + 7 * scale, 18 * scale);
  g.fillCircle(x, y, 24 * scale);
  g.fillCircle(x + 30 * scale, y + 6 * scale, 19 * scale);
  g.fillStyle(0xc6dded, alpha * 0.3);
  g.fillEllipse(x + 4 * scale, y + 18 * scale, 72 * scale, 12 * scale);
}

function drawRollingHill(
  g: Phaser.GameObjects.Graphics,
  floorY: number,
  color: number,
  alpha: number,
  circles: Array<{ x: number; y: number; r: number }>
): void {
  g.fillStyle(color, alpha);
  g.fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);
  for (const circle of circles) {
    g.fillCircle(circle.x, circle.y, circle.r);
  }
}

function createChassis(scene: Phaser.Scene, key: string, team: Team): void {
  if (scene.textures.exists(key)) return;
  const config = CHASSIS_CONFIG['wheeled-armored'];
  const width = config.width + 26;
  const height = config.bodyHeight + config.wheelRadius * 2 + config.groundClearance + 10;
  const bodyY = 10;
  const wheelY = bodyY + config.bodyHeight + config.groundClearance + config.wheelRadius - 2;
  const base = team === 'red' ? 0x5f2b27 : 0x243f66;
  const panel = team === 'red' ? 0xa94635 : 0x346faf;
  const accent = team === 'red' ? 0xff7358 : 0x69b7ff;
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x060807, 0.38);
  g.fillEllipse(width / 2, wheelY + config.wheelRadius + 3, config.width * 0.92, 14);
  g.fillStyle(base, 1);
  g.fillRoundedRect(13, bodyY + 8, config.width, config.bodyHeight - 2, 7);
  g.fillStyle(panel, 0.95);
  g.fillRoundedRect(25, bodyY, config.width - 24, config.bodyHeight - 8, 8);
  g.fillStyle(0x111814, 0.45);
  g.fillRect(30, bodyY + config.bodyHeight - 15, config.width - 34, 8);
  g.lineStyle(2, 0x121712, 0.85);
  g.strokeRoundedRect(13, bodyY + 8, config.width, config.bodyHeight - 2, 7);
  g.lineStyle(2, accent, 0.8);
  g.lineBetween(35, bodyY + 8, width - 35, bodyY + 8);

  g.fillStyle(0x121712, 0.78);
  g.fillRoundedRect(30, wheelY - 8, width - 60, 16, 8);

  const wheelStart = width / 2 - ((config.wheelCount - 1) * 36) / 2;
  for (let i = 0; i < config.wheelCount; i += 1) {
    const x = wheelStart + i * 36;
    g.fillStyle(0x151713, 1);
    g.fillCircle(x, wheelY, config.wheelRadius + 4);
    g.fillStyle(0x2b3028, 1);
    g.fillCircle(x, wheelY, config.wheelRadius);
    g.fillStyle(0x727c6f, 0.85);
    g.fillCircle(x, wheelY, config.wheelRadius * 0.48);
    g.lineStyle(2, 0x080908, 0.65);
    g.strokeCircle(x, wheelY, config.wheelRadius + 4);
  }

  g.generateTexture(key, width, height);
  g.destroy();
}

function createBlock(scene: Phaser.Scene, key: string, base: string, highlight: string): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(Phaser.Display.Color.HexStringToColor(base).color);
  g.fillRoundedRect(0, 0, 38, 32, 3);
  g.fillStyle(Phaser.Display.Color.HexStringToColor(highlight).color, 0.6);
  g.fillRect(4, 4, 30, 5);
  g.fillStyle(0x151515, 0.35);
  g.fillRect(3, 22, 32, 5);
  g.lineStyle(2, 0x121212, 0.75);
  g.strokeRoundedRect(1, 1, 36, 30, 3);
  g.generateTexture(key, 38, 32);
  g.destroy();
}

function createCore(scene: Phaser.Scene, key: string, glow: string): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const color = Phaser.Display.Color.HexStringToColor(glow).color;
  g.fillStyle(0x222522);
  g.fillRoundedRect(2, 2, 54, 50, 6);
  g.fillStyle(color, 0.9);
  g.fillCircle(29, 27, 16);
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(23, 20, 5);
  g.lineStyle(3, color, 0.8);
  g.strokeRoundedRect(4, 4, 50, 46, 6);
  g.generateTexture(key, 58, 54);
  g.destroy();
}

function createSoldier(scene: Phaser.Scene, key: string, color: string, letter: string, pose: 'idle' | 'deploy' | 'attack' = 'idle'): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const main = Phaser.Display.Color.HexStringToColor(color).color;
  const accent = getSoldierAccent(letter);
  const bodyY = pose === 'deploy' ? 25 : 18;
  const bodyH = pose === 'deploy' ? 24 : 32;
  const headY = pose === 'deploy' ? 18 : 13;

  g.fillStyle(0x050706, 0.32);
  g.fillEllipse(28, 55, 38, 10);
  if (pose === 'deploy') {
    g.fillStyle(0x111912, 0.9);
    g.fillRoundedRect(9, 36, 38, 9, 4);
    g.lineStyle(2, accent, 0.85);
    g.strokeCircle(28, 43, 16);
  } else {
    g.fillStyle(0x0e130f, 0.9);
    g.fillRoundedRect(12, 37, 32, 16, 5);
  }

  g.fillStyle(0x171d18);
  g.fillRoundedRect(14, bodyY + 4, 28, bodyH, 7);
  g.fillStyle(main);
  g.fillRoundedRect(17, bodyY, 22, bodyH, 6);
  g.fillStyle(0x0b0f0c);
  g.fillRoundedRect(20, bodyY + bodyH - 7, 16, 10, 3);
  g.fillStyle(0xf0dcac);
  g.fillCircle(28, headY, 8);
  g.fillStyle(0x151915);
  g.fillRoundedRect(18, headY - 10, 20, 9, 4);
  g.fillStyle(accent, 0.95);
  g.fillRect(20, headY - 8, 16, 3);
  g.fillStyle(0x101510);
  g.fillCircle(25, headY, 2);
  g.fillCircle(31, headY, 2);
  g.lineStyle(2, 0x22271f, 0.95);
  g.lineBetween(17, bodyY + 10, 7, bodyY + 20);
  g.lineBetween(39, bodyY + 10, 49, bodyY + 20);
  g.lineStyle(3, 0x0d110e, 1);
  g.lineBetween(22, bodyY + bodyH + 2, 19, 54);
  g.lineBetween(34, bodyY + bodyH + 2, 38, 54);

  drawSoldierEquipment(g, letter, pose, accent);
  g.generateTexture(key, 56, 64);
  g.destroy();
}

function drawSoldierEquipment(g: Phaser.GameObjects.Graphics, letter: string, pose: 'idle' | 'deploy' | 'attack', accent: number): void {
  const flash = pose === 'attack';
  if (letter === 'B') {
    g.fillStyle(0x2a2c24);
    g.fillRoundedRect(5, 31, 16, 12, 4);
    g.fillStyle(accent, 0.95);
    g.fillCircle(13, 37, 5);
    if (flash) {
      g.fillStyle(0xffd45c, 0.95);
      g.fillCircle(45, 28, 7);
    }
    return;
  }

  if (letter === 'I') {
    g.lineStyle(5, 0x111611, 1);
    g.lineBetween(31, 30, 52, 25);
    g.lineStyle(2, accent, 0.95);
    g.lineBetween(33, 28, 50, 24);
    if (flash) {
      g.fillStyle(0xffe38a, 0.95);
      g.fillTriangle(52, 21, 52, 29, 61, 25);
    }
    return;
  }

  if (letter === 'S') {
    g.lineStyle(3, 0x0c100d, 1);
    g.lineBetween(24, 24, 55, 18);
    g.fillStyle(accent, 0.95);
    g.fillRect(38, 17, 7, 4);
    if (flash) {
      g.fillStyle(0xfff0b0, 0.95);
      g.fillRect(53, 16, 8, 4);
    }
    return;
  }

  g.fillStyle(0x111611);
  g.fillRoundedRect(29, 35, 23, 9, 4);
  g.lineStyle(5, 0x111611, 1);
  g.lineBetween(34, 35, 51, 24);
  g.lineStyle(2, accent, 0.95);
  g.lineBetween(36, 34, 50, 25);
  if (flash) {
    g.fillStyle(0xffd45c, 0.95);
    g.fillCircle(52, 23, 8);
  }
}

function getSoldierAccent(letter: string): number {
  if (letter === 'B') return 0xff7357;
  if (letter === 'I') return 0xffd35c;
  if (letter === 'S') return 0x78ef86;
  return 0xba9cff;
}

function createShell(scene: Phaser.Scene, key: string, type: 'generic' | 'bomber' | 'infantry' | 'sniper' | 'artillery'): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });

  if (type === 'bomber') {
    g.fillStyle(0x271d18);
    g.fillCircle(17, 17, 13);
    g.fillStyle(0xff6848);
    g.fillCircle(15, 15, 7);
    g.lineStyle(3, 0x111111, 0.9);
    g.strokeCircle(17, 17, 13);
    g.fillStyle(0xffd35a, 0.9);
    g.fillCircle(29, 8, 4);
    g.generateTexture(key, 36, 34);
    g.destroy();
    return;
  }

  if (type === 'infantry') {
    g.fillStyle(0xf2c84b);
    g.fillEllipse(18, 7, 25, 8);
    g.fillStyle(0x191a16);
    g.fillTriangle(32, 7, 23, 3, 23, 11);
    g.fillStyle(0xfff1a0, 0.55);
    g.fillRect(1, 5, 16, 4);
    g.generateTexture(key, 36, 14);
    g.destroy();
    return;
  }

  if (type === 'sniper') {
    g.fillStyle(0x9af5a1);
    g.fillRect(4, 7, 34, 5);
    g.fillStyle(0xeaffc8, 0.8);
    g.fillRect(0, 8, 22, 2);
    g.fillStyle(0x151a14);
    g.fillTriangle(42, 9, 36, 3, 36, 15);
    g.generateTexture(key, 44, 18);
    g.destroy();
    return;
  }

  if (type === 'artillery') {
    g.fillStyle(0x25212d);
    g.fillEllipse(19, 14, 28, 20);
    g.fillStyle(0xba9cff);
    g.fillEllipse(17, 12, 18, 12);
    g.fillStyle(0x111111);
    g.fillRect(28, 10, 7, 8);
    g.generateTexture(key, 40, 28);
    g.destroy();
    return;
  }

  g.fillStyle(0xf2c84b);
  g.fillEllipse(18, 10, 28, 12);
  g.fillStyle(0x202020);
  g.fillTriangle(31, 10, 22, 4, 22, 16);
  g.generateTexture(key, 36, 20);
  g.destroy();
}

function createExplosion(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.explosion)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffd15a, 0.95);
  g.fillCircle(40, 40, 32);
  g.fillStyle(0xff6c2c, 0.85);
  g.fillCircle(40, 40, 22);
  g.fillStyle(0x2a211a, 0.45);
  g.fillCircle(40, 40, 38);
  g.generateTexture(ASSET_KEYS.explosion, 80, 80);
  g.destroy();
}

function createSmoke(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.smoke)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x2d302c, 0.4);
  g.fillCircle(26, 28, 24);
  g.fillCircle(42, 22, 20);
  g.fillCircle(48, 42, 18);
  g.fillCircle(20, 44, 16);
  g.generateTexture(ASSET_KEYS.smoke, 70, 70);
  g.destroy();
}
