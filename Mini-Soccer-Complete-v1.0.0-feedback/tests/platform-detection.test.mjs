import assert from "node:assert/strict";
import test from "node:test";
import { detectPlatform } from "../app/platform.ts";

const base={finePointer:false,hover:false,coarsePointer:false,noHover:false,touchPoints:0};

test("PC con mouse o trackpad usa modo desktop",()=>{
  assert.equal(detectPlatform({...base,finePointer:true,hover:true}),"desktop");
});

test("celular táctil usa modo mobile",()=>{
  assert.equal(detectPlatform({...base,coarsePointer:true,noHover:true,touchPoints:5}),"mobile");
});

test("tablet sin hover usa modo mobile",()=>{
  assert.equal(detectPlatform({...base,noHover:true,touchPoints:10}),"mobile");
});

test("portátil híbrida con pantalla táctil y mouse conserva controles de PC",()=>{
  assert.equal(detectPlatform({...base,finePointer:true,hover:true,coarsePointer:true,touchPoints:10}),"desktop");
});

test("sin señales táctiles se usa desktop como fallback seguro",()=>{
  assert.equal(detectPlatform(base),"desktop");
});
