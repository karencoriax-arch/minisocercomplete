export type GameMode = "PLAYING" | "GOAL_PAUSE" | "REPLAY" | "KICKOFF" | "PAUSED";

export type ReplayBallSnapshot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export type ReplayPlayerSnapshot = {
  id: number;
  teamId: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  animationState: "IDLE" | "MOVING";
};

export type ReplayCameraSnapshot = {
  x: number;
  y: number;
  zoom: number;
};

export type ReplaySnapshot = {
  timestamp: number;
  ball: ReplayBallSnapshot;
  players: ReplayPlayerSnapshot[];
  camera: ReplayCameraSnapshot;
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function isValidReplaySnapshot(value: unknown): value is ReplaySnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<ReplaySnapshot>;
  if (!finite(snapshot.timestamp) || !snapshot.ball || !snapshot.camera || !Array.isArray(snapshot.players)) return false;
  if (![snapshot.ball.x, snapshot.ball.y, snapshot.ball.vx, snapshot.ball.vy, snapshot.ball.r].every(finite)) return false;
  if (![snapshot.camera.x, snapshot.camera.y, snapshot.camera.zoom].every(finite) || snapshot.camera.zoom <= 0) return false;
  return snapshot.players.length > 0 && snapshot.players.every((player) =>
    player !== null
    && typeof player === "object"
    && finite(player.id)
    && (player.teamId === 0 || player.teamId === 1)
    && [player.x, player.y, player.vx, player.vy, player.facing].every(finite)
    && (player.animationState === "IDLE" || player.animationState === "MOVING")
  );
}

function cloneSnapshot(snapshot: ReplaySnapshot): ReplaySnapshot {
  return {
    timestamp: snapshot.timestamp,
    ball: { ...snapshot.ball },
    players: snapshot.players.map((player) => ({ ...player })),
    camera: { ...snapshot.camera },
  };
}

/**
 * Bounded 25 Hz replay history. It stores plain render snapshots only and has
 * no reference to the live physics objects.
 */
export class ReplayBuffer {
  private frames: ReplaySnapshot[] = [];
  private lastRecordedAt = Number.NEGATIVE_INFINITY;
  readonly maxDurationMs: number;
  readonly sampleIntervalMs: number;

  constructor(maxDurationMs = 6000, sampleIntervalMs = 40) {
    this.maxDurationMs = maxDurationMs;
    this.sampleIntervalMs = sampleIntervalMs;
  }

  record(snapshot: ReplaySnapshot) {
    if (!isValidReplaySnapshot(snapshot)) return false;
    if (snapshot.timestamp - this.lastRecordedAt < this.sampleIntervalMs) return false;
    this.frames.push(cloneSnapshot(snapshot));
    this.lastRecordedAt = snapshot.timestamp;
    const oldestAllowed = snapshot.timestamp - this.maxDurationMs;
    while (this.frames.length > 1 && this.frames[0].timestamp < oldestAllowed) this.frames.shift();
    return true;
  }

  capture(windowMs = 5200) {
    const valid = this.frames.filter(isValidReplaySnapshot);
    if (valid.length < 2) return [];
    const newest = valid[valid.length - 1].timestamp;
    return valid.filter((frame) => frame.timestamp >= newest - windowMs).map(cloneSnapshot);
  }

  clear() {
    this.frames = [];
    this.lastRecordedAt = Number.NEGATIVE_INFINITY;
  }

  get size() {
    return this.frames.length;
  }
}

export function sampleReplay(clip: ReplaySnapshot[], progress: number): ReplaySnapshot | null {
  if (clip.length < 2 || !clip.every(isValidReplaySnapshot)) return null;
  const first = clip[0];
  const last = clip[clip.length - 1];
  const targetTime = lerp(first.timestamp, last.timestamp, clamp01(progress));
  let upperIndex = clip.findIndex((frame) => frame.timestamp >= targetTime);
  if (upperIndex < 0) upperIndex = clip.length - 1;
  if (upperIndex === 0) return cloneSnapshot(first);
  const before = clip[upperIndex - 1];
  const after = clip[upperIndex];
  if (before.players.length !== after.players.length) return cloneSnapshot(before);
  const span = Math.max(1, after.timestamp - before.timestamp);
  const amount = clamp01((targetTime - before.timestamp) / span);
  return {
    timestamp: targetTime,
    ball: {
      x: lerp(before.ball.x, after.ball.x, amount),
      y: lerp(before.ball.y, after.ball.y, amount),
      vx: lerp(before.ball.vx, after.ball.vx, amount),
      vy: lerp(before.ball.vy, after.ball.vy, amount),
      r: lerp(before.ball.r, after.ball.r, amount),
    },
    players: before.players.map((player, index) => {
      const next = after.players[index];
      return {
        ...player,
        x: lerp(player.x, next.x, amount),
        y: lerp(player.y, next.y, amount),
        vx: lerp(player.vx, next.vx, amount),
        vy: lerp(player.vy, next.vy, amount),
        facing: lerp(player.facing, next.facing, amount),
        animationState: amount < 0.5 ? player.animationState : next.animationState,
      };
    }),
    camera: {
      x: lerp(before.camera.x, after.camera.x, amount),
      y: lerp(before.camera.y, after.camera.y, amount),
      zoom: lerp(before.camera.zoom, after.camera.zoom, amount),
    },
  };
}

export type ReplayControllerOptions = {
  goalPauseMs?: number;
  replayDurationMs?: number;
  watchdogMs?: number;
};

/** Explicit state machine. KICKOFF is intentionally a separate one-shot state. */
export class ReplayController {
  mode: GameMode = "PLAYING";
  private modeStartedAt = 0;
  private clip: ReplaySnapshot[] = [];
  private automatic = true;
  readonly goalPauseMs: number;
  readonly replayDurationMs: number;
  readonly watchdogMs: number;

  constructor(options: ReplayControllerOptions = {}) {
    this.goalPauseMs = options.goalPauseMs ?? 1050;
    this.replayDurationMs = options.replayDurationMs ?? 3400;
    this.watchdogMs = options.watchdogMs ?? 8000;
  }

  enterGoalPause(now: number, clip: ReplaySnapshot[], automatic = true) {
    this.mode = "GOAL_PAUSE";
    this.modeStartedAt = now;
    this.clip = clip.filter(isValidReplaySnapshot).map(cloneSnapshot);
    this.automatic = automatic;
  }

  pause(now: number) {
    if (this.mode === "REPLAY") return false;
    this.mode = "PAUSED";
    this.modeStartedAt = now;
    return true;
  }

  resume(now: number) {
    if (this.mode !== "PAUSED") return false;
    this.mode = "PLAYING";
    this.modeStartedAt = now;
    return true;
  }

  tick(now: number) {
    const elapsed = Math.max(0, now - this.modeStartedAt);
    if (this.mode === "GOAL_PAUSE" && elapsed >= this.goalPauseMs) {
      if (this.automatic && this.clip.length >= 2 && this.clip.every(isValidReplaySnapshot)) {
        this.mode = "REPLAY";
        this.modeStartedAt = now;
      } else {
        this.mode = "KICKOFF";
        this.modeStartedAt = now;
      }
    } else if (this.mode === "REPLAY" && (elapsed >= this.replayDurationMs || elapsed >= this.watchdogMs)) {
      this.mode = "KICKOFF";
      this.modeStartedAt = now;
    }
    return this.mode;
  }

  getFrame(now: number) {
    if (this.mode !== "REPLAY") return null;
    if (now - this.modeStartedAt >= this.watchdogMs) {
      this.exitReplaySafely(now);
      return null;
    }
    const frame = sampleReplay(this.clip, (now - this.modeStartedAt) / this.replayDurationMs);
    if (!frame) this.exitReplaySafely(now);
    return frame;
  }

  skip(now: number) {
    if (this.mode !== "REPLAY" && this.mode !== "GOAL_PAUSE") return false;
    this.exitReplaySafely(now);
    return true;
  }

  exitReplaySafely(now: number) {
    this.mode = "KICKOFF";
    this.modeStartedAt = now;
    this.clip = [];
  }

  completeKickoff(now: number) {
    if (this.mode !== "KICKOFF") return false;
    this.mode = "PLAYING";
    this.modeStartedAt = now;
    this.clip = [];
    return true;
  }

  forcePlaying(now: number) {
    this.mode = "PLAYING";
    this.modeStartedAt = now;
    this.clip = [];
  }
}
