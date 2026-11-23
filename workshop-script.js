// The previous profession lives only in this opening. Keep the role unnamed;
// its setting, props and wording can change without changing village progress.
export const WORKSHOP = {
  title: 'Before Hearthvale',
  setting: 'The workshop · late afternoon',
  supervisor: { skin: 7, hair: 4, colour: 5, hairStyle: 1, outfit: 6, accessory: 0, gender: 1 },
  steps: [
    { shot: 'notice', speaker: 'The noticeboard', text: 'Another list of appointments. You read it twice.' },
    { shot: 'conversation', speaker: 'Supervisor', text: 'I haven’t had a chance to put your name forward. There’s quite a bit involved. We’ll revisit it next season.' },
    { shot: 'conversation', speaker: 'player', text: 'You said that last season.' },
    { shot: 'conversation', speaker: 'Supervisor', text: 'I know. It’s been a busy year.' },
    { shot: 'request', speaker: 'Supervisor', text: 'Before you go—could you finish that order? You’re the only one I can trust to get it right.' },
    { shot: 'silence', speaker: '', text: '', description: 'You pause beside the unfinished order, then quietly return to work.', minSeconds: 3.2 },
  ],
};

export function appointmentNames(playerName) {
  return ['Elin', 'Tomas', 'Cora', 'Bram'].filter(name=>name.toLowerCase()!==playerName.trim().toLowerCase()).slice(0,2);
}

export class WorkshopSequence {
  constructor(step=0) {
    if(!Number.isInteger(step)||step<0||step>=WORKSHOP.steps.length)throw new Error('Invalid workshop scene.');
    this.step=step;this.elapsed=0;this.finished=false;
  }
  get beat() { return WORKSHOP.steps[this.step]; }
  get ready() { return !this.finished&&this.elapsed>=(this.beat.minSeconds||0); }
  update(dt) { if(Number.isFinite(dt)&&dt>0&&!this.finished)this.elapsed+=dt; }
  advance() {
    if(!this.ready)return false;
    if(this.step===WORKSHOP.steps.length-1)this.finished=true;
    else {this.step++;this.elapsed=0;}
    return true;
  }
  skip() { this.finished=true; }
}
