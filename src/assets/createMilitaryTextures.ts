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
  createShell(scene);
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

function createSoldier(scene: Phaser.Scene, key: string, color: string, letter: string): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const main = Phaser.Display.Color.HexStringToColor(color).color;
  g.fillStyle(0x161b16);
  g.fillRoundedRect(5, 14, 30, 28, 5);
  g.fillStyle(main);
  g.fillRoundedRect(8, 6, 24, 25, 5);
  g.fillStyle(0x0c0f0c);
  g.fillRect(13, 28, 14, 12);
  g.lineStyle(3, 0xf2e7c4, 0.95);
  g.strokeCircle(20, 17, 7);
  g.fillStyle(0xf8f0d0);
  g.fillCircle(20, 17, letter === 'S' ? 3 : 2);
  g.generateTexture(key, 40, 46);
  g.destroy();
}

function createShell(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.shell)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xf2c84b);
  g.fillEllipse(18, 10, 28, 12);
  g.fillStyle(0x202020);
  g.fillTriangle(31, 10, 22, 4, 22, 16);
  g.generateTexture(ASSET_KEYS.shell, 36, 20);
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
