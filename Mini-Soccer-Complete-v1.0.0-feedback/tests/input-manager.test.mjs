import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONTROL_BINDINGS, InputManager, PASS_CHARGE_MS, RIGHT_MOUSE_BUTTON, assignBinding, cloneBindings, findBindingConflict, keyboardBinding, removeBinding } from "../app/input-manager.ts";

test("el clic derecho emite una sola secuencia pressed, held y released", () => {
  const input = new InputManager();
  assert.equal(input.handlePointerDown(0, 7, 100), false, "el clic izquierdo no inicia un pase");
  assert.equal(input.handlePointerDown(RIGHT_MOUSE_BUTTON, 7, 100), true);
  assert.equal(input.passPressed, true);
  assert.equal(input.passHeld, true);
  assert.equal(input.isPassPressed(), true);
  assert.equal(input.isPassHeld(), true);
  assert.equal(input.consumePassPressed(), true);
  assert.equal(input.consumePassPressed(), false);

  const release = input.handlePointerUp(RIGHT_MOUSE_BUTTON, 7, 140);
  assert.ok(release, "un clic rápido también debe producir un pase");
  assert.equal(release.heldMs, 40);
  assert.ok(release.charge > 0 && release.charge < 0.1);
  assert.equal(input.passHeld, false);
  assert.equal(input.passReleased, true);
  assert.equal(input.isPassReleased(), true);
  assert.equal(input.consumePassReleased(), true);
  assert.equal(input.consumePassReleased(), false);
  assert.equal(input.handlePointerUp(RIGHT_MOUSE_BUTTON, 7, 150), null, "un segundo pointerup no repite el pase");
});

test("la potencia llega al máximo en 620 ms, queda limitada y no autoejecuta", () => {
  const input = new InputManager();
  input.handlePointerDown(RIGHT_MOUSE_BUTTON, 3, 1_000);
  assert.equal(input.getPassCharge(1_000 + PASS_CHARGE_MS / 2), 0.5);
  assert.equal(input.getPassCharge(1_000 + PASS_CHARGE_MS), 1);
  assert.equal(input.getPassCharge(20_000), 1);
  assert.equal(input.passHeld, true, "cargar al máximo no debe soltar automáticamente");
  assert.equal(input.passReleased, false);

  const release = input.handlePointerUp(RIGHT_MOUSE_BUTTON, 3, 20_000);
  assert.equal(release?.charge, 1);
  assert.equal(input.passHeld, false);
});

test("solo el puntero y la fuente que iniciaron la acción pueden soltarla", () => {
  const input = new InputManager();
  input.handlePointerDown(RIGHT_MOUSE_BUTTON, 11, 0);
  assert.equal(input.handlePointerUp(RIGHT_MOUSE_BUTTON, 12, 200), null);
  assert.equal(input.endPass("TOUCH", 11, 200), null);
  assert.equal(input.passHeld, true);
  assert.ok(input.handlePointerUp(RIGHT_MOUSE_BUTTON, 11, 200));
});

test("el botón táctil usa la misma PassAction abstracta", () => {
  const input = new InputManager();
  assert.equal(input.beginPass("TOUCH", 21, 500), true);
  assert.equal(input.passHeld, true);
  assert.equal(input.getPassCharge(810), 0.5);
  const release = input.endPass("TOUCH", 21, 1_120);
  assert.equal(release?.source, "TOUCH");
  assert.equal(release?.charge, 1);
});

test("cancelar una interacción no crea un pase fantasma", () => {
  const input = new InputManager();
  input.handlePointerDown(RIGHT_MOUSE_BUTTON, 4, 0);
  assert.equal(input.cancelPass("RIGHT_MOUSE", 4), true);
  assert.equal(input.passHeld, false);
  assert.equal(input.passReleased, false);
  assert.equal(input.handlePointerUp(RIGHT_MOUSE_BUTTON, 4, 400), null);
});

test("las acciones semánticas aceptan dos asignaciones sin hardcodear gameplay", () => {
  const input = new InputManager();
  assert.deepEqual(input.handleKeyDown("w"), ["MOVE_UP"]);
  assert.equal(input.isHeld("MOVE_UP"), true);
  assert.deepEqual(input.handleKeyUp("w"), ["MOVE_UP"]);
  assert.equal(input.isReleased("MOVE_UP"), true);
  assert.deepEqual(input.handleMouseDown(2), ["PASS"]);
});

test("reasignar Pase de MOUSE2 a E detecta conflicto y permite reemplazar o intercambiar", () => {
  let bindings = cloneBindings(DEFAULT_CONTROL_BINDINGS);
  assert.deepEqual(findBindingConflict(bindings, keyboardBinding("e"), { action: "PASS", slot: "primary" }), { action: "SWITCH_PLAYER", slot: "primary" });
  const cancelled = assignBinding(bindings, "PASS", "primary", keyboardBinding("e"), "CANCEL");
  assert.equal(cancelled.changed, false);
  const swapped = assignBinding(bindings, "PASS", "primary", keyboardBinding("e"), "SWAP");
  assert.equal(swapped.bindings.PASS.primary, "KEY:e");
  assert.equal(swapped.bindings.SWITCH_PLAYER.primary, "MOUSE:2");
  const replaced = assignBinding(bindings, "PASS", "primary", keyboardBinding("e"), "REPLACE");
  assert.equal(replaced.bindings.PASS.primary, "KEY:e");
  assert.equal(replaced.bindings.SWITCH_PLAYER.primary, null);
  bindings = removeBinding(replaced.bindings, "PASS", "primary");
  assert.equal(bindings.PASS.primary, null);
});
