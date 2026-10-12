import test from 'node:test';
import assert from 'node:assert/strict';
import {admitCandidate} from '../dist/admission.js';
import {weeklyAppearance} from '../dist/appearance.js';

test('versioned naming changes only displayed identity across editions, fields, and collision cases',()=>{
 for(const locale of ['ko','en'])for(const [fieldId,labMode,institution]of [['050','dry','national'],['056','wet','private'],['048','dry','institute']])for(const intakeSeed of [0,6,1183,2087,0xffffffff])for(const index of [0,1,2]){
  const options={locale,fieldId,labMode,institution};
  const old=admitCandidate(intakeSeed,index,{...options,namingVersion:1}),current=admitCandidate(intakeSeed,index,{...options,namingVersion:2});
  const normalized=structuredClone(current);normalized.name=old.name;delete normalized.admission.namingVersion;
  assert.deepEqual(normalized,old,`${locale}/${fieldId}/${intakeSeed}/${index}: names must not redraw any engine field`);
  assert.deepEqual(weeklyAppearance(current),weeklyAppearance(old),'cosmetic name collisions must not change the student sprite');
 }
});
