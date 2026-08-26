import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PROGRESSION,
  applyProgressionMatch,
  claimProgressMission,
  dayKey,
  equipTitle,
  levelFromXp,
  parseProgressionState,
  refreshProgressMissions,
  weekKey,
  xpNeededForLevel,
} from "../app/progression-v21.ts";

const fresh = () => structuredClone(DEFAULT_PROGRESSION);

test("nivel 1 requiere 500 XP y el progreso escala", () => {
  assert.equal(xpNeededForLevel(1), 500);
  assert.deepEqual(levelFromXp(0), { level: 1, xpIntoLevel: 0, xpForNext: 500 });
  assert.equal(levelFromXp(500).level, 2);
  assert.equal(levelFromXp(1180).level, 3);
});

test("un partido real actualiza historial, XP y misiones", () => {
  const result = applyProgressionMatch(fresh(), {
    played: true, won: true, drew: false, goalsFor: 3, goalsAgainst: 0, completedPasses: 14,
    teamId: "arg", difficulty: "Profesional", maxDeficit: 0,
  });
  assert.equal(result.state.stats.matches, 1);
  assert.equal(result.state.stats.wins, 1);
  assert.equal(result.state.stats.goalsFor, 3);
  assert.equal(result.state.stats.cleanSheets, 1);
  assert.equal(result.state.stats.completedPasses, 14);
  assert.equal(result.state.stats.teamsUsed.length, 1);
  assert.equal(result.xpEarned, 125);
  assert.equal(result.state.missions.progress.D_PLAY_2, 1);
  assert.equal(result.state.missions.progress.D_SCORE_5, 3);
  assert.equal(result.state.missions.progress.D_PASSES_20, 14);
  assert.equal(result.state.missions.progress.W_CLEAN_3, 1);
});

test("una simulación no genera XP, estadísticas ni misiones", () => {
  const result = applyProgressionMatch(fresh(), {
    played: false, simulated: true, won: true, drew: false, goalsFor: 1, goalsAgainst: 0, completedPasses: 0,
    teamId: "arg", difficulty: "Normal",
  });
  assert.equal(result.xpEarned, 0);
  assert.equal(result.state.stats.matches, 0);
  assert.equal(result.state.totalXp, 0);
  assert.equal(result.state.missions.progress.D_WIN_1, 0);
});

test("logros se desbloquean por hechos reales y habilitan títulos", () => {
  const result = applyProgressionMatch(fresh(), {
    played: true, won: true, drew: false, goalsFor: 4, goalsAgainst: 0, completedPasses: 8,
    teamId: "bra", difficulty: "Normal", maxDeficit: 2,
  });
  for (const id of ["FIRST_MATCH", "FIRST_WIN", "FIRST_GOAL", "HAT_TRICK", "CLEAN_SHEET", "COMEBACK"]) {
    assert.ok(result.state.achievements.includes(id));
  }
  assert.ok(result.state.unlockedTitles.includes("Nunca rendirse"));
  const equipped = equipTitle(result.state, "Nunca rendirse");
  assert.equal(equipped.equippedTitle, "Nunca rendirse");
});

test("misiones no se pueden reclamar antes ni dos veces", () => {
  let state = fresh();
  let claim = claimProgressMission(state, "D_PLAY_2");
  assert.equal(claim.ok, false);
  state = applyProgressionMatch(state, { played:true, won:false, drew:true, goalsFor:1, goalsAgainst:1, completedPasses:10, teamId:"arg", difficulty:"Normal" }).state;
  state = applyProgressionMatch(state, { played:true, won:true, drew:false, goalsFor:1, goalsAgainst:0, completedPasses:10, teamId:"bra", difficulty:"Normal" }).state;
  claim = claimProgressMission(state, "D_PLAY_2");
  assert.equal(claim.ok, true);
  assert.equal(claim.xp, 90);
  assert.equal(claim.msc, 120);
  const again = claimProgressMission(claim.state, "D_PLAY_2");
  assert.equal(again.ok, false);
});

test("misiones diarias se reinician sin borrar progreso semanal", () => {
  const monday = new Date(2026, 7, 24, 10, 0, 0);
  const tuesday = new Date(2026, 7, 25, 10, 0, 0);
  let state = fresh();
  state.missions.dayKey = dayKey(monday);
  state.missions.weekKey = weekKey(monday);
  state.missions.progress.D_PLAY_2 = 2;
  state.missions.progress.W_PLAY_8 = 4;
  state.missions.claimed = ["D_PLAY_2", "W_PLAY_8"];
  const refreshed = refreshProgressMissions(state, tuesday);
  assert.equal(refreshed.missions.progress.D_PLAY_2, 0);
  assert.equal(refreshed.missions.progress.W_PLAY_8, 4);
  assert.ok(!refreshed.missions.claimed.includes("D_PLAY_2"));
  assert.ok(refreshed.missions.claimed.includes("W_PLAY_8"));
});

test("parser limpia datos inválidos y títulos no poseídos", () => {
  const parsed = parseProgressionState(JSON.stringify({
    totalXp: -99,
    achievements: ["FIRST_WIN", "FAKE"],
    unlockedTitles: ["Ganador"],
    equippedTitle: "No existe",
    stats: { wins: -1, teamsUsed: ["arg", "arg", 7] },
  }));
  assert.equal(parsed.totalXp, 0);
  assert.deepEqual(parsed.achievements, ["FIRST_WIN"]);
  assert.equal(parsed.stats.wins, 0);
  assert.deepEqual(parsed.stats.teamsUsed, ["arg"]);
  assert.equal(parsed.equippedTitle, null);
});
