// Sound & Ringtone Engine for Yaamaa using Web Audio API

let activeAudioCtx: AudioContext | null = null;
let currentRingingOsc: { stop: () => void } | null = null;

export function playYaamaaSound(type: "call" | "message" | "gift" | "payment" | "alert" | "security", volumePercent: number = 80, enabled: boolean = true) {
  if (!enabled || volumePercent <= 0) return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const masterGain = ctx.createGain();
    const vol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.15;
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "message") {
      // Pleasant double ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "gift") {
      // Sparkling arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(vol, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } else if (type === "payment") {
      // Cash register / coin chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.1);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);
      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.4);
    } else if (type === "security" || type === "alert") {
      // Urgent warning chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(450, now + 0.15);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Standard notification chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

export function startRingtone(volumePercent: number = 80, enabled: boolean = true) {
  if (!enabled || volumePercent <= 0) return () => {};
  if (currentRingingOsc) return () => {};

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};
    const ctx = new AudioContextClass();
    activeAudioCtx = ctx;

    const vol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.2;
    let isRunning = true;

    const ringLoop = () => {
      if (!isRunning) return;
      const now = ctx.currentTime;
      
      // Dual tone ring pattern (e.g. 440Hz + 480Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.05);
      gain.gain.setValueAtTime(vol, now + 1.2);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);

      const timeout = setTimeout(() => {
        if (isRunning) ringLoop();
      }, 3000);

      currentRingingOsc = {
        stop: () => {
          isRunning = false;
          clearTimeout(timeout);
          try {
            ctx.close();
          } catch (e) {}
        }
      };
    };

    ringLoop();

    return () => {
      if (currentRingingOsc) {
        currentRingingOsc.stop();
        currentRingingOsc = null;
      }
    };
  } catch (e) {
    console.error("Ringtone error:", e);
    return () => {};
  }
}

export function stopRingtone() {
  if (currentRingingOsc) {
    currentRingingOsc.stop();
    currentRingingOsc = null;
  }
}
