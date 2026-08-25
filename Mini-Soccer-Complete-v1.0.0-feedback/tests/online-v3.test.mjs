import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COMPETITIVE_RULES_V3 } from "../app/modes-v3.ts";

const online=readFileSync(new URL("../app/online-match-v3.tsx",import.meta.url),"utf8");
const cloud=readFileSync(new URL("../app/cloud-v3.ts",import.meta.url),"utf8");

test("competitive online forbids gameplay purchases",()=>{assert.equal(COMPETITIVE_RULES_V3.allowBoosts,false);assert.equal(COMPETITIVE_RULES_V3.allowAutoWin,false);assert.equal(COMPETITIVE_RULES_V3.allowFreeGoals,false);assert.equal(COMPETITIVE_RULES_V3.allowCosmetics,true)});
test("host is authoritative for physics and score",()=>{assert.match(online,/if\(!isHost\)return;let raf/);assert.match(online,/scoreRef\.current=\[/);assert.match(online,/send\("snapshot"/);assert.match(online,/serverAuthoritative|Match authority|autoridad/i)});
test("guest sends inputs instead of authoritative scores",()=>{assert.match(online,/if\(!isHost\)void send\("input"/);assert.match(online,/latestSnapshot/);assert.doesNotMatch(online,/AUTO_WIN|THREE_GOAL_START|AI_FIRST_GOAL/)});
test("network cadence stays below browser flooding rates",()=>{assert.match(online,/},33\)/);assert.match(online,/now-lastBroadcast\.current>80/)});
test("realtime channel uses room-scoped broadcast and presence",()=>{assert.match(cloud,/msc-match-\$\{roomId\}/);assert.match(cloud,/event:"input"/);assert.match(cloud,/event:"snapshot"/);assert.match(cloud,/presence/)});
