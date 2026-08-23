import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const sourcePath=join(here,"mobile-v1.2.1-fixes.mjs");
const tempPath=join(here,".mobile-v1.2.1-runtime.mjs");
let source=readFileSync(sourcePath,"utf8");

// Remove one intentionally harmless anchor that used replaceOrThrow with identical text.
source=source.replace(/\n  settings=replaceOrThrow\(settings,"  return <div className=\{`console-settings \$\{embedded \? \\"embedded\\" : \\"\\"\}`\}","  return <div className=\{`console-settings \$\{embedded \? \\"embedded\\" : \\"\\"\}`\}","settings root anchor"\);/,"");

writeFileSync(tempPath,source);
try{
  await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
}finally{
  try{unlinkSync(tempPath)}catch{}
}
