import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const sourcePath=join(here,"v23-gameplay-transform.mjs");
const runtimePath=join(here,".v23-gameplay-runtime.mjs");
let source=readFileSync(sourcePath,"utf8");

// v1.2.1 intentionally lowered compact 3v3/4v4 pass speeds and added a mobile
// tap/hold charge curve. v2.3 must tune pass types on top of those values rather
// than reverting them. Short taps remain soft nearby, while a locked distant
// receiver gets a distance-aware minimum so the ball cannot die absurdly early.
source=source
  .replaceAll("minimumSpeed:{3:220,4:225,5:230,6:235}","minimumSpeed:{3:145,4:155,5:230,6:235}")
  .replaceAll("maximumSpeed:{3:610,4:640,5:680,6:720}","maximumSpeed:{3:500,4:540,5:680,6:720}")
  .replaceAll(
    "    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);",
    "    // MSC_V23_DISTANCE_AWARE_PASS_POWER\\n    const compactFormat=args.format===3||args.format===4,normalizedCharge=clamp(args.charge,0,1),compactDistanceRatio=clamp(args.distance/Math.max(1,args.fieldDiagonal),0,1),distancePowerFloor=clamp(.44+compactDistanceRatio*1.32,.45,.88),rawCompactPower=.45+Math.pow(normalizedCharge,.82)*.78;\\n    const userPowerModifier=compactFormat?clamp(Math.max(rawCompactPower,distancePowerFloor),.45,1.23):clamp(.86+normalizedCharge*.30,.88,1.16);",
  )
  .replace(
    "    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.88,PASS_PHYSICS.maximumSpeed[args.format]*1.05);",
    "    const lowerSpeed=compactFormat?PASS_PHYSICS.minimumSpeed[args.format]*.68:PASS_PHYSICS.minimumSpeed[args.format]*.88;\\n    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,lowerSpeed,PASS_PHYSICS.maximumSpeed[args.format]*1.05);",
  )
  .replace(
    "    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.86,PASS_PHYSICS.maximumSpeed[args.format]*1.05);",
    "    const lowerSpeed=compactFormat?PASS_PHYSICS.minimumSpeed[args.format]*.68:PASS_PHYSICS.minimumSpeed[args.format]*.86;\\n    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,lowerSpeed,PASS_PHYSICS.maximumSpeed[args.format]*1.05);",
  );

writeFileSync(runtimePath,source);
try{
  await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}-${Math.random()}`);
}finally{
  try{unlinkSync(runtimePath)}catch{}
}
