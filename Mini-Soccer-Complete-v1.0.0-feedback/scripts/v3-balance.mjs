import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),app=join(root,"app");
const patchFile=(name,marker,changes)=>{const path=join(app,name);let source=readFileSync(path,"utf8");if(source.includes(marker))return;for(const [from,to,label] of changes){const next=source.replace(from,to);if(next===source)throw new Error(`V3 balance did not match ${name}: ${label}`);source=next}source=`// ${marker}\n${source}`;writeFileSync(path,source)};
patchFile("economy-v2.ts","MSC_V3_ECONOMY_BALANCE",[
 ['id: "AUTO_WIN",\n    icon: "◆",\n    cost: 5,','id: "AUTO_WIN",\n    icon: "◆",\n    cost: 15,',"auto win cost"],
 ['id: "THREE_GOAL_START",\n    icon: "✦",\n    cost: 5,','id: "THREE_GOAL_START",\n    icon: "✦",\n    cost: 8,',"three goal cost"],
 ['gemReward = 10;','gemReward = 5;',"five win gems"],
 ['breakdown.push("5 victorias jugadas +10 gemas");','breakdown.push("5 victorias jugadas +5 gemas");',"gem label"],
]);
patchFile("match-tuning-v3.ts","MSC_V3_TUNING_POLISH",[['label:"VASelina"','label:"VASELINA"',"chip label"]]);
console.log("Mini Soccer Complete v3 economy and tuning balance verified.");
