import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),pagePath=join(here,"..","app","page.tsx"),cssPath=join(here,"..","app","globals.css");let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_V3_CINEMATIC_REPLAY")){
  const from='new ReplayController({goalPauseMs:1050,replayDurationMs:3400,watchdogMs:8000})';
  const to='new ReplayController({goalPauseMs:1050,replayDurationMs:5200,watchdogMs:11000})';
  if(!page.includes(from))throw new Error("V3 cinematic replay controller pattern missing");
  page=page.replace(from,to).replace('// MSC_V3_PRESENTATION_RUNTIME — richer impact audio, mobile haptics, clip recording and native sharing.','// MSC_V3_PRESENTATION_RUNTIME — richer impact audio, mobile haptics, clip recording and native sharing.\n// MSC_V3_CINEMATIC_REPLAY — goal buffer is replayed more slowly without changing live physics.');
  page=page.replace('{txt(lang,"REPETICIÓN","REPLAY")}</b>','{txt(lang,"REPETICIÓN · 0.65X","REPLAY · 0.65X")}</b>');
  writeFileSync(pagePath,page);
}
let css=readFileSync(cssPath,"utf8");if(!css.includes("MSC_V3_CINEMATIC_REPLAY_CSS")){css+=`\n/* MSC_V3_CINEMATIC_REPLAY_CSS */\n.game-screen[data-game-mode="REPLAY"] canvas{filter:saturate(1.14) contrast(1.05) brightness(.94)}.game-screen[data-game-mode="REPLAY"]::before{content:"CINEMATIC REPLAY";position:absolute;z-index:8;left:50%;top:44px;transform:translateX(-50%);padding:4px 9px;border-radius:999px;background:rgba(2,5,4,.62);color:rgba(255,255,255,.72);font-size:7px;font-weight:950;letter-spacing:.14em;pointer-events:none}.game-screen[data-game-mode="REPLAY"]::after{content:"";position:absolute;z-index:6;inset:0;box-shadow:inset 0 36px 28px rgba(0,0,0,.22),inset 0 -36px 28px rgba(0,0,0,.22);pointer-events:none}\n`;writeFileSync(cssPath,css)}
const final=readFileSync(pagePath,"utf8");if(!final.includes("replayDurationMs:5200")||!final.includes("0.65X"))throw new Error("V3 cinematic replay verification failed");console.log("Mini Soccer Complete v3 cinematic replay verified.");
