import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const sourcePath=join(here,"v21-progression-transform.mjs");
const runtimePath=join(here,".v21-progression-runtime.mjs");
let source=readFileSync(sourcePath,"utf8");
source=source.replace(`onBack={()=>setScreen("home")}/>} ',`,`onBack={()=>setScreen("home")}/>}',`);
writeFileSync(runtimePath,source);
try{
  await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}-${Math.random()}`);
}finally{
  try{unlinkSync(runtimePath)}catch{}
}
