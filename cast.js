import { drawCharacter } from './character.js?v=0.6.4';

// World sprites and dialogue close-ups share one appearance for each speaker.
export const CAST = {
  rowan: {
    name: 'Rowan', label: 'Rowan · village gardener', x: 236, y: 311,
    appearance: { skin: 2, hair: 0, colour: 5, hairStyle: 10, outfit: 0, accessory: 0, gender: 1 },
  },
  mira: {
    name: 'Mira', label: 'Mira · village tailor', x: 402, y: 236,
    appearance: { skin: 3, hair: 3, colour: 3, hairStyle: 6, outfit: 4, accessory: 4, gender: 0 },
  },
  guardian: { name: 'Briarwood’s guardian', label: 'Briarwood’s guardian' },
  dragon: { name: 'the dreamer', label: 'The dream beneath the hill' },
  unknown: { name: 'an unknown speaker', label: 'An unfamiliar voice', portrait: 'mystery' },
};

export function drawSpeakerPortrait(canvas, id) {
  const person = CAST[id];
  if (!person) return false;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  const r = (x, y, w, h, colour) => { c.fillStyle = colour; c.fillRect(x, y, w, h); };
  r(0, 0, 84, 88, '#344c3d');
  r(4, 4, 76, 80, '#4d6751');
  r(4, 60, 76, 24, '#5e7757');
  r(4, 60, 76, 2, '#769066');
  for (const [x, y] of [[12, 16], [70, 25], [16, 53], [65, 66]]) {
    r(x, y, 2, 2, '#abc19555');
  }
  c.save();c.beginPath();c.rect(4,4,76,80);c.clip();
  if (person.appearance) {
    // Crop at the shoulders; keep the full face, hair and headwear in frame.
    drawCharacter(c, 42, 134, person.appearance, 'down', 0, 3);
  } else if (person.portrait === 'mystery') {
    // A shared placeholder for voices whose identity and location are unknown.
    // Abstract mist avoids suggesting a person, creature or physical source.
    r(4,4,76,80,'#203137');r(8,8,68,72,'#293d42');
    for(const [x,y,w] of [[16,19,31],[29,24,36],[11,34,25],[43,38,27],[18,52,20],[36,58,32],[15,67,38]]) {
      r(x,y,w,3,'#365057');r(x+4,y+3,w-8,2,'#30474d');
    }
    r(28,23,28,40,'#2b4045');r(24,30,36,26,'#2b4045');
    const mark=['011110','110011','000011','000110','001100','001100','000000','001100'];
    mark.forEach((row,y)=>[...row].forEach((pixel,x)=>{
      if(pixel==='1'){r(33+x*3,29+y*4,3,4,'#bdbea5');r(33+x*3,29+y*4,2,3,'#e1ddbf');}
    }));
    for(const [x,y] of [[19,27],[63,51],[26,63],[57,18]])r(x,y,1,2,'#8da5a0');
  } else {
    // Revealed draconic speakers have mossy scales and golden eyes.
    r(16, 16, 6, 24, '#d2c4a1'); r(18, 12, 4, 7, '#eee0b7');
    r(62, 16, 6, 24, '#d2c4a1'); r(62, 12, 4, 7, '#eee0b7');
    r(16, 34, 52, 30, '#293f38'); r(22, 24, 40, 45, '#293f38');
    r(19, 34, 46, 28, '#769473'); r(25, 27, 34, 38, '#769473');
    r(26, 29, 30, 6, '#9cb18a'); r(37, 24, 10, 10, '#a4b68c');
    r(21, 40, 14, 8, '#344a3d'); r(49, 40, 14, 8, '#344a3d');
    r(23, 42, 10, 5, '#ebc87d'); r(51, 42, 10, 5, '#ebc87d');
    r(28, 41, 2, 7, '#3b3b33'); r(54, 41, 2, 7, '#3b3b33');
    r(24, 42, 2, 2, '#fff0b3'); r(51, 42, 2, 2, '#fff0b3');
    r(28, 52, 28, 18, '#90a780'); r(24, 57, 36, 9, '#90a780');
    r(31, 57, 4, 3, '#4c6851'); r(49, 57, 4, 3, '#4c6851');
    r(32, 67, 20, 2, '#4c6851'); r(38, 33, 8, 5, '#b1bd92');
    r(20, 52, 4, 3, '#b1bd92'); r(60, 52, 4, 3, '#b1bd92');
  }
  c.restore();
  canvas.setAttribute('aria-label', `Portrait of ${person.name}`);
  return true;
}
