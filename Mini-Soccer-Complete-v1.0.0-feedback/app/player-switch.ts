export type SwitchPlayer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  team: 0 | 1;
  role: string;
};

export type SwitchBall = { x: number; y: number; vx: number; vy: number; r: number };
export type SwitchContext = "ATTACK" | "DEFENSE" | "LOOSE";
export type AutoSwitchMode = "SMART" | "PASSES_AND_LOOSE" | "PASSES_ONLY" | "MANUAL";
export type SwitchMoveAssist = "NONE" | "LOW" | "HIGH";

export type SwitchCandidate = {
  index: number;
  timeToBall: number;
  interceptPoint: { x: number; y: number };
  score: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function predictBallPosition(ball: SwitchBall, seconds: number) {
  const drag = seconds <= 0 ? 1 : (1 - Math.exp(-2.15 * seconds)) / Math.max(0.001, 2.15 * seconds);
  return { x: ball.x + ball.vx * seconds * drag, y: ball.y + ball.vy * seconds * drag };
}

export function estimateTimeToBall(player: SwitchPlayer, ball: SwitchBall, playerMaxSpeed = 188) {
  const reaction = player.role === "ARQ" ? 0.12 : 0.07;
  let best = { time: 3, point: predictBallPosition(ball, 3) };
  for (let time = 0; time <= 2.5; time += 0.05) {
    const point = predictBallPosition(ball, time);
    const currentMomentum = Math.max(0, (player.vx * (point.x - player.x) + player.vy * (point.y - player.y)) / (Math.hypot(point.x - player.x, point.y - player.y) || 1));
    const reachable = player.r + 10 + Math.max(0, time - reaction) * playerMaxSpeed + Math.min(34, currentMomentum * time * 0.16);
    if (Math.hypot(point.x - player.x, point.y - player.y) <= reachable) {
      best = { time, point };
      break;
    }
  }
  return best;
}

export function rankSwitchCandidates(args: {
  players: SwitchPlayer[];
  start: number;
  end: number;
  current: number;
  ball: SwitchBall;
  ownGoalX: number;
  attackingDirection: 1 | -1;
  context: SwitchContext;
  includeCurrent?: boolean;
}) {
  const candidates: SwitchCandidate[] = [];
  const ballSpeed = Math.hypot(args.ball.vx, args.ball.vy);
  for (let index = args.start; index < args.end; index++) {
    const player = args.players[index];
    if (!player || player.role === "ARQ" || (!args.includeCurrent && index === args.current)) continue;
    const arrival = estimateTimeToBall(player, args.ball);
    const directDistance = Math.hypot(player.x - args.ball.x, player.y - args.ball.y);
    const trajectoryDistance = Math.hypot(player.x - arrival.point.x, player.y - arrival.point.y);
    const isGoalSide = args.attackingDirection > 0 ? player.x <= args.ball.x : player.x >= args.ball.x;
    const formationRisk = args.context === "DEFENSE" && player.role === "DEF" && !isGoalSide ? 48 : 0;
    const roleFit = args.context === "ATTACK"
      ? (player.role === "DEL" || player.role === "EXT" ? 34 : player.role === "MED" ? 18 : 0)
      : (player.role === "DEF" ? 30 : player.role === "MED" ? 20 : 0);
    const goalSide = args.context === "DEFENSE" && isGoalSide ? 44 : 0;
    const trajectoryRelevance = ballSpeed > 35 ? clamp(95 - trajectoryDistance * 0.45, -35, 95) : 0;
    const goalDistancePenalty = args.context === "DEFENSE" ? Math.abs(player.x - args.ownGoalX) * 0.035 : 0;
    const score = 360 - arrival.time * 250 - directDistance * 0.055 + trajectoryRelevance + goalSide + roleFit - formationRisk - goalDistancePenalty;
    candidates.push({ index, timeToBall: arrival.time, interceptPoint: arrival.point, score });
  }
  return candidates.sort((a, b) => b.score - a.score || a.timeToBall - b.timeToBall || a.index - b.index);
}

export function bestSwitchCandidate(args: Parameters<typeof rankSwitchCandidates>[0]) {
  return rankSwitchCandidates(args)[0] ?? null;
}

export function autoSwitchAllowsPass(mode: AutoSwitchMode) {
  return mode !== "MANUAL";
}

export function autoSwitchAllowsLooseBall(mode: AutoSwitchMode) {
  return mode === "SMART" || mode === "PASSES_AND_LOOSE";
}

export function shouldSwitchForLooseBall(activeTime: number, candidateTime: number, activeDistance: number) {
  return candidateTime + (activeDistance > 220 ? 0.18 : 0.34) < activeTime;
}

export function switchMoveAssistDuration(mode: SwitchMoveAssist) {
  return mode === "HIGH" ? 240 : mode === "LOW" ? 160 : 0;
}

export function blendSwitchVelocity(current: { x: number; y: number }, inherited: { x: number; y: number }, remainingRatio: number) {
  const blend = clamp(remainingRatio, 0, 1) * 0.22;
  return { x: current.x * (1 - blend) + inherited.x * blend, y: current.y * (1 - blend) + inherited.y * blend };
}
