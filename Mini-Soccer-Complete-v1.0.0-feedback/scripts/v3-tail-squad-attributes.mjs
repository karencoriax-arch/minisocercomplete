import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),pagePath=join(here,"..","app","page.tsx"),cssPath=join(here,"..","app","globals.css");let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_V3_SQUAD_ATTRIBUTES")){
 const from='<small>{p.role} · {txt(lang,"Velocidad","Pace")} {Math.min(96,p.rating+3)}</small>';
 const to='<small className="v3-player-attrs">{p.role} · VEL {derivePlayerAttributes(p.name,p.rating,p.role).pace} · PAS {derivePlayerAttributes(p.name,p.rating,p.role).pass} · TIR {derivePlayerAttributes(p.name,p.rating,p.role).shoot} · DEF {derivePlayerAttributes(p.name,p.rating,p.role).defense}</small>';
 if(!page.includes(from))throw new Error("V3 squad attribute pattern missing");page=page.replace(from,to).replace('// MSC_V3_PLAYER_ATTRIBUTES_COMPLETE — pace, stamina, passing and finishing all affect live gameplay.','// MSC_V3_PLAYER_ATTRIBUTES_COMPLETE — pace, stamina, passing and finishing all affect live gameplay.\n// MSC_V3_SQUAD_ATTRIBUTES — player differences are visible before kickoff.');writeFileSync(pagePath,page);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_SQUAD_ATTRIBUTES_CSS")){css+=`\n/* MSC_V3_SQUAD_ATTRIBUTES_CSS */\n.player-card .v3-player-attrs{font-size:7px!important;letter-spacing:.02em;white-space:normal;line-height:1.35;color:#8fa097!important}\n`;writeFileSync(cssPath,css)}
if(!readFileSync(pagePath,"utf8").includes("v3-player-attrs"))throw new Error("V3 squad attribute verification failed");console.log("Mini Soccer Complete v3 squad attributes verified.");
