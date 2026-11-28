export const COTTAGE_MEMORIES = {
  payPacket: { flag:'payPacketRead', title:'Your last pay packet', lines:['The same amount as last season. You count it again.'], action:'Put it away' },
  workNotebook: { flag:'workNotebookRead', title:'Your old work notebook', lines:['You turn to the first page. You remember how excited you were.'], action:'Leave it open' },
  alarmClock: { flag:'clockUnwound', title:'The alarm clock', lines:['You reach to wind it for tomorrow. Then remember.'], action:'Leave it unwound' },
};
export function rememberCottageObject(state,key) {
  const memory=COTTAGE_MEMORIES[key];
  if(!memory)throw new Error('Unknown cottage object.');
  state[memory.flag]=true;
}

export const ROWAN_SPOTS = {
  cottage:{x:218,y:253,direction:'left'},
  river:{x:520,y:358,direction:'right'},
  garden:{x:236,y:311,direction:'down'},
};
export function rowanPlace(state) { const stage=state.chapter?.stage||0;return stage===2||stage===10?'cottage':stage>=3&&stage<10?'river':!state.metRowan?'cottage':!state.receivedSeeds?'river':'garden'; }
export function rowanPosition(state) { return ROWAN_SPOTS[rowanPlace(state)]; }
export function createRowanActor(state) { return {...rowanPosition(state),place:rowanPlace(state),route:[],walk:0,arrived:true}; }
export function updateRowan(actor,state,dt,isBlocked) {
  const place=rowanPlace(state);
  if(actor.place!==place) {
    actor.place=place;actor.arrived=false;
    actor.route=(place==='river'?[{x:272,y:278},{x:286,y:310},{x:490,y:310},{x:490,y:358},ROWAN_SPOTS.river]:
      place==='garden'?[{x:490,y:358},{x:490,y:310},{x:286,y:310},ROWAN_SPOTS.garden]:actor.x>400?[{x:490,y:358},{x:490,y:310},{x:286,y:310},{x:272,y:278},ROWAN_SPOTS.cottage]:[ROWAN_SPOTS.cottage]).map(p=>({...p}));
  }
  const target=actor.route[0];
  if(!target){actor.walk=0;actor.arrived=true;actor.direction=ROWAN_SPOTS[place].direction;return;}
  const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy),step=Math.min(d,48*Math.max(0,Math.min(dt,.05)));
  if(d<1){actor.x=target.x;actor.y=target.y;actor.route.shift();return;}
  actor.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  const mx=dx/d*step,my=dy/d*step;
  if(!isBlocked(actor.x+mx,actor.y))actor.x+=mx;
  if(!isBlocked(actor.x,actor.y+my))actor.y+=my;
  actor.walk+=dt*9;
}
export function finishRowanIntroduction(state) { state.metRowan=true; }
export function finishRiverVisit(state) { state.rowanRiver=true; }
export function receiveGardenSeeds(state) {
  if(state.receivedSeeds||!state.rowanRiver)return false;
  state.receivedSeeds=true;state.seeds+=3;return true;
}
