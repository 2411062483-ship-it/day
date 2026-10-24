// Procedural Web Audio API sound effects for Tower Companions
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;

  constructor() {
    // Check muted state from localStorage if available
    try {
      this.isMuted = localStorage.getItem('tower_sound_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('tower_sound_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Sword slash / physical strike
  public playSlash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Bow arrow release & whiz
  public playArrow() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Fireball / magic explosion
  public playMagic() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);

    gain.gain.setValueAtTime(this.volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  // Shield bash / heavy blunt impact
  public playShieldBash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Holy heal shimmer
  public playHeal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.volume * 0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.34);
    });
  }

  // Boss Roar
  public playBossRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    gain.gain.setValueAtTime(this.volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Level up fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.volume * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  // Gold chime
  public playGold() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Button click
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Trap trigger
  public playTrap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Error buzz when MP is insufficient or action is illegal
  public playErrorBuzz() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.08].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now + offset);
      osc.frequency.setValueAtTime(95, now + offset + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.45, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.065);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  // Heavy booming barrel explosion
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    gain.gain.setValueAtTime(this.volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Crystalline Ice Shatter combo chime
  public playShatter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1567.98, 2093.0, 2637.02, 3135.96]; // G6, C7, E7, G7
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, start + 0.2);

      gain.gain.setValueAtTime(this.volume * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.21);
    });
  }

  // Heavy Wall Slam impact thud
  public playWallSlam() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    gain.gain.setValueAtTime(this.volume * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Tactical RPG Anime-style Skill Cut-In Whoosh & Flare
  public playCutIn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Energy whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
    gain.gain.setValueAtTime(this.volume * 0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);

    // High sheen shimmer
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1760, now + 0.1);
    chime.frequency.exponentialRampToValueAtTime(2349, now + 0.35);
    chimeGain.gain.setValueAtTime(this.volume * 0.45, now + 0.1);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now + 0.1);
    chime.stop(now + 0.41);
  }

  // Hero / Enemy collapse & downed thud
  public playDowned() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Heavy collapse thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    gain.gain.setValueAtTime(this.volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // Low sorrowful minor tone
    const minorOsc = this.ctx.createOscillator();
    const minorGain = this.ctx.createGain();
    minorOsc.type = 'sine';
    minorOsc.frequency.setValueAtTime(220, now + 0.1); // A3
    minorOsc.frequency.exponentialRampToValueAtTime(164.81, now + 0.5); // E3
    minorGain.gain.setValueAtTime(this.volume * 0.35, now + 0.1);
    minorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    minorOsc.connect(minorGain);
    minorGain.connect(this.ctx.destination);
    minorOsc.start(now + 0.1);
    minorOsc.stop(now + 0.56);
  }

  // Deep menacing Boss Intro War Horn / Gong
  public playBossIntro() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low brass war horn
    const freqs = [73.42, 110, 146.83]; // D2, A2, D3
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 1.2);
      gain.gain.setValueAtTime(this.volume * 0.5, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + 1.35);
    });
  }

  // Grand Boss Defeat Triumphant Victory Fanfare
  public playBossVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Chords: D - F# - A - D - E - F# - A
    const sequence = [
      { f: 293.66, t: 0, d: 0.25 }, // D4
      { f: 369.99, t: 0.14, d: 0.25 }, // F#4
      { f: 440.00, t: 0.28, d: 0.25 }, // A4
      { f: 587.33, t: 0.44, d: 0.7 }, // D5 (Hold)
      { f: 659.25, t: 0.72, d: 0.25 }, // E5
      { f: 739.99, t: 0.92, d: 0.3 }, // F#5
      { f: 880.00, t: 1.15, d: 1.1 }, // A5 (Final grand crescendo)
    ];

    sequence.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + note.t;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, start);
      gain.gain.setValueAtTime(this.volume * 0.55, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + note.d + 0.05);
    });
  }
}

export const sound = new SoundEngine();
