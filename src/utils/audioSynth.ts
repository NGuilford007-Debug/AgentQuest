// Web Audio API ambient generator & interactive sound effects
// Lightweight, zero-dependency procedural audio synthesis

let audioCtx: AudioContext | null = null;
let currentAmbientNodes: {
  stop: () => void;
} | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type AmbientSoundType = "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse" | "off";

export function playInteractiveSound(type: "coffee" | "gong" | "terminal" | "chime" | "laser" | "sip" | "click" | "level_up") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "gong") {
      // Warm zen gong
      const fundamental = 160;
      [1, 1.48, 2.05, 2.76, 3.45].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(fundamental * mult, now);
        const amp = 0.15 / (i + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
      });
    } else if (type === "coffee" || type === "sip") {
      // Pouring / bubbly hiss
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === "terminal") {
      // Sci-fi beep sequence
      const freqs = [880, 1174, 1320];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + (idx + 1) * 0.07);
      });
    } else if (type === "chime") {
      // Wind chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.1, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + i * 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + 1.4 + i * 0.1);
      });
    } else if (type === "laser") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    // Graceful fallback for environments with audio restrictions
  }
}

export function stopAmbientSound() {
  if (currentAmbientNodes) {
    try {
      currentAmbientNodes.stop();
    } catch {}
    currentAmbientNodes = null;
  }
}

export function startAmbientSound(track: AmbientSoundType, volume: number = 0.3) {
  stopAmbientSound();
  if (track === "off") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.25)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const activeOscillators: OscillatorNode[] = [];
    const activeIntervals: number[] = [];

    if (track === "cyber_hum" || track === "vault_pulse") {
      // Low drone with subtle resonant sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2 note

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(280, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      osc1.start();
      osc2.start();
      activeOscillators.push(osc1, osc2);
    } else if (track === "zen_rain" || track === "binaural_432") {
      // 432 Hz binaural pure healing tone with calm harmonics
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      const gain = ctx.createGain();

      oscLeft.type = "sine";
      oscLeft.frequency.setValueAtTime(432, ctx.currentTime);
      oscRight.type = "sine";
      oscRight.frequency.setValueAtTime(438, ctx.currentTime); // 6 Hz theta binaural beat

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscLeft.connect(gain);
      oscRight.connect(gain);
      gain.connect(masterGain);

      oscLeft.start();
      oscRight.start();
      activeOscillators.push(oscLeft, oscRight);
    } else if (track === "lofi_beats" || track === "cafe_chatter") {
      // Warm chord drone generator (Major 7th / 9th soothing pads)
      const chordNotes = [220, 277.18, 329.63, 415.3, 493.88]; // A Major 9
      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        activeOscillators.push(osc);
      });
    }

    currentAmbientNodes = {
      stop: () => {
        activeOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        activeIntervals.forEach((id) => clearInterval(id));
        try {
          masterGain.disconnect();
        } catch {}
      },
    };
  } catch (e) {
    console.warn("Audio synthesis initialization skipped:", e);
  }
}
