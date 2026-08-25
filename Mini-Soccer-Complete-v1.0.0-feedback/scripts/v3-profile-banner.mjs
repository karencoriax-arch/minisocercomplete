import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),uiPath=join(root,"app","progression-v3-ui.tsx"),cssPath=join(root,"app","globals.css");let ui=readFileSync(uiPath,"utf8");
if(!ui.includes("MSC_V3_PROFILE_BANNER")){
 const from='<div className="v3-profile-grid"><section className="v3-card featured"><span>{division.name}</span>';
 const to='<div className="v3-profile-grid"><section className={`v3-card featured ${state.equipped.BANNER?`banner-${state.equipped.BANNER.replace(/^banner_/,"")}`:""}`}><span>{division.name}</span>';
 const next=ui.replace(from,to);if(next===ui)throw new Error("V3 profile banner UI pattern did not match");ui=next.replace('// MSC_V3_CAREER_FLOW_UI — active career launches its own matches.','// MSC_V3_CAREER_FLOW_UI — active career launches its own matches.\n// MSC_V3_PROFILE_BANNER — equipped profile banners are visible.');writeFileSync(uiPath,ui);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_PROFILE_BANNER_CSS")){css+=`\n/* MSC_V3_PROFILE_BANNER_CSS */\n.v3-card.banner-argentum{background:linear-gradient(135deg,rgba(125,211,252,.14),rgba(248,250,252,.04) 42%,#07100a 80%);border-color:rgba(125,211,252,.35)}.v3-card.banner-world{background:radial-gradient(circle at 90% 10%,rgba(250,204,21,.2),transparent 34%),linear-gradient(135deg,rgba(125,211,252,.12),#07100a 65%);border-color:rgba(250,204,21,.38)}.v3-card.banner-elite{background:radial-gradient(circle at 15% 0,rgba(217,255,69,.22),transparent 33%),linear-gradient(120deg,#0a140c,#151207 65%,#07100a);border-color:#d9ff45;box-shadow:0 0 28px rgba(217,255,69,.12)}\n`;writeFileSync(cssPath,css)}
if(!readFileSync(uiPath,"utf8").includes("banner-${state.equipped.BANNER"))throw new Error("V3 profile banner verification failed");console.log("Mini Soccer Complete v3 profile banners verified.");
