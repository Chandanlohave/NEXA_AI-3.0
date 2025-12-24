
// Sound synthesis using Web Audio API

const createOscillator = (ctx: AudioContext, type: OscillatorType, freq: number, startTime: number, duration: number, vol: number = 0.1) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playStartupSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;

  // Low hum rising
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(50, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 1.5);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.5);
  gain.gain.linearRampToValueAtTime(0, t + 1.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1.5);

  // High pitch energetic spin up
  createOscillator(ctx, 'sine', 200, t, 1.0, 0.1);
  createOscillator(ctx, 'square', 400, t + 0.2, 0.8, 0.05);
  createOscillator(ctx, 'sine', 800, t + 0.4, 0.6, 0.1);
};

export const playAccessGrantedSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;
  
  // Ethereal Chime (Ascending)
  createOscillator(ctx, 'sine', 880, t, 0.2, 0.1); // A5
  createOscillator(ctx, 'sine', 1108, t + 0.1, 0.2, 0.1); // C#6
  createOscillator(ctx, 'sine', 1318, t + 0.2, 0.4, 0.1); // E6
  createOscillator(ctx, 'triangle', 1760, t + 0.2, 0.6, 0.05); // A6 (Sparkle)
};

export const playSecurityAlertSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;

  // Deep Bass Impact
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.linearRampToValueAtTime(40, t + 0.5); // Pitch drop
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1);

  // Warning Siren Texture
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(150, t);
  osc2.frequency.linearRampToValueAtTime(140, t + 0.1); // Vibrato-ish
  gain2.gain.setValueAtTime(0.1, t);
  gain2.gain.linearRampToValueAtTime(0, t + 0.8);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.8);
};

export const playAdminLoginSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;
  
  // A soft, low-frequency hum
  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(80, t);
  humGain.gain.setValueAtTime(0, t);
  humGain.gain.linearRampToValueAtTime(0.1, t + 0.1);
  humGain.gain.linearRampToValueAtTime(0, t + 0.8);
  hum.connect(humGain);
  humGain.connect(ctx.destination);
  hum.start(t);
  hum.stop(t + 0.8);

  // A gentle, ascending chime sequence
  createOscillator(ctx, 'triangle', 600, t + 0.1, 0.3, 0.08);
  createOscillator(ctx, 'triangle', 900, t + 0.25, 0.3, 0.08);
  createOscillator(ctx, 'triangle', 1200, t + 0.4, 0.4, 0.05); // Last note fades longer
};

export const playReactorActiveSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;

  // Sharp mechanical activation
  createOscillator(ctx, 'sine', 800, t, 0.1, 0.1);
  
  // Power up sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
};

export const playReactorDeactiveSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const t = ctx.currentTime;

  // Power down sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(2000, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
};
