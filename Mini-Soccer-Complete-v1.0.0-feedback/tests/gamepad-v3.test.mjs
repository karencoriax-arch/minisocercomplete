import assert from "node:assert/strict";
import test from "node:test";
import { GamepadManagerV3, gamepadLabel, mapStandardGamepad } from "../app/gamepad-v3.ts";

const button=(pressed=false,value=pressed?1:0)=>({pressed,touched:pressed,value});
const pad=(axes=[0,0,0,0],buttons=Array.from({length:12},()=>button(false)),index=0)=>({index,id:"Xbox Wireless Controller",axes,buttons,connected:true});
test("deadzone removes controller drift",()=>{const frame=mapStandardGamepad(pad([.04,-.05,0,0]));assert.deepEqual(frame.move,{x:0,y:0})});
test("left stick controls movement and right stick aim",()=>{const frame=mapStandardGamepad(pad([1,0,0,-1]));assert.ok(frame.move.x>.9);assert.ok(frame.aim.y<-.9)});
test("standard face buttons map to football actions",()=>{const buttons=Array.from({length:12},()=>button(false));buttons[0]=button(true);buttons[1]=button(true);const frame=mapStandardGamepad(pad([0,0,0,0],buttons));assert.equal(frame.actions.PASS,true);assert.equal(frame.actions.SHOOT,true);assert.ok(frame.pressed.includes("PASS"))});
test("held buttons are not reported as pressed every frame",()=>{const buttons=Array.from({length:12},()=>button(false));buttons[0]=button(true);const first=mapStandardGamepad(pad([0,0,0,0],buttons));const second=mapStandardGamepad(pad([0,0,0,0],buttons),first);assert.ok(first.pressed.includes("PASS"));assert.ok(!second.pressed.includes("PASS"))});
test("manager supports two local gamepads",()=>{const manager=new GamepadManagerV3();const frames=manager.poll([pad([0,0,0,0],undefined,0),pad([0,0,0,0],undefined,1)]);assert.equal(frames.length,2);assert.deepEqual(frames.map(f=>f.index),[0,1])});
test("friendly controller labels",()=>{assert.equal(gamepadLabel("Xbox Wireless Controller"),"Xbox Controller");assert.equal(gamepadLabel("DualSense Wireless Controller"),"PlayStation Controller")});
