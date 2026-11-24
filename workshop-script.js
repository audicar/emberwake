// The previous profession lives only in this opening. Keep the role unnamed;
// its setting, props and wording can change without changing village progress.
export const WORKSHOP = {
  title: 'Before Hearthvale',
  setting: 'The workshop · end of the working day',
  journey: { title: 'The road to Hearthvale', setting: 'Some days later · the morning coach', firstStep: 10 },
  supervisor: { skin: 7, hair: 4, colour: 5, hairStyle: 1, outfit: 6, accessory: 0, gender: 1 },
  staff: [
    { skin: 2, hair: 3, colour: 4, hairStyle: 1, outfit: 0, accessory: 0, gender: 1 },
    { skin: 6, hair: 1, colour: 2, hairStyle: 7, outfit: 4, accessory: 0, gender: 0 },
  ],
  // Stable beat numbers preserve saves from the first version of the scene.
  order: [6,0,1,2,3,4,5,7,8,9,10,11,12,13],
  invitation: {
    salutation: 'My love,',
    paragraphs: [
      'You sounded tired in your last letter. Come spend the spring in Hearthvale. I’ll be travelling, and your old room is ready.',
      'You don’t need to know what comes next before you get here.',
      'Your cup’s on the table.',
    ],
    signoff: 'With love,',
    signature: 'Aunt Wren',
  },
  steps: [
    { shot: 'notice', speaker: 'Promotions', text: 'Your name isn’t there. Again.' },
    { shot: 'conversation', speaker: 'Supervisor', text: 'About your promotion—I haven’t had a chance to put your name forward. There’s quite a bit involved. We’ll revisit it next season.' },
    { shot: 'conversation', speaker: 'player', text: 'You said that last season.' },
    { shot: 'conversation', speaker: 'Supervisor', text: 'I know. It’s been a busy year.' },
    { shot: 'request', speaker: 'Supervisor', text: 'Before you go—could you finish that order? You’re the only one I can trust to get it right.' },
    { shot: 'silence', speaker: '', text: '', description: 'You pause beside the unfinished order, then quietly return to work.', minSeconds: 3.2 },
    { shot: 'establish', speaker: 'The workshop', text: 'End of the working day. You finish an order while the others put away their tools.', minSeconds: 4.8 },
    { shot: 'find-letter', speaker: 'The workbench', text: 'Another season of waiting. You set down your tools and take out Aunt Wren’s invitation again.', description: 'You stop working, set your tool down and deliberately take Aunt Wren’s letter from your satchel to reconsider her invitation.', minSeconds: 3.2, nextLabel: 'Read it again' },
    { shot: 'letter', speaker: 'Aunt Wren’s letter', text: '', description: 'You unfold Aunt Wren’s letter and read her invitation again at your workbench.', nextLabel: 'Fold the letter' },
    { shot: 'fold-letter', speaker: '', text: '', description: 'You carefully fold Aunt Wren’s letter and place it at the top of your bag.', minSeconds: 3, nextLabel: 'Take the coach' },
    { scene: 'journey', shot: 'coach-letter', speaker: 'The morning coach', text: 'A few days later, Aunt Wren’s letter rests on your lap. This time, you’re on your way.', description: 'You sit beside the coach window with Aunt Wren’s folded letter in your hands. The town slips past outside.', minSeconds: 4, nextLabel: 'Leave the town behind' },
    { scene: 'journey', shot: 'open-road', speaker: '', text: '', description: 'A little green coach follows the lane through spring fields. Clouds drift over the distant hills, and flowers grow along the roadside.', setting: 'The road to Hearthvale · open fields', minSeconds: 5 },
    { scene: 'journey', shot: 'woodland-window', speaker: 'Aunt Wren’s letter', text: '“You don’t need to know what comes next before you get here.”', description: 'Back at the window, you look out towards a blue-green ridge between passing trees. The letter is still in your hands.', setting: 'The road to Hearthvale · beneath the trees', minSeconds: 4, nextLabel: 'Watch the road ahead' },
    { scene: 'journey', shot: 'cottage-arrival', speaker: 'Hearthvale', text: 'For now, all you need to do is step inside.', description: 'Your coach has reached Hearthvale. You walk up the flower-lined path to Aunt Wren’s red-roofed cottage, your satchel at your side.', setting: 'Hearthvale · Aunt Wren’s cottage', minSeconds: 4, nextLabel: 'Step inside' },
  ],
};

export function promotionNames(playerName) {
  return ['Elin', 'Tomas', 'Cora', 'Bram'].filter(name=>name.toLowerCase()!==playerName.trim().toLowerCase()).slice(0,2);
}

export class WorkshopSequence {
  constructor(step=WORKSHOP.order[0]) {
    if(!Number.isInteger(step)||step<0||step>=WORKSHOP.steps.length)throw new Error('Invalid workshop scene.');
    this.step=step;this.elapsed=0;this.finished=false;
  }
  get beat() { return WORKSHOP.steps[this.step]; }
  get isJourney() { return this.beat.scene==='journey'; }
  get isLast() { return this.step===WORKSHOP.order.at(-1); }
  get ready() { return !this.finished&&this.elapsed>=(this.beat.minSeconds||0); }
  update(dt) { if(Number.isFinite(dt)&&dt>0&&!this.finished)this.elapsed+=dt; }
  advance() {
    if(!this.ready)return false;
    if(this.isLast)this.finished=true;
    else {this.step=WORKSHOP.order[WORKSHOP.order.indexOf(this.step)+1];this.elapsed=0;}
    return true;
  }
  skip() { this.finished=true; }
}
