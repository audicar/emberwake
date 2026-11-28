import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, BackgroundMusic, noteFrequency } from '../music.js';

test('the original themes contain complete phrases and valid playable pitches',()=>{
  assert.equal(noteFrequency(69),440);
  assert.equal(noteFrequency(81),880);
  for(const theme of Object.values(THEMES)) {
    assert.equal(theme.melody.length,64);
    assert.ok(theme.bpm>=60&&theme.bpm<=110);
    for(const pitch of [...theme.melody.filter(n=>n!==null),...theme.chords.flat()])assert.ok(Number.isInteger(pitch)&&pitch>=36&&pitch<=84);
  }
  assert.notDeepEqual(THEMES.village.melody,THEMES.woods.melody);
});
test('music starts on demand, pauses when hidden and avoids overdue note bursts',async()=>{
  const starts=[];
  const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const context={currentTime:0,destination:{},resume:async()=>{},suspend:async()=>{},
    createGain:()=>({gain:parameter(),connect(){},disconnect(){}}),
    createBiquadFilter:()=>({frequency:parameter(),connect(){}}),
    createOscillator:()=>({frequency:parameter(),connect(){},disconnect(){},start(time){starts.push({time,pitch:this.frequency.value});},stop(){}}),
  };
  const music=new BackgroundMusic(()=>context);
  try {
    assert.equal(starts.length,0);
    await music.toggle();assert.equal(music.enabled,true);assert.ok(starts.length>0);
    const before=starts.length;context.currentTime=30;music.schedule();
    assert.ok(starts.length-before<=10,'a delayed tab resumes without scheduling missed music');
    assert.ok(starts.slice(before).every(n=>n.time>=30&&n.pitch>0));
    music.setVolume(5);assert.equal(music.volume,1);
    music.setVisible(false);assert.equal(music.timer,null);
    await music.toggle();assert.equal(music.enabled,false);
  } finally { music.stopTimer(); }
});
test('a refused audio resume stays off and can be retried',async()=>{
  let refused=true;
  const gain={value:0,setTargetAtTime(){}};
  const context={currentTime:0,destination:{},resume:async()=>{if(refused)throw new Error('Gesture required');},
    createGain:()=>({gain,connect(){}}),createBiquadFilter:()=>({frequency:{},connect(){}})};
  const music=new BackgroundMusic(()=>context);music.startTimer=()=>{};
  await assert.rejects(music.toggle(),/Gesture required/);assert.equal(music.enabled,false);assert.equal(music.timer,null);
  refused=false;assert.equal(await music.toggle(),true);assert.equal(await music.toggle(),false);
});
