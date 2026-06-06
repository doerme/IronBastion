import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';

export function createMilitaryTextures(scene: Phaser.Scene): void {
  createBackground(scene);
  createBlock(scene, ASSET_KEYS.redBlock, '#7f2f2b', '#d4533f');
  createBlock(scene, ASSET_KEYS.blueBlock, '#244c7d', '#3d8be0');
  createBlock(scene, ASSET_KEYS.damagedBlock, '#3b352d', '#8d7b63');
  createCore(scene, ASSET_KEYS.redCore, '#ff5a45');
  createCore(scene, ASSET_KEYS.blueCore, '#55a9ff');
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

function createBackground(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.background)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillGradientStyle(0x27332b, 0x27332b, 0x76694d, 0x4f4736);
  g.fillRect(0, 0, 1024, 576);
  g.fillStyle(0x1f251e, 0.35);
  for (let i = 0; i < 48; i += 1) {
    const x = 30 + i * 24;
    const y = 350 + Math.sin(i * 0.7) * 16;
    g.fillCircle(x, y, 38 + (i % 4) * 8);
  }
  g.fillStyle(0x121612, 0.45);
  g.fillRect(0, 398, 1024, 178);
  g.fillStyle(0x9c8762, 0.18);
  for (let i = 0; i < 120; i += 1) {
    g.fillCircle(Math.random() * 1024, 410 + Math.random() * 150, 1 + Math.random() * 2);
  }
  g.generateTexture(ASSET_KEYS.background, 1024, 576);
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
