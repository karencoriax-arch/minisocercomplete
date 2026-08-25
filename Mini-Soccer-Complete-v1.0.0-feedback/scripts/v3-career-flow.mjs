import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),app=join(root,"app"),uiPath=join(app,"progression-v3-ui.tsx"),pagePath=join(app,"page.tsx"),cssPath=join(app,"globals.css");
const replace=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`V3 career flow did not match: ${label}`);return next};
let ui=readFileSync(uiPath,"utf8");
if(!ui.includes("MSC_V3_CAREER_FLOW_UI")){
 ui=ui.replace('// MSC_V3_ONLINE_MATCH_UI — casual crossplay lobby can launch a host-authoritative match.','// MSC_V3_ONLINE_MATCH_UI — casual crossplay lobby can launch a host-authoritative match.\n// MSC_V3_CAREER_FLOW_UI — active career launches its own matches.');
 ui=replace(ui,'onStartTraining?:(kind:TrainingKind)=>void;onStartOnline?:(room:OnlineRoomV3,userId:string)=>void}){','onStartTraining?:(kind:TrainingKind)=>void;onStartOnline?:(room:OnlineRoomV3,userId:string)=>void;onPlayCareer?:()=>void}){',"career callback type");
 ui=replace(ui,'onEconomy,onBack,onStartTraining,onStartOnline}:{lang:Lang;','onEconomy,onBack,onStartTraining,onStartOnline,onPlayCareer}:{lang:Lang;',"career callback destructure");
 ui=replace(ui,'<p>{t(lang,"Objetivo","Objective")}: {state.career.objective.replaceAll("_"," ")}</p></section><section className="v3-stat-grid">','<p>{t(lang,"Objetivo","Objective")}: {state.career.objective.replaceAll("_"," ")}</p><button className="v3-career-play" onClick={()=>onPlayCareer?.()}>{t(lang,"SIGUIENTE PARTIDO","NEXT MATCH")} →</button></section><section className="v3-stat-grid">',"career play button");
 writeFileSync(uiPath,ui);
}
let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_V3_CAREER_FLOW_RUNTIME")){
 page=page.replace('// MSC_V3_LOCAL_MATCH_RUNTIME — local two-player match, no economy rewards.','// MSC_V3_LOCAL_MATCH_RUNTIME — local two-player match, no economy rewards.\n// MSC_V3_CAREER_FLOW_RUNTIME — career team enters Carrera directly.');
 page=replace(page,'onStartOnline={(room,userId)=>{setOnlineSessionV3({room,userId});setMatchBoosts(EMPTY_MATCH_BOOSTS);void setOnlineRoomStatusV3(room.id,"PLAYING");setScreen("onlineMatchV3")}} onBack={()=>setScreen("home")}/>','onStartOnline={(room,userId)=>{setOnlineSessionV3({room,userId});setMatchBoosts(EMPTY_MATCH_BOOSTS);void setOnlineRoomStatusV3(room.id,"PLAYING");setScreen("onlineMatchV3")}} onPlayCareer={()=>{const careerTeam=progressV3Ref.current.career.teamId;if(!careerTeam)return;setTeamId(careerTeam);chooseMode("Carrera")}} onBack={()=>setScreen("home")}/>',"career runtime callback");
 writeFileSync(pagePath,page);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_CAREER_FLOW_CSS")){css+=`\n/* MSC_V3_CAREER_FLOW_CSS */\n.v3-career-play{margin-top:12px;border:0;border-radius:8px;padding:11px 15px;background:#d9ff45;color:#071008;font-weight:950;letter-spacing:.06em}.v3-friend-list{display:grid;gap:6px;margin-top:12px}.v3-friend-list>div{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#050b07}.v3-friend-list span{display:grid}.v3-friend-list small{color:#819087;font-size:8px}.v3-friend-list em{color:#d9ff45;font-size:8px;font-style:normal;font-weight:950}\n`;writeFileSync(cssPath,css)}
const finalUi=readFileSync(uiPath,"utf8"),finalPage=readFileSync(pagePath,"utf8");for(const [ok,label] of [[finalUi.includes("SIGUIENTE PARTIDO"),"career play"],[finalPage.includes('chooseMode("Carrera")'),"career runtime"]])if(!ok)throw new Error(`V3 career flow verification failed: ${label}`);console.log("Mini Soccer Complete v3 career flow verified.");
