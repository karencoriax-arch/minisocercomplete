import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","package.json");let pkg=readFileSync(path,"utf8");
if(!pkg.includes("simulate-v3-stress.mjs")){
  const from='"test:simulation": "node --experimental-strip-types scripts/simulate-difficulties.mjs && node --experimental-strip-types scripts/simulate-formats.mjs"';
  const to='"test:simulation": "node --experimental-strip-types scripts/simulate-difficulties.mjs && node --experimental-strip-types scripts/simulate-formats.mjs && node --experimental-strip-types scripts/simulate-v3-stress.mjs"';
  if(!pkg.includes(from))throw new Error("V3 stress test simulation script anchor missing");pkg=pkg.replace(from,to);writeFileSync(path,pkg);
}
if(!readFileSync(path,"utf8").includes("simulate-v3-stress.mjs"))throw new Error("V3 stress test gate verification failed");console.log("Mini Soccer Complete v3 stress simulation gate verified.");
