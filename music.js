// Original eight-bar themes, synthesised locally. Each number is a MIDI pitch;
// null leaves room between phrases. No audio files or network requests are used.
export const THEMES = {
  workshop: {
    bpm: 64,
    chords: [[40,43,47],[48,52,55],[45,48,52],[47,50,54]],
    melody: [71,null,null,67,null,64,null,null, 67,null,64,null,null,62,null,null, 69,null,null,67,null,64,null,null, 66,null,62,null,null,null,null,null, 71,null,74,null,null,71,67,null, 72,null,null,67,null,64,null,null, 69,null,67,null,null,64,null,null, 66,null,62,null,null,null,64,null],
  },
  journey: {
    bpm: 70,
    chords: [[48,52,55],[43,47,50],[45,48,52],[41,45,48]],
    melody: [67,null,64,null,67,69,null,72, 71,null,67,null,62,null,null,null, 64,null,67,69,null,72,76,null, 72,null,69,null,67,null,null,null, 72,76,null,79,null,76,72,null, 71,null,74,72,71,67,null,null, 69,null,72,null,76,72,69,null, 67,null,65,64,null,null,67,null],
  },
  village: {
    bpm: 78,
    chords: [[43,47,50],[40,43,47],[48,52,55],[50,54,57]],
    melody: [67,71,74,null,76,74,71,69, 67,64,67,71,null,69,67,64, 64,67,72,null,71,69,67,64, 66,69,74,76,74,69,66,null, 71,74,79,null,78,76,74,71, 76,74,71,67,69,null,67,64, 72,71,69,67,64,67,69,null, 66,69,74,71,69,66,67,null],
  },
  woods: {
    bpm: 86,
    chords: [[40,43,47],[48,52,55],[43,47,50],[50,54,57]],
    melody: [64,null,67,71,74,71,67,null, 72,71,67,64,null,67,69,null, 71,null,74,79,78,74,71,67, 69,66,62,null,66,69,71,null, 76,74,71,67,64,null,66,67, 72,null,71,69,67,64,67,null, 71,74,76,null,74,71,69,67, 66,69,74,71,69,66,64,null],
  },
  guardian: {
    bpm: 98,
    chords: [[40,43,47],[45,48,52],[48,52,55],[47,51,54]],
    melody: [64,67,71,76,null,74,71,67, 69,72,76,79,76,72,69,null, 72,76,79,76,74,72,71,67, 66,71,75,78,75,71,66,null, 76,74,71,67,64,67,71,74, 76,79,76,72,69,72,76,null, 79,76,72,71,67,71,72,76, 75,71,66,63,66,71,64,null],
  },
};
export const noteFrequency = midi => 440 * 2 ** ((midi - 69) / 12);

export class BackgroundMusic {
  constructor(contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()) {
    this.contextFactory=contextFactory;this.context=null;this.master=null;
    this.enabled=false;this.visible=true;this.volume=.4;
    this.theme='village';this.pendingTheme='village';this.step=0;this.nextTime=0;this.timer=null;
  }
  setTheme(theme) { if(THEMES[theme])this.pendingTheme=theme; }
  setVolume(value) {
    if(!Number.isFinite(value))return;
    this.volume=Math.max(0,Math.min(1,value));
    if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume*.65:0,this.context.currentTime,.12);
  }
  ensureContext() {
    if(this.context)return;
    this.context=this.contextFactory();this.master=this.context.createGain();this.master.gain.value=0;
    const soften=this.context.createBiquadFilter();soften.type='lowpass';soften.frequency.value=2400;
    this.master.connect(soften);soften.connect(this.context.destination);
  }
  async toggle() {
    this.ensureContext();
    if(!this.enabled){await this.context.resume();this.enabled=true;this.theme=this.pendingTheme;this.step=0;this.nextTime=this.context.currentTime+.04;this.startTimer();}
    else {this.enabled=false;this.stopTimer();}
    this.master.gain.setTargetAtTime(this.enabled?this.volume*.65:0,this.context.currentTime,.15);
    return this.enabled;
  }
  startTimer() { this.stopTimer();this.schedule();this.timer=setInterval(()=>this.schedule(),100); }
  stopTimer() { if(this.timer!==null)clearInterval(this.timer);this.timer=null; }
  setVisible(visible) {
    this.visible=visible;
    if(!this.context)return;
    if(!visible){this.stopTimer();this.context.suspend().catch(()=>{});}
    else if(this.enabled)this.context.resume().then(()=>{this.nextTime=this.context.currentTime+.04;this.startTimer();}).catch(()=>{});
  }
  voice(midi,time,duration,volume,type='sine') {
    const oscillator=this.context.createOscillator(),envelope=this.context.createGain();
    oscillator.type=type;oscillator.frequency.value=noteFrequency(midi);
    envelope.gain.setValueAtTime(.0001,time);envelope.gain.linearRampToValueAtTime(volume,time+.018);
    envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(envelope);envelope.connect(this.master);
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
    oscillator.start(time);oscillator.stop(time+duration+.02);
  }
  schedule() {
    if(!this.enabled||!this.visible||!this.context)return;
    const now=this.context.currentTime;
    // Resume from the current time after a delayed browser tick, without a burst
    // of overdue notes or a backlog of nodes.
    if(this.nextTime<now)this.nextTime=now+.025;
    while(this.nextTime<now+.2) {
      if(this.step%8===0&&this.pendingTheme!==this.theme){this.theme=this.pendingTheme;this.step=0;}
      const theme=THEMES[this.theme],beat=60/theme.bpm,stepDuration=beat/2;
      const index=this.step%theme.melody.length,chord=theme.chords[Math.floor(index/8)%theme.chords.length];
      const melody=theme.melody[index];
      if(melody!==null){this.voice(melody,this.nextTime,stepDuration*1.7,.12,'sine');this.voice(melody+12,this.nextTime,stepDuration*.8,.013,'triangle');}
      this.voice(chord[[0,2,1,2][index%4]]+12,this.nextTime,stepDuration*1.3,.026,'triangle');
      if(index%(this.theme==='guardian'?2:4)===0)this.voice(chord[0],this.nextTime,beat*1.5,.06,'sine');
      if(index%8===0)for(const pitch of chord)this.voice(pitch+12,this.nextTime,beat*3.8,.014,'sine');
      this.nextTime+=stepDuration;this.step++;
    }
  }
}
