import Phaser from 'phaser';
import { AUDIO_CONFIG } from '../config';
import type { SoldierType } from '../types';

type AudioContextFactory = typeof AudioContext;

export class BattleAudio {
  private context?: AudioContext;
  private masterGain?: GainNode;
  private bgmGain?: GainNode;
  private sfxGain?: GainNode;
  private bgmEvent?: Phaser.Time.TimerEvent;
  private bgmStep = 0;

  constructor(private scene: Phaser.Scene) {
    this.createContext();
  }

  unlock(): void {
    if (!this.context) return;
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  startBgm(): void {
    if (this.bgmEvent || !this.context) return;
    this.bgmEvent = this.scene.time.addEvent({
      delay: AUDIO_CONFIG.bgmStepMs,
      loop: true,
      callback: () => this.playBgmStep()
    });
  }

  playShot(type: SoldierType): void {
    if (!this.isReady() || !this.sfxGain || !this.context) return;
    const profile = AUDIO_CONFIG.shotBySoldier[type];
    const now = this.context.currentTime;
    this.playTone(profile.frequency, Math.max(32, profile.frequency * 0.42), profile.duration, profile.volume, 'triangle');
    this.playTone(profile.frequency * 0.5, Math.max(28, profile.frequency * 0.28), profile.duration * 1.15, profile.volume * 0.35, 'sine');
    this.playNoiseBurst(now, profile.duration * 0.75, profile.volume * 0.1, 420, 90);
  }

  playExplosion(type: SoldierType): void {
    if (!this.isReady() || !this.sfxGain || !this.context) return;
    const profile = AUDIO_CONFIG.explosionBySoldier[type];
    const now = this.context.currentTime;
    this.playTone(profile.frequency, Math.max(24, profile.frequency * 0.36), profile.duration, profile.volume, 'triangle');
    this.playNoiseBurst(now, profile.duration, profile.volume * 0.62);
    this.playNoiseBurst(now + 0.08, profile.duration * 0.6, profile.volume * 0.32);
  }

  destroy(): void {
    this.bgmEvent?.destroy();
    this.bgmEvent = undefined;
    if (this.context && this.context.state !== 'closed') {
      void this.context.close();
    }
  }

  private createContext(): void {
    if (typeof window === 'undefined') return;
    const BrowserAudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextFactory }).webkitAudioContext;
    if (!BrowserAudioContext) return;

    this.context = new BrowserAudioContext();
    this.masterGain = this.context.createGain();
    this.bgmGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.masterGain.gain.value = AUDIO_CONFIG.masterVolume;
    this.bgmGain.gain.value = AUDIO_CONFIG.bgmVolume;
    this.sfxGain.gain.value = AUDIO_CONFIG.sfxVolume;
    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  private isReady(): boolean {
    return Boolean(this.context && this.context.state === 'running');
  }

  private playBgmStep(): void {
    if (!this.isReady() || !this.context || !this.bgmGain) return;
    const bassNote = AUDIO_CONFIG.bgmBassNotes[this.bgmStep % AUDIO_CONFIG.bgmBassNotes.length];
    const isAccent = this.bgmStep % 4 === 0;
    const now = this.context.currentTime;

    this.playToneToGain(
      bassNote,
      Math.max(28, bassNote * 0.7),
      isAccent ? 0.44 : 0.3,
      isAccent ? 0.34 : 0.22,
      'sine',
      this.bgmGain
    );
    if (this.bgmStep % 2 === 0) this.playHorn(now + 0.12);
    if (this.bgmStep % 8 === 0) this.playPad(now);
    if (isAccent) this.playKick(now);
    this.bgmStep += 1;
  }

  private playHorn(now: number): void {
    if (!this.context || !this.bgmGain) return;
    const note = AUDIO_CONFIG.bgmHornNotes[Math.floor(this.bgmStep / 2) % AUDIO_CONFIG.bgmHornNotes.length];
    this.playToneToGain(note, note * 0.96, 0.72, 0.16, 'triangle', this.bgmGain, now);
    this.playToneToGain(note * 1.5, note * 1.42, 0.5, 0.045, 'sine', this.bgmGain, now + 0.02);
  }

  private playPad(now: number): void {
    if (!this.context || !this.bgmGain) return;
    this.playToneToGain(AUDIO_CONFIG.bgmPadFrequency, AUDIO_CONFIG.bgmPadFrequency, 3.8, 0.055, 'sine', this.bgmGain, now);
    this.playToneToGain(
      AUDIO_CONFIG.bgmPadFrequency * 1.5,
      AUDIO_CONFIG.bgmPadFrequency * 1.5,
      3.5,
      0.035,
      'sine',
      this.bgmGain,
      now + 0.04
    );
  }

  private playKick(now: number): void {
    if (!this.context || !this.bgmGain) return;
    this.playToneToGain(78, 38, 0.22, 0.28, 'sine', this.bgmGain, now);
  }

  private playTone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    wave: OscillatorType
  ): void {
    if (!this.context || !this.sfxGain) return;
    this.playToneToGain(startFrequency, endFrequency, duration, volume, wave, this.sfxGain);
  }

  private playToneToGain(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    wave: OscillatorType,
    output: GainNode,
    startAt = this.context?.currentTime ?? 0
  ): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(startFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  }

  private playNoiseBurst(startAt: number, duration: number, volume: number, startFrequency = 850, endFrequency = 110): void {
    if (!this.context || !this.sfxGain) return;
    const bufferSize = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFrequency, startAt);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(startAt);
  }
}
