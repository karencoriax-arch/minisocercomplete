import assert from "node:assert/strict";
import test from "node:test";
import { chooseLocalPassTarget, edgePressed, keyboardP2Input, localPassVelocity, localShotVelocity, localSwitchCandidate } from "../app/local-multiplayer-v3.ts";

test("player two keyboard uses arrows and separate actions",()=>{const input=keyboardP2Input({arrowright:true,enter:true,shift:true,control:true,"0":true});assert.ok(input.move.x>.9);assert.equal(input.pass,true);assert.equal(input.shoot,true);assert.equal(input.tackle,true);assert.equal(input.switchPlayer,true)});
test("pass target prefers teammate in aim direction",()=>{const players=[{x:0,y:0,vx:0,vy:0,team:1,r:18},{x:-180,y:0,vx:0,vy:0,team:1,r:18},{x:120,y:0,vx:0,vy:0,team:1,r:18}];assert.equal(chooseLocalPassTarget(players,0,3,0,{x:-1,y:0}),1)});
test("pass and shot velocities point to target",()=>{const pass=localPassVelocity({x:100,y:100},{x:0,y:100});assert.ok(pass.x<0);assert.ok(Math.abs(pass.y)<.01);const shot=localShotVelocity({x:200,y:200},0,150);assert.ok(shot.x<0);assert.ok(shot.y<0)});
test("switch chooses nearest outfield teammate to ball",()=>{const players=[{x:500,y:400,vx:0,vy:0,team:1,r:18},{x:90,y:100,vx:0,vy:0,team:1,r:18},{x:60,y:60,vx:0,vy:0,team:1,r:18,role:"ARQ"}];assert.equal(localSwitchCandidate(players,0,3,0,{x:100,y:100}),1)});
test("edge detector fires once per press",()=>{assert.equal(edgePressed(true,false),true);assert.equal(edgePressed(true,true),false);assert.equal(edgePressed(false,true),false)});
