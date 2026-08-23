export type MatchClockState =
  | "PLAYING"
  | "PAUSED"
  | "REPLAY"
  | "HALF_TIME"
  | "MATCH_END"
  | "GOAL_PAUSE"
  | "KICKOFF"
  | "BALL_OUT";

export type MatchClockSnapshot = {
  realTime: number;
  elapsedTime: number;
  remainingTime: number;
  displayTime: number;
  state: MatchClockState;
  finished: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * The sole source of truth for a period. UI code may read displayTime, but it
 * never advances its own timer. Only PLAYING consumes real time.
 */
export class MatchClock {
  durationSeconds: number;
  elapsedTime = 0;
  state: MatchClockState = "PAUSED";
  private lastRealTimeMs: number | null = null;

  constructor(durationSeconds: number, remainingSeconds = durationSeconds) {
    this.durationSeconds = Math.max(0, durationSeconds);
    this.elapsedTime = clamp(this.durationSeconds - remainingSeconds, 0, this.durationSeconds);
  }

  reset(durationSeconds: number, remainingSeconds = durationSeconds, nowMs?: number) {
    this.durationSeconds = Math.max(0, durationSeconds);
    this.elapsedTime = clamp(this.durationSeconds - remainingSeconds, 0, this.durationSeconds);
    this.lastRealTimeMs = typeof nowMs === "number" ? nowMs : null;
    this.state = "PAUSED";
    return this.snapshot(nowMs ?? 0);
  }

  sync(nowMs: number) {
    this.lastRealTimeMs = nowMs;
  }

  tick(nowMs: number, state: MatchClockState): MatchClockSnapshot {
    const previous = this.lastRealTimeMs;
    this.lastRealTimeMs = nowMs;
    this.state = state;
    if (previous !== null && state === "PLAYING" && this.elapsedTime < this.durationSeconds) {
      const deltaSeconds = Math.max(0, nowMs - previous) / 1000;
      this.elapsedTime = clamp(this.elapsedTime + deltaSeconds, 0, this.durationSeconds);
    }
    return this.snapshot(nowMs);
  }

  get remainingTime() {
    return Math.max(0, this.durationSeconds - this.elapsedTime);
  }

  get displayTime() {
    return Math.max(0, Math.ceil(this.remainingTime - 0.000001));
  }

  get finished() {
    return this.elapsedTime >= this.durationSeconds;
  }

  snapshot(nowMs = this.lastRealTimeMs ?? 0): MatchClockSnapshot {
    return {
      realTime: nowMs / 1000,
      elapsedTime: this.elapsedTime,
      remainingTime: this.remainingTime,
      displayTime: this.displayTime,
      state: this.state,
      finished: this.finished,
    };
  }
}

export function formatMatchTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
