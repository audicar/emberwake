// Input vectors are shared by the village and both woodland encounters.
export function movementInput(keys,stick={x:0,y:0}) {
  if(stick.x||stick.y){const n=Math.max(1,Math.hypot(stick.x,stick.y));return {x:stick.x/n,y:stick.y/n};}
  const x=Number(keys.has('right'))-Number(keys.has('left')),y=Number(keys.has('down'))-Number(keys.has('up'));
  const n=Math.max(1,Math.hypot(x,y));return {x:x/n,y:y/n};
}

export class Thumbstick {
  constructor(radius=42,deadzone=6){this.radius=radius;this.deadzone=deadzone;this.reset();}
  reset(){this.pointerId=null;this.originX=0;this.originY=0;this.x=0;this.y=0;this.knobX=0;this.knobY=0;}
  start(id,x,y){if(this.pointerId!==null)return false;this.pointerId=id;this.originX=x;this.originY=y;return true;}
  move(id,x,y){
    if(id!==this.pointerId)return false;
    const dx=x-this.originX,dy=y-this.originY,d=Math.hypot(dx,dy),length=Math.min(d,this.radius);
    this.knobX=d?dx/d*length:0;this.knobY=d?dy/d*length:0;
    const strength=Math.max(0,(length-this.deadzone)/(this.radius-this.deadzone));
    this.x=d?dx/d*strength:0;this.y=d?dy/d*strength:0;return true;
  }
  release(id){if(id!==this.pointerId)return false;this.reset();return true;}
}
