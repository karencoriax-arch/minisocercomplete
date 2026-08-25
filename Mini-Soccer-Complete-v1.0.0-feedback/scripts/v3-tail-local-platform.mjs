import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),pagePath=join(here,"..","app","page.tsx"),cssPath=join(here,"..","app","globals.css");let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_V3_LOCAL_PC_ONLY")){
 const from='<button onClick={onLocal2P}><span>2P</span>';
 const to='<button className="v3-local2p-home" onClick={onLocal2P}><span>2P</span>';
 if(!page.includes(from))throw new Error("V3 local PC-only button pattern missing");page=page.replace(from,to).replace('// MSC_V3_LOCAL_MATCH_RUNTIME — local two-player match, no economy rewards.','// MSC_V3_LOCAL_MATCH_RUNTIME — local two-player match, no economy rewards.\n// MSC_V3_LOCAL_PC_ONLY — local 2P is hidden on touch-only devices; crossplay handles mobile multiplayer.');writeFileSync(pagePath,page);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_LOCAL_PC_ONLY_CSS")){css+=`\n/* MSC_V3_LOCAL_PC_ONLY_CSS */\n@media (hover:none) and (pointer:coarse){.v3-local2p-home{display:none!important}}\n`;writeFileSync(cssPath,css)}
console.log("Mini Soccer Complete v3 local PC-only UI verified.");
