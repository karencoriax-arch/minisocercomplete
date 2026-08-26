import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const sourcePath=join(here,"v23-gameplay-transform.mjs");
const runtimePath=join(here,".v23-gameplay-runtime.mjs");
let source=readFileSync(sourcePath,"utf8");

// v1.2.1 intentionally lowered compact 3v3/4v4 pass speeds and added a mobile
// tap/hold charge curve. v2.3 must tune pass types on top of those values rather
// than reverting them. The input and output templates are patched separately so
// the transform always matches the v1.2.1 runtime and produces the v2.3 runtime.
source=source
  .replaceAll("minimumSpeed:{3:220,4:225,5:230,6:235}","minimumSpeed:{3:145,4:155,5:230,6:235}")
  .replaceAll("maximumSpeed:{3:610,4:640,5:680,6:720}","maximumSpeed:{3:500,4:540,5:680,6:720}");

const genericPower="    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);";
const mobileInputPower="    // MSC_MOBILE_V121_PASS_POWER\\n    const compactFormat=args.format===3||args.format===4,normalizedCharge=clamp(args.charge,0,1);\\n    const userPowerModifier=compactFormat?clamp(.45+Math.pow(normalizedCharge,.82)*.78,.45,1.23):clamp(.86+normalizedCharge*.30,.88,1.16);";
const v23OutputPower="    // MSC_V23_DISTANCE_AWARE_PASS_POWER\\n    const compactFormat=args.format===3||args.format===4,normalizedCharge=clamp(args.charge,0,1),compactDistanceRatio=clamp(args.distance/Math.max(1,args.fieldDiagonal),0,1),distancePowerFloor=clamp(.44+compactDistanceRatio*1.32,.45,.88),rawCompactPower=.45+Math.pow(normalizedCharge,.82)*.78;\\n    const userPowerModifier=compactFormat?clamp(Math.max(rawCompactPower,distancePowerFloor),.45,1.23):clamp(.86+normalizedCharge*.30,.88,1.16);";

const replaceAt=(text,index,needle,replacement)=>text.slice(0,index)+replacement+text.slice(index+needle.length);
const firstPower=source.indexOf(genericPower);
if(firstPower<0)throw new Error("v2.3 final wrapper could not find input pass power template");
source=replaceAt(source,firstPower,genericPower,mobileInputPower);
const secondPower=source.indexOf(genericPower,firstPower+mobileInputPower.length);
if(secondPower<0)throw new Error("v2.3 final wrapper could not find output pass power template");
source=replaceAt(source,secondPower,genericPower,v23OutputPower);

const genericInputFloor="    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.88,PASS_PHYSICS.maximumSpeed[args.format]*1.05);";
const mobileInputFloor="    const lowerSpeed=compactFormat?PASS_PHYSICS.minimumSpeed[args.format]*.68:PASS_PHYSICS.minimumSpeed[args.format]*.88;\\n    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,lowerSpeed,PASS_PHYSICS.maximumSpeed[args.format]*1.05);";
const genericOutputFloor="    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.86,PASS_PHYSICS.maximumSpeed[args.format]*1.05);";
const v23OutputFloor="    const lowerSpeed=compactFormat?PASS_PHYSICS.minimumSpeed[args.format]*.68:PASS_PHYSICS.minimumSpeed[args.format]*.86;\\n    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,lowerSpeed,PASS_PHYSICS.maximumSpeed[args.format]*1.05);";
if(!source.includes(genericInputFloor))throw new Error("v2.3 final wrapper could not find input pass floor template");
source=source.replace(genericInputFloor,mobileInputFloor);
if(!source.includes(genericOutputFloor))throw new Error("v2.3 final wrapper could not find output pass floor template");
source=source.replace(genericOutputFloor,v23OutputFloor);

writeFileSync(runtimePath,source);
try{
  await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}-${Math.random()}`);
}finally{
  try{unlinkSync(runtimePath)}catch{}
}

// Telemetry must describe the current ball state, never a stale previous shot.
const pagePath=join(here,"..","app","page.tsx");
let page=readFileSync(pagePath,"utf8");
const staleTelemetry='c.dataset.shotType=activeShotFlight.current?.type??"NONE";';
const liveTelemetry='c.dataset.shotType=ballFlight.current.type==="SHOT"?(activeShotFlight.current?.type??"NORMAL"):"NONE";';
if(page.includes(staleTelemetry)){
  page=page.replace(staleTelemetry,liveTelemetry);
  writeFileSync(pagePath,page);
}else if(!page.includes(liveTelemetry)){
  throw new Error("v2.3 final wrapper could not verify live shot telemetry");
}
