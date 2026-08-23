import test from "node:test";
import assert from "node:assert/strict";
import { ReplayBuffer, ReplayController, isValidReplaySnapshot, sampleReplay } from "../app/replay-system.ts";

const snapshot = (timestamp, playersPerTeam = 5, ballX = timestamp / 10, ballY = 240) => ({
  timestamp,
  ball: { x: ballX, y: ballY, vx: 120, vy: -15, r: 9 },
  players: Array.from({ length: playersPerTeam * 2 }, (_, id) => ({
    id,
    teamId: id < playersPerTeam ? 0 : 1,
    x: 80 + id * 45 + timestamp / 100,
    y: 100 + (id % playersPerTeam) * 55,
    vx: 30,
    vy: 0,
    facing: 0,
    animationState: "MOVING",
  })),
  camera: { x: 640, y: 360, zoom: 1 },
});

const fill = (buffer, format = 5, start = 0, duration = 6000) => {
  for (let time = start; time <= start + duration; time += 20) buffer.record(snapshot(time, format));
};

test("ReplayBuffer muestrea a 25 Hz, conserva solo seis segundos y clona el estado", () => {
  const buffer = new ReplayBuffer(6000, 40);
  fill(buffer, 5, 0, 9000);
  assert.ok(buffer.size >= 145 && buffer.size <= 152);
  const clip = buffer.capture(5200);
  assert.ok(clip.length >= 125 && clip.length <= 132);
  const originalX = clip[0].ball.x;
  clip[0].ball.x = 99999;
  assert.equal(buffer.capture(5200)[0].ball.x, originalX, "el replay no comparte objetos con la física viva");
});

test("la reproducción interpola pelota, jugadores y cámara sin teletransportar", () => {
  const clip = [snapshot(0, 4, 0, 100), snapshot(1000, 4, 100, 300)];
  const middle = sampleReplay(clip, 0.5);
  assert.equal(middle.ball.x, 50);
  assert.equal(middle.ball.y, 200);
  assert.equal(middle.players[0].x, (clip[0].players[0].x + clip[1].players[0].x) / 2);
  assert.equal(middle.camera.zoom, 1);
});

test("20 goles consecutivos en 4v4, 5v5 y 6v6 siempre regresan a PLAYING", () => {
  for (const format of [4, 5, 6]) {
    const buffer = new ReplayBuffer();
    const controller = new ReplayController({ goalPauseMs: 100, replayDurationMs: 400, watchdogMs: 8000 });
    let now = 0;
    for (let goal = 0; goal < 20; goal += 1) {
      buffer.clear();
      fill(buffer, format, now, 1200);
      now += 1300;
      controller.enterGoalPause(now, buffer.capture(), true);
      assert.equal(controller.mode, "GOAL_PAUSE");
      controller.tick(now + 101);
      assert.equal(controller.mode, "REPLAY");
      assert.equal(controller.getFrame(now + 180).players.length, format * 2);
      if (goal % 3 === 0) controller.skip(now + 190); // omitir al inicio o a mitad
      else controller.tick(now + 520);
      assert.equal(controller.mode, "KICKOFF");
      assert.equal(controller.completeKickoff(now + 521), true);
      assert.equal(controller.mode, "PLAYING");
      now += 700;
    }
  }
});

test("replay desactivado, rebote, gol al borde y buffer corrupto terminan en saque seguro", () => {
  const controller = new ReplayController({ goalPauseMs: 10, replayDurationMs: 100 });
  const edgeClip = [snapshot(0, 6, 19, 181), snapshot(40, 6, 21, 180)];
  edgeClip[0].ball.vx = -500; // rebote previo
  controller.enterGoalPause(0, edgeClip, false);
  controller.tick(11);
  assert.equal(controller.mode, "KICKOFF", "replays desactivados no congelan el partido");
  controller.completeKickoff(12);

  controller.enterGoalPause(20, [{ nope: true }], true);
  controller.tick(31);
  assert.equal(controller.mode, "KICKOFF", "un buffer corrupto se omite sin excepción");
  assert.equal(isValidReplaySnapshot({ nope: true }), false);
});

test("el watchdog abandona cualquier replay antes de ocho segundos", () => {
  const controller = new ReplayController({ goalPauseMs: 1, replayDurationMs: 20_000, watchdogMs: 8000 });
  controller.enterGoalPause(0, [snapshot(0), snapshot(40)], true);
  controller.tick(2);
  assert.equal(controller.mode, "REPLAY");
  controller.tick(8003);
  assert.equal(controller.mode, "KICKOFF");
});
