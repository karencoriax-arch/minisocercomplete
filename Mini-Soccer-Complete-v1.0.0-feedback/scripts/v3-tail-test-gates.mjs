import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","package.json");
let pkg=readFileSync(path,"utf8");
if(!pkg.includes("tests/cloud-backup-v3.test.mjs")){
  const anchor='node --experimental-strip-types --test tests/online-v3.test.mjs &&';
  if(!pkg.includes(anchor))throw new Error("V3 test gate anchor missing");
  pkg=pkg.replaceAll(anchor,`${anchor} node --experimental-strip-types --test tests/cloud-backup-v3.test.mjs &&`);
}
writeFileSync(path,pkg);
const final=readFileSync(path,"utf8");if(!final.includes("tests/cloud-backup-v3.test.mjs"))throw new Error("V3 cloud backup test gate verification failed");console.log("Mini Soccer Complete v3 final test gates verified.");
