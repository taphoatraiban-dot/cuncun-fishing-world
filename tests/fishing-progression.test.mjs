import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProgress, awardCatch, xpNeeded, MAX_LEVEL} from '../fishing-progression.js';
test('starter profile has no catches and isolated equipment',()=>{
  const a=initialProgress(),b=initialProgress();
  a.equipment.rod='Custom';
  assert.equal(b.equipment.rod,'Cần cơ bản 4,5 m');
  assert.equal(a.level,1);
  assert.equal(a.catches,0);
});
test('catch adds XP and weight without mutating original',()=>{
  const before=initialProgress();
  const {profile,xpGained}=awardCatch(before,2.5);
  assert.equal(xpGained,30);
  assert.equal(profile.catches,1);
  assert.equal(profile.totalKg,2.5);
  assert.equal(profile.biggestKg,2.5);
  assert.equal(before.catches,0);
});
test('progression levels up and tracks biggest fish',()=>{
  let p=initialProgress();
  for(let i=0;i<5;i++) p=awardCatch(p,5).profile;
  assert.equal(p.level,3);
  assert.equal(p.xp,20);
  assert.equal(p.biggestKg,5);
  assert.equal(p.catches,5);
});
test('reject invalid catches and levels',()=>{
  for(const weight of [0,-1,Infinity,NaN,501]) assert.throws(()=>awardCatch(initialProgress(),weight),RangeError);
  assert.equal(xpNeeded(MAX_LEVEL),0);
  assert.throws(()=>xpNeeded(100),RangeError);
});
