export const RIGHT_MOUSE_BUTTON = 2;
export const PASS_CHARGE_MS = 620;

export const INPUT_ACTIONS = [
  "MOVE_UP",
  "MOVE_LEFT",
  "MOVE_DOWN",
  "MOVE_RIGHT",
  "PASS",
  "SHOOT",
  "SPRINT",
  "TACKLE",
  "SWITCH_PLAYER",
  "CHANGE_TACTIC",
  "PAUSE",
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];
export type InputBinding = `KEY:${string}` | `MOUSE:${number}` | `TOUCH:${string}`;
export type BindingSlot = "primary" | "secondary";
export type ActionBinding = { primary: InputBinding | null; secondary: InputBinding | null };
export type ControlBindings = Record<InputAction, ActionBinding>;
export type ControlProfileId = "DEFAULT" | "CUSTOM_1" | "CUSTOM_2";
export type ControlProfiles = Record<ControlProfileId, ControlBindings>;

export const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
  MOVE_UP: { primary: "KEY:w", secondary: "KEY:arrowup" },
  MOVE_LEFT: { primary: "KEY:a", secondary: "KEY:arrowleft" },
  MOVE_DOWN: { primary: "KEY:s", secondary: "KEY:arrowdown" },
  MOVE_RIGHT: { primary: "KEY:d", secondary: "KEY:arrowright" },
  PASS: { primary: "MOUSE:2", secondary: null },
  SHOOT: { primary: "KEY:k", secondary: null },
  SPRINT: { primary: "KEY:shift", secondary: null },
  TACKLE: { primary: "KEY:o", secondary: null },
  SWITCH_PLAYER: { primary: "KEY:e", secondary: null },
  CHANGE_TACTIC: { primary: "KEY:q", secondary: null },
  PAUSE: { primary: "KEY:escape", secondary: null },
};

export const CRITICAL_INPUT_ACTIONS: InputAction[] = ["MOVE_UP", "MOVE_LEFT", "MOVE_DOWN", "MOVE_RIGHT", "PASS", "SHOOT", "PAUSE"];

export const cloneBindings = (bindings: ControlBindings): ControlBindings => Object.fromEntries(
  INPUT_ACTIONS.map((action) => [action, { ...bindings[action] }]),
) as ControlBindings;

export const DEFAULT_CONTROL_PROFILES: ControlProfiles = {
  DEFAULT: cloneBindings(DEFAULT_CONTROL_BINDINGS),
  CUSTOM_1: cloneBindings(DEFAULT_CONTROL_BINDINGS),
  CUSTOM_2: cloneBindings(DEFAULT_CONTROL_BINDINGS),
};

export function keyboardBinding(key: string): InputBinding {
  return `KEY:${key.toLowerCase()}`;
}

export function mouseBinding(button: number): InputBinding {
  return `MOUSE:${button}`;
}

export function findBindingConflict(bindings: ControlBindings, binding: InputBinding, except?: { action: InputAction; slot: BindingSlot }) {
  for (const action of INPUT_ACTIONS) {
    for (const slot of ["primary", "secondary"] as const) {
      if (except?.action === action && except.slot === slot) continue;
      if (bindings[action][slot] === binding) return { action, slot };
    }
  }
  return null;
}

export type ConflictResolution = "REPLACE" | "SWAP" | "CANCEL";

export function assignBinding(
  source: ControlBindings,
  action: InputAction,
  slot: BindingSlot,
  binding: InputBinding,
  resolution: ConflictResolution = "CANCEL",
) {
  const bindings = cloneBindings(source);
  const conflict = findBindingConflict(bindings, binding, { action, slot });
  if (!conflict) {
    bindings[action][slot] = binding;
    return { bindings, changed: true, conflict: null };
  }
  if (resolution === "CANCEL") return { bindings: source, changed: false, conflict };
  const displaced = bindings[action][slot];
  bindings[action][slot] = binding;
  bindings[conflict.action][conflict.slot] = resolution === "SWAP" ? displaced : null;
  return { bindings, changed: true, conflict };
}

export function removeBinding(source: ControlBindings, action: InputAction, slot: BindingSlot) {
  const bindings = cloneBindings(source);
  bindings[action][slot] = null;
  return bindings;
}

export function isActionUnbound(bindings: ControlBindings, action: InputAction) {
  return !bindings[action].primary && !bindings[action].secondary;
}

const KEY_LABELS: Record<string, string> = {
  " ": "SPACE",
  escape: "ESC",
  shift: "SHIFT",
  control: "CTRL",
  alt: "ALT",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

export function formatBinding(binding: InputBinding | null, lang: "es" | "en" = "es") {
  if (!binding) return lang === "es" ? "Sin asignar" : "Unbound";
  const [kind, value] = binding.split(":");
  if (kind === "KEY") return KEY_LABELS[value] ?? value.toUpperCase();
  if (kind === "MOUSE") {
    const labels = lang === "es" ? ["CLIC IZQ.", "RUEDA", "CLIC DER.", "MOUSE 4", "MOUSE 5"] : ["LEFT CLICK", "WHEEL", "RIGHT CLICK", "MOUSE 4", "MOUSE 5"];
    return labels[Number(value)] ?? `MOUSE ${Number(value) + 1}`;
  }
  return value.toUpperCase();
}

export type PassInputSource = "RIGHT_MOUSE" | "KEYBOARD" | "TOUCH";

export type PassRelease = {
  source: PassInputSource;
  pointerId: number;
  heldMs: number;
  charge: number;
};

type ActivePassAction = {
  source: PassInputSource;
  pointerId: number;
  startedAt: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Central semantic input boundary. Physical keys/buttons are resolved to
 * actions here; gameplay consumes actions and never depends on hardcoded keys.
 */
export class InputManager {
  private bindings: ControlBindings;
  private heldActions = new Set<InputAction>();
  private pressedActions = new Set<InputAction>();
  private releasedActions = new Set<InputAction>();
  private activePass: ActivePassAction | null = null;
  private pressedEdge = false;
  private releasedEdge = false;

  constructor(bindings: ControlBindings = DEFAULT_CONTROL_BINDINGS) {
    this.bindings = cloneBindings(bindings);
  }

  setBindings(bindings: ControlBindings) {
    this.bindings = cloneBindings(bindings);
    this.heldActions.clear();
    this.pressedActions.clear();
    this.releasedActions.clear();
  }

  getBindings() {
    return cloneBindings(this.bindings);
  }

  actionsForBinding(binding: InputBinding) {
    return INPUT_ACTIONS.filter((action) => this.bindings[action].primary === binding || this.bindings[action].secondary === binding);
  }

  private pressBinding(binding: InputBinding) {
    const actions = this.actionsForBinding(binding);
    actions.forEach((action) => {
      if (!this.heldActions.has(action)) this.pressedActions.add(action);
      this.heldActions.add(action);
    });
    return actions;
  }

  private releaseBinding(binding: InputBinding) {
    const actions = this.actionsForBinding(binding);
    actions.forEach((action) => {
      if (this.heldActions.delete(action)) this.releasedActions.add(action);
    });
    return actions;
  }

  handleKeyDown(key: string) {
    return this.pressBinding(keyboardBinding(key));
  }

  handleKeyUp(key: string) {
    return this.releaseBinding(keyboardBinding(key));
  }

  handleMouseDown(button: number) {
    return this.pressBinding(mouseBinding(button));
  }

  handleMouseUp(button: number) {
    return this.releaseBinding(mouseBinding(button));
  }

  setTouchAction(action: InputAction, held: boolean) {
    if (held) {
      if (!this.heldActions.has(action)) this.pressedActions.add(action);
      this.heldActions.add(action);
    } else if (this.heldActions.delete(action)) this.releasedActions.add(action);
  }

  isHeld(action: InputAction) {
    return this.heldActions.has(action);
  }

  isPressed(action: InputAction) {
    return this.pressedActions.has(action);
  }

  isReleased(action: InputAction) {
    return this.releasedActions.has(action);
  }

  consumePressed(action: InputAction) {
    return this.pressedActions.delete(action);
  }

  consumeReleased(action: InputAction) {
    return this.releasedActions.delete(action);
  }

  get passPressed() {
    return this.pressedEdge;
  }

  get passHeld() {
    return this.activePass !== null;
  }

  get passReleased() {
    return this.releasedEdge;
  }

  isPassPressed() {
    return this.passPressed;
  }

  isPassHeld() {
    return this.passHeld;
  }

  isPassReleased() {
    return this.passReleased;
  }

  beginPass(source: PassInputSource, pointerId: number, now: number) {
    if (this.activePass) return false;
    this.activePass = { source, pointerId, startedAt: now };
    this.pressedEdge = true;
    this.releasedEdge = false;
    return true;
  }

  endPass(source: PassInputSource, pointerId: number, now: number): PassRelease | null {
    const active = this.activePass;
    if (!active || active.source !== source || active.pointerId !== pointerId) return null;
    const heldMs = Math.max(0, now - active.startedAt);
    this.activePass = null;
    this.releasedEdge = true;
    return { source, pointerId, heldMs, charge: clamp01(heldMs / PASS_CHARGE_MS) };
  }

  /** Backwards-compatible helper; it resolves whichever mouse button is bound to PASS. */
  handlePointerDown(button: number, pointerId: number, now: number) {
    if (!this.actionsForBinding(mouseBinding(button)).includes("PASS")) return false;
    this.handleMouseDown(button);
    return this.beginPass(button === RIGHT_MOUSE_BUTTON ? "RIGHT_MOUSE" : "KEYBOARD", pointerId, now);
  }

  handlePointerUp(button: number, pointerId: number, now: number) {
    if (!this.actionsForBinding(mouseBinding(button)).includes("PASS")) return null;
    this.handleMouseUp(button);
    return this.endPass(button === RIGHT_MOUSE_BUTTON ? "RIGHT_MOUSE" : "KEYBOARD", pointerId, now);
  }

  getPassCharge(now: number) {
    if (!this.activePass) return 0;
    return clamp01(Math.max(0, now - this.activePass.startedAt) / PASS_CHARGE_MS);
  }

  consumePassPressed() {
    const pressed = this.pressedEdge;
    this.pressedEdge = false;
    return pressed;
  }

  consumePassReleased() {
    const released = this.releasedEdge;
    this.releasedEdge = false;
    return released;
  }

  cancelPass(source?: PassInputSource, pointerId?: number) {
    const active = this.activePass;
    if (!active) return false;
    if (source !== undefined && active.source !== source) return false;
    if (pointerId !== undefined && active.pointerId !== pointerId) return false;
    this.activePass = null;
    this.pressedEdge = false;
    return true;
  }

  reset() {
    this.activePass = null;
    this.pressedEdge = false;
    this.releasedEdge = false;
    this.heldActions.clear();
    this.pressedActions.clear();
    this.releasedActions.clear();
  }
}
