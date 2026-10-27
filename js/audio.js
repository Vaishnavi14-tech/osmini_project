/**
 * Audio Synthesizer for RailOS Visualizer
 * Uses Web Audio API to create subtle, modern tactile feedback
 * Zero external audio files required!
 */

class SoundEffects {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type, duration, volume = 0.05) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type; // 'sine', 'triangle', 'square', 'sawtooth'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked by browser autoplay policy until user gesture
    }
  }

  click() {
    this.playTone(600, 'sine', 0.06, 0.03);
  }

  step() {
    this.playTone(440, 'triangle', 0.08, 0.04);
  }

  success() {
    if (!this.enabled) return;
    this.playTone(523.25, 'sine', 0.12, 0.04); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.04), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.22, 0.04), 200); // G5
  }

  warning() {
    if (!this.enabled) return;
    this.playTone(320, 'sawtooth', 0.15, 0.04);
    setTimeout(() => this.playTone(280, 'sawtooth', 0.2, 0.04), 120);
  }

  produce() {
    this.playTone(750, 'sine', 0.09, 0.04);
  }

  consume() {
    this.playTone(380, 'sine', 0.09, 0.04);
  }
}

window.soundFx = new SoundEffects();
