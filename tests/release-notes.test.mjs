import test from 'node:test';
import assert from 'node:assert/strict';
import {RELEASE_NOTES_VERSION,RELEASE_NOTES,validReleaseNotesSeen,markReleaseNotesSeen} from '../dist/release-notes.js';

test('Version notices remain one per version, reopenable, bounded and safe for malformed storage',()=>{
 const initial=['4.17.0'],copy=[...initial];
 assert.deepEqual(markReleaseNotesSeen(initial),['4.17.0',RELEASE_NOTES_VERSION]);
 assert.deepEqual(markReleaseNotesSeen(markReleaseNotesSeen(initial)),markReleaseNotesSeen(initial));
 assert.deepEqual(initial,copy);
 for(const value of [null,{},['4.18'],['<script>'],Array(21).fill('4.17.0')]){
  assert.equal(validReleaseNotesSeen(value),false);
  assert.deepEqual(markReleaseNotesSeen(value),[RELEASE_NOTES_VERSION]);
 }
 assert.equal(markReleaseNotesSeen(Array.from({length:20},(_,i)=>`4.0.${i}`)).length,20);
 assert.equal(RELEASE_NOTES.changes.length,6);
 const text=RELEASE_NOTES.changes.join(' ');
 for(const content of [/자동 차입/,/첫 화면/,/예산 조절/,/이름/,/북미/,/면담/,/정착지원/,/30분/,/연장/,/모바일/])assert.match(text,content);
});
