import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("la interfaz conserva los contratos responsive de escritorio, tablet y móvil", () => {
  for (const breakpoint of [620, 650, 760]) assert.match(css, new RegExp(`max-width:${breakpoint}px`));
  assert.match(css, /group-card\{overflow-x:auto\}/);
  assert.match(css, /campaign-progress/);
  assert.match(css, /grand-final-prematch/);
});

test("la previa separa libertad de Partido rápido y reglas bloqueadas de competición", () => {
  assert.match(page, /rivalLocked=mode!=="Amistoso"/);
  assert.match(page, /ASISTENCIA DE PASE/);
  assert.match(page, /competitionStage=\{cupState\?\.currentStage\}/);
  assert.match(page, /DURACIÓN TOTAL/);
});

test("presentación y progresión tienen replays, audio, objetivos, récords y logros", () => {
  for (const contract of ["ReplayBuffer", "ReplayController", "crowdMurmur", "trophy-counts", "records-panel", "campaign-objectives", "CAMPEÓN_DEL_MUNDO"]) assert.ok(page.includes(contract) || css.includes(contract), contract);
});

test("el pase de escritorio usa clic derecho solo dentro del canvas", () => {
  assert.match(page, /onPointerDown=\{canvasPassDown\}/);
  assert.match(page, /onPointerUp=\{canvasPassUp\}/);
  assert.match(page, /onContextMenu=\{event=>event\.preventDefault\(\)\}/);
  assert.doesNotMatch(page, /addEventListener\(["']contextmenu/);
  assert.match(page, /CLIC DERECHO/);
  assert.match(page, /RIGHT CLICK/);
  assert.doesNotMatch(page, /keys\.current\.j\|\|keys\.current\[" "\]/);
});

test("mouse, teclado reasignable y botón móvil comparten InputManager sin modificar la IA de equipo", () => {
  assert.match(page, /new InputManager\(activeBindings\)/);
  assert.match(page, /handleMouseDown\(event\.button\)/);
  assert.match(page, /beginPass\("TOUCH",event\.pointerId,now\)/);
  assert.match(page, /inputManager\.current\.getPassCharge\(ts\)/);
  assert.match(page, /charging=inputManager\.current\.isPassHeld\(\)/);
  for (const label of ["CONTROLES", "JUGABILIDAD", "GRÁFICOS", "ACCESIBILIDAD"]) assert.match(page, new RegExp(label));
});

test("replay usa estados explícitos y render-only snapshots", () => {
  for (const state of ["PLAYING", "GOAL_PAUSE", "REPLAY", "KICKOFF", "PAUSED"]) assert.match(page, new RegExp(state));
  assert.doesNotMatch(page, /ball\.current=\{\.\.\.frame\.ball\}/);
  assert.match(page, /renderBall:Ball=replayFrame/);
  assert.match(page, /data-game-mode=\{gameMode\}/);
});
