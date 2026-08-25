import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ECONOMY,
  applyMatchEconomy,
  buyKit,
  buyResource,
  claimMission,
  consumeMatchSelection,
  equipKit,
  kitPrice,
  parseEconomyState,
} from "../app/economy-v2.ts";

const fresh = () => parseEconomyState(null);
const playedWin = (overrides = {}) => ({
  played: true,
  won: true,
  drew: false,
  goalsFor: 2,
  goalsAgainst: 1,
  completedPasses: 10,
  difficulty: "Medio",
  ...overrides,
});

test("economía nueva empieza con 500 MSC y sin gemas", () => {
  const state = fresh();
  assert.equal(state.msc, 500);
  assert.equal(state.gems, 0);
  assert.equal(state.realWinStreakProgress, 0);
});

test("cinco victorias realmente jugadas entregan 5 gemas", () => {
  let state = fresh();
  let gemsEarned = 0;
  for (let i = 0; i < 5; i++) {
    const result = applyMatchEconomy(state, playedWin());
    state = result.state;
    gemsEarned += result.reward.gems;
  }
  assert.equal(gemsEarned, 5);
  assert.equal(state.gems, 5);
  assert.equal(state.realWinStreakProgress, 0);
});

test("una victoria simulada no genera MSC, gemas ni misiones", () => {
  const state = fresh();
  const result = applyMatchEconomy(state, { ...playedWin(), played: false, simulated: true });
  assert.equal(result.reward.msc, 0);
  assert.equal(result.reward.gems, 0);
  assert.equal(result.state.msc, state.msc);
  assert.deepEqual(result.state.missionProgress, state.missionProgress);
  assert.equal(result.state.realWinStreakProgress, 0);
});

test("los goles regalados no inflan recompensas ni misión de goles", () => {
  const state = fresh();
  const result = applyMatchEconomy(state, playedWin({ goalsFor: 3, freeGoals: 3 }));
  assert.equal(result.state.missionProgress.SCORE_3, 0);
  assert.ok(!result.reward.breakdown.some(item => item.startsWith("Goles reales")));
});

test("precios de camisetas respetan bandas 5000, 8000 y 12000 MSC", () => {
  assert.equal(kitPrice(80), 5000);
  assert.equal(kitPrice(85), 8000);
  assert.equal(kitPrice(89), 12000);
});

test("camiseta comprada queda en inventario y solo se equipa si se posee", () => {
  const rich = { ...fresh(), msc: 20000 };
  const purchased = buyKit(rich, "arg", 12000);
  assert.equal(purchased.ok, true);
  assert.ok(purchased.state.inventory.kits.includes("arg"));
  assert.equal(purchased.state.msc, 8000);
  assert.equal(equipKit(purchased.state, "arg").equippedKitId, "arg");
  assert.equal(equipKit(fresh(), "arg").equippedKitId, null);
});

test("recurso comprado se descuenta y se consume una sola vez", () => {
  const rich = { ...fresh(), msc: 5000 };
  const purchase = buyResource(rich, "AI_FIRST_GOAL");
  assert.equal(purchase.ok, true);
  assert.equal(purchase.state.msc, 3500);
  assert.equal(purchase.state.inventory.resources.AI_FIRST_GOAL, 1);
  const consumed = consumeMatchSelection(purchase.state, { resources: ["AI_FIRST_GOAL"], gemBoost: null });
  assert.equal(consumed.ok, true);
  assert.equal(consumed.state.inventory.resources.AI_FIRST_GOAL, 0);
});

test("auto win cuesta 15 gemas y no puede usarse sin saldo", () => {
  const broke = consumeMatchSelection(fresh(), { resources: [], gemBoost: "AUTO_WIN" });
  assert.equal(broke.ok, false);
  const underfunded = { ...fresh(), gems: 14 };
  assert.equal(consumeMatchSelection(underfunded, { resources: [], gemBoost: "AUTO_WIN" }).ok, false);
  const funded = { ...fresh(), gems: 20 };
  const used = consumeMatchSelection(funded, { resources: [], gemBoost: "AUTO_WIN" });
  assert.equal(used.ok, true);
  assert.equal(used.state.gems, 5);
});

test("ventaja 3-0 cuesta 8 gemas", () => {
  const funded = { ...fresh(), gems: 10 };
  const used = consumeMatchSelection(funded, { resources: [], gemBoost: "THREE_GOAL_START" });
  assert.equal(used.ok, true);
  assert.equal(used.state.gems, 2);
});

test("una misión solo puede cobrarse una vez", () => {
  let state = fresh();
  state = { ...state, missionProgress: { ...state.missionProgress, WIN_1: 1 } };
  const first = claimMission(state, "WIN_1");
  assert.equal(first.ok, true);
  assert.equal(first.state.msc, DEFAULT_ECONOMY.msc + 250);
  const second = claimMission(first.state, "WIN_1");
  assert.equal(second.ok, false);
  assert.equal(second.state.msc, first.state.msc);
});
