import test from "node:test";
import assert from "node:assert/strict";
import { chooseGoalkeeperDistribution, createAIProfile } from "../app/game-ai.ts";
import { FORMAT_BALANCE, DRIBBLE_SPEED_MULTIPLIER, calculateShotQuality, shotPreparationMs, simulateBalancedMatch } from "../app/gameplay-polish.ts";
import { MATCH_FORMATS } from "../app/match-config.ts";
import { MatchClock, formatMatchTime } from "../app/match-clock.ts";
import { MUSIC_FADE_SECONDS, MUSIC_POOLS, MUSIC_SILENCE_RANGE_SECONDS, MUSIC_TRACKS, chooseNextTrack, trackDurationSeconds } from "../app/music-manager.ts";
import { ReceptionSystem } from "../app/pass-system.ts";
import { autoSwitchAllowsLooseBall, autoSwitchAllowsPass, bestSwitchCandidate, estimateTimeToBall, shouldSwitchForLooseBall, switchMoveAssistDuration } from "../app/player-switch.ts";

const seededRandom = seed => () => {
  seed |= 0;
  seed = seed + 0x6D2B79F5 | 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const player = (x, y, team, role = "MED", rating = 86) => ({ x, y, vx: 0, vy: 0, r: 18, team, role, rating, name: `${role}-${x}` });

test("MatchClock es la única fuente temporal y congela todos los estados no jugables", () => {
  const clock = new MatchClock(90, 90);
  clock.tick(0, "PLAYING");
  assert.equal(clock.tick(1_250, "PLAYING").displayTime, 89);
  const beforePause = clock.elapsedTime;
  for (const [time, state] of [[4_000, "PAUSED"], [7_000, "REPLAY"], [9_000, "GOAL_PAUSE"], [12_000, "HALF_TIME"]]) clock.tick(time, state);
  assert.equal(clock.elapsedTime, beforePause);
  clock.tick(12_500, "PLAYING");
  assert.equal(clock.elapsedTime, beforePause + .5);
  assert.equal(formatMatchTime(90), "01:30");
  assert.equal(formatMatchTime(0), "00:00");
});

test("el cambio automático distingue receptor, pelota libre y defensa manual", () => {
  assert.equal(autoSwitchAllowsPass("SMART"), true);
  assert.equal(autoSwitchAllowsPass("MANUAL"), false);
  assert.equal(autoSwitchAllowsLooseBall("PASSES_ONLY"), false);
  assert.equal(autoSwitchAllowsLooseBall("PASSES_AND_LOOSE"), true);
  assert.ok(switchMoveAssistDuration("LOW") >= 100 && switchMoveAssistDuration("LOW") <= 250);
  const players = [player(120, 280, 0, "MED"), player(360, 280, 0, "DEL"), player(650, 420, 0, "DEF")];
  const ball = { x: 410, y: 280, vx: 150, vy: 0, r: 9 };
  const candidate = bestSwitchCandidate({ players, start: 0, end: 3, current: 0, ball, ownGoalX: 46, attackingDirection: 1, context: "LOOSE" });
  assert.equal(candidate.index, 1);
  const activeArrival = estimateTimeToBall(players[0], ball), candidateArrival = estimateTimeToBall(players[1], ball);
  assert.equal(shouldSwitchForLooseBall(activeArrival.time, candidateArrival.time, 290), true);
});

test("las canchas crecieron por formato sin alterar la identidad relativa", () => {
  assert.deepEqual([MATCH_FORMATS[4].pitchWidth, MATCH_FORMATS[5].pitchWidth, MATCH_FORMATS[6].pitchWidth], [1512, 1687, 1898]);
  assert.deepEqual([MATCH_FORMATS[4].pitchHeight, MATCH_FORMATS[5].pitchHeight, MATCH_FORMATS[6].pitchHeight], [821, 899, 994]);
  assert.ok(MATCH_FORMATS[4].transitionTempo > MATCH_FORMATS[5].transitionTempo && MATCH_FORMATS[5].transitionTempo > MATCH_FORMATS[6].transitionTempo);
});

test("la calidad contextual premia un remate abierto y la preparación queda entre 80 y 180 ms", () => {
  const open = calculateShotQuality({ distance: 150, maximumUsefulDistance: 500, lateralOffset: 15, fieldHalfHeight: 400, finishing: 92, bodyAlignment: .9, pressure: .05, goalkeeperCoverage: .1 });
  const marked = calculateShotQuality({ distance: 390, maximumUsefulDistance: 500, lateralOffset: 260, fieldHalfHeight: 400, finishing: 78, bodyAlignment: -.5, pressure: .95, goalkeeperCoverage: .9 });
  assert.ok(open > marked);
  for (const preparation of [shotPreparationMs(1, 0, 95), shotPreparationMs(-1, 1, 68), shotPreparationMs(.2, .5, 84)]) assert.ok(preparation >= 80 && preparation <= 180);
  assert.ok(DRIBBLE_SPEED_MULTIPLIER >= .88 && DRIBBLE_SPEED_MULTIPLIER <= .94);
});

test("el primer control amortigua el pase y conserva un tiempo de orientación", () => {
  const reception = new ReceptionSystem().resolve({ ballVelocity: { x: 620, y: 0 }, receiver: player(300, 300, 0, "MED", 88), ballRadius: 9, distance: 18, pressureDistance: 180, planned: true, orientedDirection: { x: 1, y: 0 } });
  assert.ok(reception);
  assert.ok(Math.hypot(reception.ballVelocity.x, reception.ballVelocity.y) < 180);
  assert.ok(reception.controlDelayMs >= 55 && reception.controlDelayMs <= 240);
});

test("el arquero prioriza una salida libre y despeja si todas están marcadas", () => {
  for (let scenario = 0; scenario < 20; scenario++) {
    const keeper = player(72, 360, 0, "ARQ", 90), safe = player(280, 190 + scenario, 0, "DEF"), marked = player(250, 520, 0, "MED"), opponentNearMarked = player(255, 520, 1, "DEL"), opponentLane = player(420, 390, 1, "MED");
    const players = [keeper, safe, marked, opponentNearMarked, opponentLane];
    const choice = chooseGoalkeeperDistribution({ keeperIndex: 0, players, teamStart: 0, teamEnd: 3, opponentStart: 3, opponentEnd: 5, direction: 1, left: 46, right: 1640, top: 74, bottom: 865, profile: createAIProfile("PROFESSIONAL") });
    assert.equal(choice.type, "PASS");
    assert.equal(choice.target, 1);
  }
  const crowded = [player(72, 360, 0, "ARQ"), player(250, 250, 0, "DEF"), player(250, 500, 0, "MED"), player(250, 250, 1, "DEL"), player(250, 500, 1, "MED"), player(160, 375, 1, "DEL")];
  const clearance = chooseGoalkeeperDistribution({ keeperIndex: 0, players: crowded, teamStart: 0, teamEnd: 3, opponentStart: 3, opponentEnd: 6, direction: 1, left: 46, right: 1640, top: 74, bottom: 865 });
  assert.equal(clearance.type, "CLEAR");
});

test("la banda sonora contiene cuatro temas originales completos y rotación sin repetición", () => {
  assert.equal(MUSIC_TRACKS.length, 4);
  assert.equal(new Set(MUSIC_TRACKS.map(track => track.id)).size, 4);
  for (const track of MUSIC_TRACKS) assert.ok(trackDurationSeconds(track) >= 75 && trackDurationSeconds(track) <= 100);
  assert.deepEqual(MUSIC_SILENCE_RANGE_SECONDS, [10, 35]);
  assert.ok(MUSIC_FADE_SECONDS.in >= 1.5 && MUSIC_FADE_SECONDS.out <= 3 && MUSIC_FADE_SECONDS.match >= 1.5);
  for (const scene of ["MENU", "TOURNAMENT"]) {
    const previous = MUSIC_POOLS[scene][0], next = chooseNextTrack(scene, previous, () => 0);
    assert.notEqual(next.id, previous);
  }
});

test("80 simulaciones CPU vs CPU por formato quedan dentro del rango arcade objetivo", () => {
  for (const format of [4, 5, 6]) {
    const rng = seededRandom(format * 9_917);
    let goals = 0, shots = 0, saves = 0, blocks = 0;
    for (let match = 0; match < 80; match++) {
      const result = simulateBalancedMatch(format, rng);
      goals += result.goals; shots += result.shots; saves += result.saves; blocks += result.blocks;
    }
    const average = goals / 80, [minimum, maximum] = FORMAT_BALANCE[format].targetGoals;
    assert.ok(average >= minimum && average <= maximum, `${format}v${format}: ${average.toFixed(2)} goles`);
    assert.ok(shots > goals && saves > 0 && blocks > 0);
  }
});
