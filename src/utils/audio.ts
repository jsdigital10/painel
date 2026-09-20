/**
 * Proprietary Harmonic Chime for Central de Agendamentos.
 * Pure Web Audio API synthesis - zero external audio assets or proprietary copies.
 * Distinctive, modern, subtle two-tone acoustic bell chime with exponential decay.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays the signature "Novo Agendamento" celebration chime.
 */
export function playNewAppointmentChime(soundEnabled: boolean = true): void {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain for smooth volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    // Note 1: Sparkling D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // subtle glide to E5

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.7);

    // Note 2: Euphoric A5 (880.00 Hz) with overtone
    const note2Time = now + 0.11;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, note2Time);

    gain2.gain.setValueAtTime(0.001, note2Time);
    gain2.gain.linearRampToValueAtTime(0.5, note2Time + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, note2Time + 0.95);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(note2Time);
    osc2.stop(note2Time + 1.0);

    // Subtle C#6 shimmer overtone (1108.73 Hz) for crystal bell texture
    const oscShimmer = ctx.createOscillator();
    const gainShimmer = ctx.createGain();
    oscShimmer.type = 'triangle';
    oscShimmer.frequency.setValueAtTime(1108.73, note2Time);

    gainShimmer.gain.setValueAtTime(0.001, note2Time);
    gainShimmer.gain.linearRampToValueAtTime(0.12, note2Time + 0.03);
    gainShimmer.gain.exponentialRampToValueAtTime(0.0001, note2Time + 0.7);

    oscShimmer.connect(gainShimmer);
    gainShimmer.connect(masterGain);

    oscShimmer.start(note2Time);
    oscShimmer.stop(note2Time + 0.8);
  } catch (err) {
    console.warn('Unable to play appointment chime:', err);
  }
}
