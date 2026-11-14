"use client";
import {useEffect,useState,useRef,useId,type CSSProperties} from "react";
const cache=new Map<string,Promise<string>>();
export function Emblem({asset,body,accent}:{asset:string;body:string;accent:string}){
 const instance=useId().replace(/[^a-zA-Z0-9_-]/g,"_");
 const [markup,setMarkup]=useState("");useEffect(()=>{let active=true;if(!cache.has(asset))cache.set(asset,fetch(asset).then(r=>{if(!r.ok)throw Error("Logo unavailable");return r.text()}));cache.get(asset)!.then(s=>{if(active)setMarkup(s)}).catch(()=>{if(active)setMarkup("")});return()=>{active=false}},[asset]);
 const scoped=markup.replace(/id="([^"]+)"/g,(_,id)=>`id="${instance}-${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${instance}-${id})`);
 return <div data-asset={asset} className="automotive-emblem" aria-hidden="true" style={{display:"block",width:"100%",height:"100%",lineHeight:0,fontSize:0,margin:0,padding:0,color:accent,"--body":body} as CSSProperties} dangerouslySetInnerHTML={{__html:scoped}}/>;
}
export function CadImage({src,body,accent}:{src:string;body:string;accent:string}){
 const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{let active=true;const image=new Image();image.onload=()=>{if(!active||!ref.current)return;const c=ref.current;c.width=image.width;c.height=image.height;const ctx=c.getContext("2d")!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);const rgb=(hex:string)=>hex.match(/\w\w/g)!.map(v=>parseInt(v,16));const bc=rgb(body),ac=rgb(accent);for(let i=0;i<pixels.data.length;i+=4){const [r,g,b]=pixels.data.slice(i,i+3);if(r>=238&&g>=238&&b>=238)continue;const isAccent=b>r*1.3&&b>g*1.15;const color=isAccent?ac:bc;const shade=isAccent?Math.min(1,b/76):Math.min(1,(r+g+b)/3/242);for(let k=0;k<3;k++)pixels.data[i+k]=Math.round(color[k]*shade)}ctx.putImageData(pixels,0,0)};image.src=src;return()=>{active=false}},[src,body,accent]);return <canvas ref={ref} role="img" aria-label="CAD-derived two-tone Mercedes preview" style={{display:"block",width:"100%",height:"auto"}}/>;
}
