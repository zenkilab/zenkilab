import fontData from "@/components/keytag/montserrat_bold.typeface.json";
export const filamentColors=[{id:"white",name:"White",hex:"#f2f3f2",status:"Existing preset; stock to confirm"},{id:"navy",name:"Navy",hex:"#102c4c",status:"Existing preset; stock to confirm"},{id:"black",name:"Black",hex:"#17191d",status:"Proposed; stock to confirm"},{id:"silver",name:"Silver",hex:"#b5bac1",status:"Proposed; stock to confirm"},{id:"red",name:"Red",hex:"#b52d36",status:"Proposed; stock to confirm"}];
export function contrast(a:string,b:string){const lum=(h:string)=>{const x=h.match(/\w\w/g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
// Pure typeface measurements: shared by browser and Cloudflare, without Three.js globals.
// Match FontLoader endpoint/control ordering and its 20 subdivisions per curve.
function outlinePoints(text: string) {
  const glyphs = fontData.glyphs as Record<string, {ha: number; o?: string}>;
  const points: {x: number; y: number}[] = [];
  let offset = 0;
  for (const char of text) {
    const glyph = glyphs[char];
    const tokens = (glyph.o || '').trim().split(/\s+/);
    let i = 0, x = 0, y = 0;
    const pair = (): [number, number] => [Number(tokens[i++]), Number(tokens[i++])];
    const push = (px: number, py: number) => points.push({x: (px + offset) * 10 / fontData.resolution, y: py * 10 / fontData.resolution});
    while (i < tokens.length) {
      const action = tokens[i++];
      if (action === 'm' || action === 'l') { [x,y] = pair(); push(x,y); }
      else if (action === 'q' || action === 'b') {
        const [ex,ey] = pair(), [cx,cy] = pair();
        const [dx,dy] = action === 'b' ? pair() : [0,0];
        for (let j=1;j<=20;j++) {
          const t=j/20, u=1-t;
          push(action==='q' ? u*u*x+2*u*t*cx+t*t*ex : u*u*u*x+3*u*u*t*cx+3*u*t*t*dx+t*t*t*ex,
               action==='q' ? u*u*y+2*u*t*cy+t*t*ey : u*u*u*y+3*u*u*t*cy+3*u*t*t*dy+t*t*t*ey);
        }
        x=ex; y=ey;
      }
    }
    offset += glyph.ha;
  }
  return points;
}
export function registrationLayout(value: string) {
  const text = value.toUpperCase().replace(/\s+/g, " ").trim();
  if (!/^[A-Z0-9 -]{2,12}$/.test(text) || !/[A-Z0-9]/.test(text)) return { text, valid: false, width: 0, height: 0, reason: "Use 2–12 letters, numbers, spaces or hyphens." };
  const points = outlinePoints(text);
  if (!points.length) return { text, valid: false, width: 0, height: 0, reason: "Enter a registration number." };
  const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
  const w=Math.max(...xs)-Math.min(...xs), h=Math.max(...ys)-Math.min(...ys);
  const scale=Math.min(25/w,6/h); const width=w*scale, height=h*scale;
  return { text, valid: height>=3.2, width, height, reason: height>=3.2 ? "Proportional layout fits the reserved 25 × 6 mm area. New lettering needs CAD review." : "Too small for clear lettering. Shorten the registration." };
}
