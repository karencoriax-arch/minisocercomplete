import assert from "node:assert/strict";
import test from "node:test";
import { parseStateBackupV3, restoreMscLocalStateV3, snapshotMscLocalStateV3 } from "../app/cloud-backup-v3.ts";

class MemoryStorage{
  constructor(entries={}){this.map=new Map(Object.entries(entries))}
  get length(){return this.map.size}
  key(index){return [...this.map.keys()][index]??null}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.map.set(key,String(value))}
}

test("backup only includes Mini Soccer owned keys",()=>{const storage=new MemoryStorage({"msc-settings-v1":"{}","msc-career-v1":"career","sb-auth-token":"secret","other":"no"});const backup=snapshotMscLocalStateV3(storage);assert.equal(backup.entries["msc-settings-v1"],"{}");assert.equal(backup.entries["msc-career-v1"],"career");assert.equal(backup.entries["sb-auth-token"],undefined);assert.equal(backup.entries.other,undefined)});
test("restore only changes different values",()=>{const storage=new MemoryStorage({"msc-settings-v1":"old","msc-career-v1":"same"});const changed=restoreMscLocalStateV3({version:1,savedAt:new Date().toISOString(),entries:{"msc-settings-v1":"new","msc-career-v1":"same"}},storage);assert.equal(changed,1);assert.equal(storage.getItem("msc-settings-v1"),"new")});
test("parser drops non-MSC keys from remote blobs",()=>{const parsed=parseStateBackupV3({version:1,savedAt:"2026-08-25T00:00:00.000Z",entries:{"msc-economy-v2":"ok","sb-token":"bad"}});assert.ok(parsed);assert.deepEqual(parsed.entries,{"msc-economy-v2":"ok"})});
test("restore marker is never backed up",()=>{const storage=new MemoryStorage({"msc-cloud-restore-marker-v3":"token","msc-profile-v1":"profile"});const backup=snapshotMscLocalStateV3(storage);assert.equal(backup.entries["msc-cloud-restore-marker-v3"],undefined);assert.equal(backup.entries["msc-profile-v1"],"profile")});
