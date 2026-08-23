export type MusicScene = "MENU" | "TOURNAMENT" | "FINAL" | "MATCH";
export type MusicTrackId = "MINI_SOCCER_THEME" | "NIGHT_MATCH" | "ONE_MORE_GOAL" | "ROAD_TO_THE_CUP";

export type ProceduralTrack = {
  id: MusicTrackId;
  title: string;
  bpm: number;
  bars: number;
  waveform: OscillatorType;
  lead: Array<number | null>;
  bass: number[];
  chords: number[];
  brightness: number;
};

/** Original four-note identity: D, F, A, C, transformed by every track. */
export const MINI_SOCCER_MOTIF = [62, 65, 69, 72] as const;
export const MUSIC_SILENCE_RANGE_SECONDS = [10, 35] as const;
export const MUSIC_FADE_SECONDS = { in: 2, out: 2.3, match: 1.8 } as const;

export const MUSIC_TRACKS: readonly ProceduralTrack[] = [
  {
    id: "MINI_SOCCER_THEME",
    title: "Mini Soccer Theme",
    bpm: 124,
    bars: 40,
    waveform: "triangle",
    lead: [62, null, 65, 69, 72, null, 69, 65, 62, null, 65, 69, 74, 72, 69, null],
    bass: [38, 38, 41, 45],
    chords: [50, 53, 57, 55],
    brightness: 0.82,
  },
  {
    id: "NIGHT_MATCH",
    title: "Night Match",
    bpm: 114,
    bars: 37,
    waveform: "sine",
    lead: [57, null, null, 60, null, 64, null, null, 67, null, 64, null, 60, null, null, null],
    bass: [33, 36, 40, 38],
    chords: [45, 48, 52, 50],
    brightness: 0.42,
  },
  {
    id: "ONE_MORE_GOAL",
    title: "One More Goal",
    bpm: 128,
    bars: 40,
    waveform: "sawtooth",
    lead: [69, null, 72, 74, null, 72, 69, null, 65, null, 69, 72, 77, 74, 72, null],
    bass: [38, 41, 45, 43],
    chords: [50, 53, 57, 55],
    brightness: 0.94,
  },
  {
    id: "ROAD_TO_THE_CUP",
    title: "Road to the Cup",
    bpm: 116,
    bars: 37,
    waveform: "triangle",
    lead: [50, null, 53, null, 57, null, 60, null, 62, null, 60, 57, 65, null, 62, null],
    bass: [31, 34, 38, 36],
    chords: [43, 46, 50, 48],
    brightness: 0.66,
  },
] as const;

export const MUSIC_POOLS: Record<MusicScene, readonly MusicTrackId[]> = {
  MENU: ["MINI_SOCCER_THEME", "NIGHT_MATCH", "ONE_MORE_GOAL"],
  TOURNAMENT: ["ROAD_TO_THE_CUP", "NIGHT_MATCH", "MINI_SOCCER_THEME"],
  FINAL: ["ROAD_TO_THE_CUP", "MINI_SOCCER_THEME"],
  MATCH: [],
};

export function trackDurationSeconds(track: ProceduralTrack) {
  return track.bars * 4 * 60 / track.bpm;
}

export function chooseNextTrack(scene: MusicScene, previous: MusicTrackId | null, rng: () => number = Math.random) {
  const pool = MUSIC_POOLS[scene];
  if (!pool.length) return null;
  if (scene === "FINAL" && previous !== "ROAD_TO_THE_CUP") return MUSIC_TRACKS.find(track => track.id === "ROAD_TO_THE_CUP") ?? null;
  const available = pool.filter(id => id !== previous);
  const ids = available.length ? available : pool;
  const id = ids[Math.min(ids.length - 1, Math.floor(rng() * ids.length))];
  return MUSIC_TRACKS.find(track => track.id === id) ?? null;
}

const midiFrequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

export class MusicManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timer: number | null = null;
  private unlocked = false;
  private enabled = true;
  private masterVolume = 0.85;
  private musicVolume = 0.45;
  private scene: MusicScene = "MENU";
  private currentTrack: ProceduralTrack | null = null;
  private previousTrack: MusicTrackId | null = null;
  private trackStartedAt = 0;
  private nextStep = 0;
  private nextStepAt = 0;
  private generation = 0;
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  attachUnlock(target: Window = window) {
    const unlock = () => {
      this.unlocked = true;
      this.ensureContext();
      void this.context?.resume();
      if (this.enabled && !this.currentTrack && this.scene !== "MATCH") this.startTrack();
    };
    target.addEventListener("pointerdown", unlock, { once: true });
    return () => target.removeEventListener("pointerdown", unlock);
  }

  configure(args: { enabled: boolean; master: number; music: number }) {
    this.masterVolume = Math.max(0, Math.min(1, args.master / 100));
    this.musicVolume = Math.max(0, Math.min(1, args.music / 100));
    const wasEnabled = this.enabled;
    this.enabled = args.enabled && this.masterVolume > 0 && this.musicVolume > 0;
    this.updateMasterGain();
    if (!this.enabled && wasEnabled) this.fadeOutCurrent(1.5, false);
    else if (this.enabled && !wasEnabled && this.unlocked && this.scene !== "MATCH") this.scheduleNext(300);
  }

  setScene(scene: MusicScene) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (scene === "MATCH") this.fadeOutCurrent(MUSIC_FADE_SECONDS.match, false);
    else if (scene === "FINAL" && this.currentTrack?.id !== "ROAD_TO_THE_CUP") this.fadeOutCurrent(MUSIC_FADE_SECONDS.match, true);
    else if (this.enabled && this.unlocked && !this.currentTrack) this.scheduleNext(500);
  }

  getDebugState() {
    return {
      scene: this.scene,
      enabled: this.enabled,
      unlocked: this.unlocked,
      currentTrack: this.currentTrack?.id ?? null,
      previousTrack: this.previousTrack,
      trackStartedAt: this.trackStartedAt,
    };
  }

  destroy() {
    this.generation += 1;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.fadeOutCurrent(0.08, false);
    void this.context?.close();
    this.context = null;
  }

  private ensureContext() {
    if (this.context) return this.context;
    const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Constructor();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.updateMasterGain();
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.18), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = (this.rng() * 2 - 1) * (1 - index / data.length);
    this.noiseBuffer = buffer;
    return this.context;
  }

  private updateMasterGain() {
    if (!this.context || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.enabled ? this.masterVolume * this.musicVolume : 0.0001, this.context.currentTime, 0.08);
  }

  private startTrack() {
    if (!this.enabled || !this.unlocked || this.scene === "MATCH") return;
    const context = this.ensureContext();
    const track = chooseNextTrack(this.scene, this.previousTrack, this.rng);
    if (!track || !this.masterGain) return;
    this.generation += 1;
    const generation = this.generation;
    this.currentTrack = track;
    this.trackStartedAt = context.currentTime + 0.08;
    this.nextStepAt = this.trackStartedAt;
    this.nextStep = 0;
    this.trackGain = context.createGain();
    this.trackGain.gain.setValueAtTime(0.0001, context.currentTime);
    this.trackGain.gain.exponentialRampToValueAtTime(0.86, this.trackStartedAt + MUSIC_FADE_SECONDS.in);
    const duration = trackDurationSeconds(track);
    this.trackGain.gain.setValueAtTime(0.86, Math.max(this.trackStartedAt + MUSIC_FADE_SECONDS.in, this.trackStartedAt + duration - MUSIC_FADE_SECONDS.out));
    this.trackGain.gain.exponentialRampToValueAtTime(0.0001, this.trackStartedAt + duration);
    this.trackGain.connect(this.masterGain);
    this.schedule(generation);
  }

  private schedule(generation: number) {
    if (generation !== this.generation || !this.currentTrack || !this.context || !this.trackGain) return;
    const track = this.currentTrack;
    const stepDuration = 60 / track.bpm / 4;
    const totalSteps = track.bars * 16;
    while (this.nextStep < totalSteps && this.nextStepAt < this.context.currentTime + 0.38) {
      this.scheduleStep(track, this.nextStep, this.nextStepAt);
      this.nextStep += 1;
      this.nextStepAt += stepDuration;
    }
    if (this.nextStep >= totalSteps && this.context.currentTime >= this.trackStartedAt + trackDurationSeconds(track)) {
      this.previousTrack = track.id;
      this.currentTrack = null;
      this.trackGain = null;
      this.timer = null;
      if (this.enabled && this.scene !== "MATCH") this.scheduleNext((MUSIC_SILENCE_RANGE_SECONDS[0] + this.rng() * (MUSIC_SILENCE_RANGE_SECONDS[1] - MUSIC_SILENCE_RANGE_SECONDS[0])) * 1000);
      return;
    }
    this.timer = window.setTimeout(() => this.schedule(generation), 90);
  }

  private scheduleNext(delayMs: number) {
    if (this.timer !== null) window.clearTimeout(this.timer);
    const generation = ++this.generation;
    this.timer = window.setTimeout(() => {
      if (generation !== this.generation || !this.enabled || this.scene === "MATCH" || this.currentTrack) return;
      this.timer = null;
      this.startTrack();
    }, delayMs);
  }

  private fadeOutCurrent(seconds: number, scheduleAfter: boolean) {
    this.generation += 1;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    if (this.context && this.trackGain) {
      const now = this.context.currentTime;
      this.trackGain.gain.cancelScheduledValues(now);
      this.trackGain.gain.setValueAtTime(Math.max(0.0001, this.trackGain.gain.value), now);
      this.trackGain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    }
    if (this.currentTrack) this.previousTrack = this.currentTrack.id;
    this.currentTrack = null;
    this.trackGain = null;
    if (scheduleAfter && this.enabled && this.scene !== "MATCH") this.scheduleNext(seconds * 1000 + 300);
  }

  private scheduleStep(track: ProceduralTrack, step: number, at: number) {
    const beat = step % 16;
    const bar = Math.floor(step / 16);
    const lead = track.lead[beat % track.lead.length];
    const stepDuration = 60 / track.bpm / 4;
    if (lead !== null && (bar % 4 !== 3 || beat % 4 === 0)) this.tone(midiFrequency(lead + (bar % 8 === 7 ? 12 : 0)), at, stepDuration * 1.65, 0.034, track.waveform, 900 + track.brightness * 1700);
    if (beat % 4 === 0) {
      const bassNote = track.bass[(bar + beat / 4) % track.bass.length];
      this.tone(midiFrequency(bassNote), at, stepDuration * 3.1, 0.052, track.id === "NIGHT_MATCH" ? "sine" : "square", 310);
    }
    if (beat === 0) {
      const chord = track.chords[bar % track.chords.length];
      for (const offset of [0, 7, 12]) this.tone(midiFrequency(chord + offset), at, stepDuration * 14.5, 0.011, "sine", 720 + track.brightness * 620);
    }
    if (beat === 0 || beat === 8 || (track.id === "ONE_MORE_GOAL" && beat === 10)) this.kick(at);
    if (beat === 4 || beat === 12) this.clap(at, track.brightness);
  }

  private tone(frequency: number, start: number, duration: number, volume: number, waveform: OscillatorType, cutoff: number) {
    if (!this.context || !this.trackGain) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter).connect(gain).connect(this.trackGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private kick(start: number) {
    if (!this.context || !this.trackGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(125, start);
    oscillator.frequency.exponentialRampToValueAtTime(43, start + 0.16);
    gain.gain.setValueAtTime(0.075, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    oscillator.connect(gain).connect(this.trackGain);
    oscillator.start(start);
    oscillator.stop(start + 0.19);
  }

  private clap(start: number, brightness: number) {
    if (!this.context || !this.trackGain || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 950 + brightness * 1200;
    gain.gain.setValueAtTime(0.028, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
    source.connect(filter).connect(gain).connect(this.trackGain);
    source.start(start);
  }
}
