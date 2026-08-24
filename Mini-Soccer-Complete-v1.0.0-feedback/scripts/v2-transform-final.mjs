import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const sourcePath=join(here,"v2-transform.mjs");
const runtimePath=join(here,".v2-transform-runtime.mjs");
let source=readFileSync(sourcePath,"utf8");

const fixes=[
  ["','economy screen\");", "',\"economy screen\");"],
  ["','pre-match screen\");", "',\"pre-match screen\");"],
  ["','autosave boosts\");", "',\"autosave boosts\");"],
  ["','game boost props\");", "',\"game boost props\");"],
  ["','result reward prop\");", "',\"result reward prop\");"],
];
for(const [from,to] of fixes)source=source.replace(from,to);

writeFileSync(runtimePath,source);
try{
  await import(`${pathToFileURL(runtimePath).href}?v=${Date.now()}`);
}finally{
  try{unlinkSync(runtimePath)}catch{}
}
