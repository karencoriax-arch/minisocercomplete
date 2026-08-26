import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const pagePath=join(here,"..","app","page.tsx");
let page=readFileSync(pagePath,"utf8");

// v2.3.0 runtime hotfix: the shot planner property is named goalkeeperRush,
// while the local variable is keeperRush. Bare `goalkeeperRush` caused a
// browser ReferenceError as soon as shot decision logic executed.
const bad="goalkeeperCoverage:keeperCoverage,goalkeeperRush,targetY:";
const good="goalkeeperCoverage:keeperCoverage,goalkeeperRush:keeperRush,targetY:";
const count=page.split(bad).length-1;
if(count>0)page=page.split(bad).join(good);

if(page.includes(bad))throw new Error("v2.3 runtime hotfix failed: unresolved goalkeeperRush reference");
const fixedCount=page.split(good).length-1;
if(fixedCount<2)throw new Error(`v2.3 runtime hotfix expected both shot paths, found ${fixedCount}`);

writeFileSync(pagePath,page);
console.log(`Mini Soccer Complete v2.3.0 runtime hotfix passed (${fixedCount} goalkeeperRush bindings).`);
