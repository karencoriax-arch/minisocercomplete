import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const versionPath=join(root,"app","version.ts");
const version=readFileSync(versionPath,"utf8");

const run=async name=>await import(`${pathToFileURL(join(here,name)).href}?run=${Date.now()}-${Math.random()}`);
const runV21=async()=>{await run("v21-progression-transform-final.mjs");await run("v21-economy-ui-transform.mjs");await run("v21-progression-balance.mjs")};
const runV22=async()=>{await runV21();await run("v22-store-transform.mjs")};
const runV23=async()=>{await runV22();await run("v23-gameplay-transform-final.mjs")};

if(version.includes('GAME_VERSION = "2.3.0"')){
  await run("v23-gameplay-transform-final.mjs");
}else if(version.includes('GAME_VERSION = "2.2.0"')){
  await run("v23-gameplay-transform-final.mjs");
}else if(version.includes('GAME_VERSION = "2.1.0"')){
  await runV22();
  await run("v23-gameplay-transform-final.mjs");
}else if(version.includes('GAME_VERSION = "2.0.1"')){
  await run("cross-platform-v2.0.1.mjs");
  await runV23();
}else{
  if(!version.includes('GAME_VERSION = "2.0.0"')){
    await run("mobile-v1.2-transform.mjs");
    await run("mobile-v1.2-followup.mjs");
    await run("mobile-v1.2.1-final.mjs");
  }
  await run("v2-transform-final.mjs");
  await run("cross-platform-v2.0.1.mjs");
  await runV23();
}
