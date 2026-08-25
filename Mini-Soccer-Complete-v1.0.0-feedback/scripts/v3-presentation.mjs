import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),path=join(root,"app","page.tsx"),cssPath=join(root,"app","globals.css");let page=readFileSync(path,"utf8");
const patch=(from,to,label)=>{const next=page.replace(from,to);if(next===page)throw new Error(`V3 presentation did not match: ${label}`);page=next};
if(!page.includes("MSC_V3_PRESENTATION_RUNTIME")){
 patch('import { TutorialV3 } from "./tutorial-v3";','import { TutorialV3 } from "./tutorial-v3";\nimport { SoundscapeV3, hapticV3, shareResultV3 } from "./presentation-v3";\n// MSC_V3_PRESENTATION_RUNTIME — richer impact audio, mobile haptics and native sharing.',"presentation imports");
 patch('audioCtx=useRef<AudioContext|null>(null),phaseRef=', 'audioCtx=useRef<AudioContext|null>(null),soundscapeV3=useRef(new SoundscapeV3()),phaseRef=',"soundscape ref");
 const mix='Math.max(0,Math.min(1,(settings.audio.master/100)*(settings.audio.effects/100)))*(sound&&settings.audio.effectsEnabled?1:0)';
 page=page.replaceAll('effect(245,.055);',`soundscapeV3.current.impact("PASS",undefined,${mix});if(isMobileRef.current)hapticV3(8);`);
 page=page.replaceAll('effect(88,.1)',`soundscapeV3.current.impact("SHOT",undefined,${mix});if(isMobileRef.current)hapticV3(14)`);
 page=page.replaceAll('effect(680,.09)',`soundscapeV3.current.impact("POST",undefined,${mix});if(isMobileRef.current)hapticV3([18,18,12])`);
 page=page.replaceAll('effect(72,.16);cheer();',`soundscapeV3.current.impact("GOAL",undefined,${mix});soundscapeV3.current.crowd(1,true,Math.max(0,Math.min(1,(settings.audio.master/100)*(settings.audio.crowd/100))));if(isMobileRef.current)hapticV3([25,30,45]);cheer();`);
 patch('<div className="result-actions"><button className="ghost" onClick={onHome}>','<div className="result-actions"><button className="ghost share-result-v3" onClick={()=>shareResultV3(`${team.name} ${score[0]}–${score[1]} ${rival.name} · Mini Soccer Complete · ${report.mvp?`MVP: ${report.mvp.playerName} ${report.mvp.rating}`:""}`)}>↗ {txt(lang,"COMPARTIR","SHARE")}</button><button className="ghost" onClick={onHome}>',"share button");
 writeFileSync(path,page);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_PRESENTATION_CSS")){css+=`\n/* MSC_V3_PRESENTATION_CSS */\n.share-result-v3{border-color:rgba(217,255,69,.35)!important;color:#d9ff45!important}.share-result-v3:hover{background:rgba(217,255,69,.08)!important}.result-actions{flex-wrap:wrap}\n`;writeFileSync(cssPath,css)}
const final=readFileSync(path,"utf8");for(const token of ["SoundscapeV3","hapticV3","shareResultV3","share-result-v3"])if(!final.includes(token))throw new Error(`V3 presentation verification missing ${token}`);console.log("Mini Soccer Complete v3 presentation runtime verified.");
