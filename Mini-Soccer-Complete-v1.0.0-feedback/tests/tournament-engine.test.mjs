import test from "node:test";
import assert from "node:assert/strict";
import {
  allStandings,
  completeCurrentStep,
  completeUserFixture,
  createTournamentState,
  currentUserFixture,
  parseTournamentState,
  recordFixtureResult,
  serializeTournamentState,
  tournamentTeamSummary,
  totalGoalsFromPlayerStats,
  totalGoalsFromResults,
} from "../app/tournament-engine.ts";

const players = (prefix) => [
  { name: `${prefix} Delantero`, rating: 86, role: "DEL" },
  { name: `${prefix} Extremo`, rating: 84, role: "EXT" },
  { name: `${prefix} Medio`, rating: 83, role: "MED" },
  { name: `${prefix} Defensa`, rating: 82, role: "DEF" },
  { name: `${prefix} Arquero`, rating: 82, role: "ARQ" },
];
const teams = Array.from({ length: 8 }, (_, index) => ({
  id: `t${index + 1}`,
  name: `Equipo ${index + 1}`,
  short: `T${index + 1}`,
  rating: 91 - index,
  players: players(`T${index + 1}`),
}));
const create = () => createTournamentState({ tournamentType: "Mundial", teams, selectedTeamId: "t1", matchFormat: 5 });

test("una competición nueva empieza con todas las columnas de la tabla en cero", () => {
  const state = create();
  for (const { standings } of allStandings(state)) {
    for (const row of standings) {
      assert.deepEqual(
        [row.played, row.wins, row.draws, row.losses, row.goalsFor, row.goalsAgainst, row.goalDifference, row.points],
        [0, 0, 0, 0, 0, 0, 0, 0],
      );
    }
  }
});

test("la fecha no avanza mientras el partido del usuario siga pendiente", () => {
  const state = completeCurrentStep(create(), teams);
  assert.equal(state.currentMatchday, 1);
  assert.equal(currentUserFixture(state)?.status, "SCHEDULED");
});

test("al completar la fecha todos los equipos tienen exactamente un partido jugado", () => {
  const completed = completeUserFixture(create(), [2, 0], teams);
  assert.equal(completed.accepted, true);
  assert.equal(completed.state.currentMatchday, 2);
  for (const { standings } of allStandings(completed.state)) {
    assert.ok(standings.every((row) => row.played === 1));
  }
});

test("tres fechas completas clasifican al usuario y crean una semifinal real", () => {
  let state = create();
  for (let matchday = 0; matchday < 3; matchday += 1) state = completeUserFixture(state, [2, 0], teams).state;
  assert.equal(state.currentStage, "SEMIFINALS");
  assert.equal(state.qualifiedTeamIds.length, 4);
  assert.ok(currentUserFixture(state));
});

test("el perdedor de una eliminatoria queda eliminado y no recibe otro fixture", () => {
  let state = create();
  for (let matchday = 0; matchday < 3; matchday += 1) state = completeUserFixture(state, [2, 0], teams).state;
  state = completeUserFixture(state, [0, 1], teams).state;
  assert.equal(state.currentStage, "ELIMINATED");
  assert.equal(currentUserFixture(state), null);
});

test("un empate eliminatorio no inventa un ganador ni avanza la campaña", () => {
  let state = create();
  for (let matchday = 0; matchday < 3; matchday += 1) state = completeUserFixture(state, [2, 0], teams).state;
  const fixture = currentUserFixture(state);
  const tied = completeUserFixture(state, [1, 1], teams);
  assert.equal(tied.requiresReplay, true);
  assert.equal(tied.state.currentStage, "SEMIFINALS");
  assert.equal(currentUserFixture(tied.state)?.id, fixture?.id);
});

test("los goles de estadísticas coinciden exactamente con los resultados", () => {
  const state = completeUserFixture(create(), [3, 1], teams).state;
  assert.equal(totalGoalsFromPlayerStats(state), totalGoalsFromResults(state));
});

test("los goles del partido jugado se acreditan al futbolista que realmente marcó", () => {
  const state = completeUserFixture(create(), [2, 0], teams, { selected: ["T1 Delantero", "T1 Medio"], opponent: [] }).state;
  assert.equal(state.playerStats["t1::T1 Delantero"].goals, 1);
  assert.equal(state.playerStats["t1::T1 Medio"].goals, 1);
});

test("un fixture jugado no puede registrarse ni simularse dos veces", () => {
  const initial = create();
  const fixture = currentUserFixture(initial);
  assert.ok(fixture);
  const selectedIsHome = fixture.homeTeamId === initial.selectedTeamId;
  const played = recordFixtureResult(initial, fixture.id, selectedIsHome ? { homeGoals: 1, awayGoals: 0 } : { homeGoals: 0, awayGoals: 1 }, teams);
  assert.throws(() => recordFixtureResult(played, fixture.id, { homeGoals: 2, awayGoals: 0 }, teams), /ya fue disputado/);
});

test("cerrar y restaurar conserva fecha, resultados, tabla y estadísticas", () => {
  const played = completeUserFixture(create(), [2, 1], teams).state;
  const restored = parseTournamentState(serializeTournamentState(played), new Set(teams.map((team) => team.id)));
  assert.deepEqual(restored, played);
});

test("la configuración competitiva queda guardada y bloqueada durante la campaña", () => {
  const state = createTournamentState({ tournamentType: "Mundial", teams, selectedTeamId: "t1", matchFormat: 6, difficulty: "Profesional", durationMinutes: 8, passAssistance: "SEMI" });
  const played = completeUserFixture(state, [1, 0], teams).state;
  const restored = parseTournamentState(serializeTournamentState(played), new Set(teams.map((team) => team.id)));
  assert.equal(restored?.selectedTeamId, "t1");
  assert.equal(restored?.matchFormat, 6);
  assert.equal(restored?.difficulty, "Profesional");
  assert.equal(restored?.durationMinutes, 8);
  assert.equal(restored?.passAssistance, "SEMI");
});

test("el historial de copa deriva PJ, resultados y goles de los fixtures jugados", () => {
  const played = completeUserFixture(create(), [3, 1], teams).state;
  assert.deepEqual(tournamentTeamSummary(played, "t1"), {
    matches: 1,
    wins: 1,
    draws: 0,
    losses: 0,
    goalsFor: 3,
    goalsAgainst: 1,
    finalOpponentId: null,
    finalScore: null,
  });
});
