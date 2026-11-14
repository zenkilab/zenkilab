"use client";
import {useId} from "react";
import {letteringPath} from "@/lib/automotive-lettering";
import type {Shape,Border} from "@/lib/automotive";
import {Emblem} from "./TagAppearance";
export default function Concept({shape,border,registration,asset,body,accent,back}:{shape:Shape;border:Border;registration:string;asset?:string;body:string;accent:string;back:boolean}){
 const mask=useId();
 const radius=shape==="capsule"?14:5;
 return <svg viewBox="-32 -17 64 34" role="img" aria-label={`Conceptual ${back?"back":"front"} appearance; sculpted CAD pending`} style={{display:"block",width:"100%",background:"#e8ecf0"}}><defs><mask id={mask}><rect x="-29" y="-14" width="58" height="28" rx={radius} fill="white"/><circle cx={back?23.5:-23.5} cy="0" r="2.25" fill="black"/></mask></defs><g mask={`url(#${mask})`}><rect x="-29" y="-14" width="58" height="28" fill={body}/>{!back&&border!=="none"&&<><rect x={-29+.8+(border==="bold"?.96:.48)/2} y={-14+.8+(border==="bold"?.96:.48)/2} width={58-2*(.8+(border==="bold"?.96:.48)/2)} height={28-2*(.8+(border==="bold"?.96:.48)/2)} rx={radius-.8-(border==="bold"?.96:.48)/2} fill="none" stroke={accent} strokeWidth={border==="bold"?.96:.48}/>{border==="double"&&<rect x="-26.96" y="-11.96" width="53.92" height="23.92" rx={radius-2.04} fill="none" stroke={accent} strokeWidth=".48"/>}</>}{back?<path d={letteringPath("ZenkiLab.com",27,3.5)} fill={accent} fillRule="nonzero"/>:<><foreignObject x="-20" y="-7.5" width="15" height="15">{asset&&<Emblem key={asset} asset={asset} body={body} accent={accent}/>}</foreignObject><path d={letteringPath(registration,25,6,10.5)} fill={accent} fillRule="nonzero"/></>}</g></svg>;
}

