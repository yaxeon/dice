export class DiceSound {
  constructor(createContext = () => {
    const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return AudioContext ? new AudioContext() : null;
  }) {
    this.createContext = createContext;
    this.context = null;
    this.buffer = null;
    this.voices = new Set();
    this.nextPulse = 0;
  }

  // Called synchronously from a user gesture, including the first pointerdown.
  unlock() {
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = this.createContext();
        if (!this.context) return;
        const rate = this.context.sampleRate;
        this.buffer = this.context.createBuffer(1, Math.ceil(rate * .06), rate);
        const samples = this.buffer.getChannelData(0);
        // A dry plastic clack: a short noise attack and two damped resonances.
        for (let i = 0; i < samples.length; i += 1) {
          const time = i / rate;
          const attack = Math.min(time / .0008, 1);
          const noise = (Math.random() * 2 - 1) * Math.exp(-time * 220);
          const body = Math.sin(2 * Math.PI * 1650 * time) * Math.exp(-time * 100);
          const overtone = Math.sin(2 * Math.PI * 2870 * time) * Math.exp(-time * 150);
          samples[i] = attack * (.6 * noise + .25 * body + .15 * overtone);
        }
      }
      if (this.context.state !== 'running') this.context.resume().catch(() => {});
    } catch {
      // Audio restrictions or unavailable hardware must never block a roll.
      this.context = null;
    }
  }

  tick(progress = 0, count = 1) {
    if (this.context?.state !== 'running') return;
    const now = this.context.currentTime;
    if (now < this.nextPulse || progress >= 1) return;
    try {
      const intensity = .2 + .8 * (1 - progress);
      for (let i = 0; i < count; i += 1) {
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        source.buffer = this.buffer;
        source.playbackRate.value = .85 + Math.random() * .3;
        gain.gain.value = .24 * intensity / Math.sqrt(count);
        source.connect(gain);
        gain.connect(this.context.destination);
        const voice = { source, gain };
        this.voices.add(voice);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          this.voices.delete(voice);
        };
        source.start(now + i * .006);
      }
      this.nextPulse = now + (.04 + progress * .11) * (.85 + Math.random() * .3);
    } catch {
      this.stop();
    }
  }

  stop() {
    const now = this.context?.currentTime ?? 0;
    for (const { source, gain } of this.voices) {
      try {
        gain.gain.setTargetAtTime(0, now, .003);
        source.stop(now + .015);
      } catch {
        source.disconnect();
        gain.disconnect();
      }
    }
    this.voices.clear();
    this.nextPulse = 0;
  }
}
