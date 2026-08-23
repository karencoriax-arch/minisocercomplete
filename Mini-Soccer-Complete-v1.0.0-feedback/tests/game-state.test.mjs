import test from "node:test";
import assert from "node:assert/strict";
import { addTrophy, applyMatchToCareer, DEFAULT_CAREER, DEFAULT_SETTINGS, emptyMatchReport, parseCareerState, parseProfileState, parseSettingsState } from "../app/game-state.ts";
import { COMPETITION_THEMES } from "../app/competition-config.ts";

test("un perfil inválido vuelve a valores seguros y no rompe el inicio", () => {
  assert.equal(parseProfileState("{mal").completed, false);
  const parsed = parseProfileState(JSON.stringify({ completed: true, playerName: "  Luna  ", preferredFormat: 6 }));
  assert.equal(parsed.playerName, "Luna");
  assert.equal(parsed.preferredFormat, 6);
});

test("el historial suma resultados y evita trofeos duplicados", () => {
  const report = { ...emptyMatchReport([3, 0]), completedPasses: [18, 7], shots: [9, 2] };
  const career = applyMatchToCareer(DEFAULT_CAREER, report);
  assert.equal(career.wins, 1);
  assert.equal(career.cleanSheets, 1);
  assert.ok(career.achievements.includes("EQUIPO_CONECTADO"));
  const trophy = { id: "champions-1", competition: "Champions", teamId: "rma", wonAt: "2026-01-01", season: 1, format: 5, difficulty: "Medio", topScorer: null, bestPlayer: null };
  assert.equal(addTrophy(addTrophy(career, trophy), trophy).trophies.length, 1);
  assert.deepEqual(parseCareerState(JSON.stringify(career)), career);
});

test("los récords, la forma y la remontada se calculan desde el informe único", () => {
  const report = { ...emptyMatchReport([4, 2], [{ team: 0, playerName: "Luna", minute: 88 }]), maxDeficit: 2 };
  const first = applyMatchToCareer(DEFAULT_CAREER, report);
  const second = applyMatchToCareer(first, { ...emptyMatchReport([2, 0]), goals: [{ team: 0, playerName: "Luna" }] });
  assert.equal(first.biggestComeback, 2);
  assert.ok(first.achievements.includes("REMONTADA"));
  assert.equal(second.bestWinStreak, 2);
  assert.equal(second.topScorer, "Luna");
  assert.deepEqual(second.recentForm, ["W", "W"]);
});

test("cada competición conserva identidad y el camino reglamentario solicitado", () => {
  assert.deepEqual(COMPETITION_THEMES.Libertadores.stages.map((stage) => stage.key), ["GROUPS", "ROUND_OF_16", "QUARTERFINALS", "SEMIFINALS", "FINAL"]);
  assert.deepEqual(COMPETITION_THEMES.Mundial.stages.map((stage) => stage.key), ["GROUPS", "ROUND_OF_32", "ROUND_OF_16", "QUARTERFINALS", "SEMIFINALS", "FINAL"]);
  for (const kind of ["Champions", "Europa League"]) assert.deepEqual(COMPETITION_THEMES[kind].stages.map((stage) => stage.key), ["LEAGUE", "PLAYOFF", "ROUND_OF_16", "QUARTERFINALS", "SEMIFINALS", "FINAL"]);
});

test("ajustes v3 migran, persisten perfiles de control y restauran valores seguros", () => {
  const legacy = parseSettingsState(JSON.stringify({ version: 1, sound: false, music: false, crowd: true, reducedMotion: true, camera: "ABIERTA" }));
  assert.equal(legacy.version, 3);
  assert.equal(legacy.audio.master, 0);
  assert.equal(legacy.audio.musicEnabled, false);
  assert.equal(legacy.accessibility.reducedMotion, true);
  const custom = structuredClone(DEFAULT_SETTINGS);
  custom.controls.activeProfile = "CUSTOM_1";
  custom.controls.profiles.CUSTOM_1.PASS.primary = "KEY:e";
  custom.graphics.preset = "LOW";
  custom.audio.crowd = 23;
  const restored = parseSettingsState(JSON.stringify(custom));
  assert.equal(restored.controls.activeProfile, "CUSTOM_1");
  assert.equal(restored.controls.profiles.CUSTOM_1.PASS.primary, "KEY:e");
  assert.equal(restored.graphics.preset, "LOW");
  assert.equal(restored.audio.crowd, 23);
  assert.equal(restored.gameplay.autoSwitch, "SMART");
  assert.equal(restored.gameplay.switchMoveAssist, "LOW");
});
