import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const progressionPath=join(root,"app","progression-v21.ts");
const testPath=join(root,"tests","progression-v21.test.mjs");

let source=readFileSync(progressionPath,"utf8");
const replacements=[
  ['id: "D_PLAY_2", target: 2, xp: 90','id: "D_PLAY_2", target: 2, xp: 25'],
  ['id: "D_SCORE_5", target: 5, xp: 100','id: "D_SCORE_5", target: 5, xp: 30'],
  ['id: "D_PASSES_20", target: 20, xp: 80','id: "D_PASSES_20", target: 20, xp: 20'],
  ['id: "D_WIN_1", target: 1, xp: 100','id: "D_WIN_1", target: 1, xp: 30'],
  ['id: "W_PLAY_8", target: 8, xp: 260','id: "W_PLAY_8", target: 8, xp: 45'],
  ['id: "W_WIN_5", target: 5, xp: 320','id: "W_WIN_5", target: 5, xp: 55'],
  ['id: "W_SCORE_25", target: 25, xp: 300','id: "W_SCORE_25", target: 25, xp: 50'],
  ['id: "W_CLEAN_3", target: 3, xp: 340','id: "W_CLEAN_3", target: 3, xp: 60'],
  ['id: "W_TEAMS_3", target: 3, xp: 240','id: "W_TEAMS_3", target: 3, xp: 40'],
];
for(const [from,to] of replacements){if(source.includes(from))source=source.replace(from,to)}
writeFileSync(progressionPath,source);

let tests=readFileSync(testPath,"utf8");
tests=tests.replace('assert.equal(claim.xp, 90);','assert.equal(claim.xp, 25);');
writeFileSync(testPath,tests);

const final=readFileSync(progressionPath,"utf8");
const expected=[25,30,20,30,45,55,50,60,40];
for(const xp of expected)if(!final.includes(`xp: ${xp}, msc:`))throw new Error(`v2.1 progression XP balance missing ${xp}`);
if(final.includes('xp: 340, msc:')||final.includes('xp: 320, msc:')||final.includes('xp: 300, msc:'))throw new Error("legacy oversized mission XP remains");
console.log("Mini Soccer Complete v2.1.0 mission XP balance passed.");
