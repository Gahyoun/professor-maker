import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance,skinTone,renderPortrait,weeklyAppearance} from '../dist/appearance.js';
import {createState} from '../dist/engine.js';

test('student skin spans a gradual light-to-medium spectrum and stays fixed through activities',()=>{
 const colors=new Set();for(let seed=1;seed<=1000;seed++){const a=studentAppearance(seed*7919,'female');assert.match(a.skin,/^#[a-f0-9]{6}$/);assert.deepEqual(a,studentAppearance(seed*7919,'female'));colors.add(a.skin);}
 assert.ok(colors.size>100,'spectrum must not collapse into a handful of presets');
 const s=createState('학생',19),before=structuredClone(s),identity=studentAppearance(s.creationSeed,s.gender);
 for(let month=0;month<=95;month+=5){const current={...s,month};for(let week=0;week<5;week++)assert.equal(weeklyAppearance(current,week).skin,identity.skin);}
 assert.deepEqual(s,before);
 const light=renderPortrait({...identity,skin:skinTone(0)}),medium=renderPortrait({...identity,skin:skinTone(1)});assert.notEqual(light,medium);
});
