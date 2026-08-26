import ts from "typescript";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const configPath=join(root,"tsconfig.json");
const configFile=ts.readConfigFile(configPath,ts.sys.readFile);
if(configFile.error)throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText,"\n"));
const parsed=ts.parseJsonConfigFileContent(configFile.config,ts.sys,root);
const program=ts.createProgram({rootNames:parsed.fileNames,options:parsed.options});
const diagnostics=ts.getPreEmitDiagnostics(program);
const fatalCodes=new Set([2304,2448,2454,2552]);
const fatal=diagnostics.filter(d=>d.file&&d.file.fileName.includes(`${join(root,"app")}`)&&fatalCodes.has(d.code));
if(fatal.length){
  const host={getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=>"\n"};
  throw new Error("Runtime name validation failed:\n"+ts.formatDiagnosticsWithColorAndContext(fatal,host));
}
console.log("Mini Soccer Complete runtime undefined-name validation passed.");
