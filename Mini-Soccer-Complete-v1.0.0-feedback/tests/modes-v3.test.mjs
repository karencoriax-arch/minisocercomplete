import assert from "node:assert/strict";
import test from "node:test";
import { CHALLENGES_V3, COMPETITIVE_RULES_V3, activeEventV3, challengeCompleteV3 } from "../app/modes-v3.ts";

test("catalog has coherent challenge rewards",()=>{assert.ok(CHALLENGES_V3.length>=6);for(const challenge of CHALLENGES_V3){assert.ok(challenge.rewardMSC<=1000);assert.ok(challenge.rewardXP<=500);assert.ok(challenge.rewardGems<=2)}});
test("comeback requires actually overturning the score",()=>{const challenge=CHALLENGES_V3.find(c=>c.id==="COMEBACK_03");assert.ok(challenge);assert.equal(challengeCompleteV3(challenge,{score:[4,3],completedPasses:8,survivedSeconds:90}),true);assert.equal(challengeCompleteV3(challenge,{score:[3,3],completedPasses:8,survivedSeconds:90}),false)});
test("clean sheet fails after conceding",()=>{const challenge=CHALLENGES_V3.find(c=>c.id==="CLEAN_SHEET");assert.ok(challenge);assert.equal(challengeCompleteV3(challenge,{score:[2,1],completedPasses:5,survivedSeconds:180}),false)});
test("competitive mode disables every pay-to-win shortcut",()=>{assert.equal(COMPETITIVE_RULES_V3.allowBoosts,false);assert.equal(COMPETITIVE_RULES_V3.allowAutoWin,false);assert.equal(COMPETITIVE_RULES_V3.allowFreeGoals,false);assert.equal(COMPETITIVE_RULES_V3.serverAuthoritativeScore,true);assert.equal(COMPETITIVE_RULES_V3.allowCosmetics,true)});
test("event rotation is deterministic for the same date",()=>{const date=new Date("2026-08-25T12:00:00Z");assert.deepEqual(activeEventV3(date),activeEventV3(date))});
