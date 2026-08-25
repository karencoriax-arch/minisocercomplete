import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","app","progression-v3-ui.tsx"),cssPath=join(here,"..","app","globals.css");let source=readFileSync(path,"utf8");
if(!source.includes("MSC_V3_RANKING_BETA_LABEL")){
 const from='{tab==="RANKING"&&<div className="v3-ranking"><section className="v3-cloud-box">';
 const to='{tab==="RANKING"&&<div className="v3-ranking"><div className="v3-ranking-beta"><b>{t(lang,"RANKING DE PROGRESO · BETA","PROGRESSION RANKING · BETA")}</b><span>{t(lang,"Compara perfiles y RP de progresión. No es todavía un ladder PvP verificado por servidor.","Compares profiles and progression RP. This is not yet a server-verified PvP ladder.")}</span></div><section className="v3-cloud-box">';
 const next=source.replace(from,to);if(next===source)throw new Error("V3 ranking beta label did not match");source=source.replace('// MSC_V3_PROFILE_BANNER — equipped profile banners are visible.','// MSC_V3_PROFILE_BANNER — equipped profile banners are visible.\n// MSC_V3_RANKING_BETA_LABEL — progression ranking is not presented as verified PvP.').replace(from,to);writeFileSync(path,source);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_RANKING_BETA_CSS")){css+=`\n/* MSC_V3_RANKING_BETA_CSS */\n.v3-ranking-beta{display:flex;justify-content:space-between;gap:15px;padding:9px 12px;margin-bottom:9px;border:1px solid rgba(250,204,21,.24);border-radius:8px;background:rgba(250,204,21,.045)}.v3-ranking-beta b{color:#facc15;font-size:9px}.v3-ranking-beta span{color:#8f9c94;font-size:8px;text-align:right;max-width:520px}\n`;writeFileSync(cssPath,css)}
console.log("Mini Soccer Complete v3 progression-ranking label verified.");
