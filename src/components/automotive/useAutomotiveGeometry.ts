"use client";
import {useEffect,useRef,useState} from 'react';
import type {AutomotiveConfig,AutomotiveGeometry} from '@/lib/cad/automotive';

type CadModule=typeof import('@/lib/cad/automotive');
export function automotiveGeometryKey(c:AutomotiveConfig){return JSON.stringify({brand:c.brand,registration:c.registration,shape:c.shape,border:c.border,branding:c.branding});}
/** One serial builder per mounted customizer. Colors, notes and camera never enter its key. */
export function useAutomotiveGeometry(config:AutomotiveConfig,enabled:boolean){
 const key=automotiveGeometryKey(config),active=enabled&&config.brand==='mercedes';
 const [model,setModel]=useState<{built:AutomotiveGeometry;key:string}|null>(null);
 const [error,setError]=useState('');
 const moduleRef=useRef<CadModule|null>(null),queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{
  let cancelled=false;
  if(!active){setModel(null);setError('');return;}
  setError('');
  const timer=setTimeout(()=>{
   queue.current=queue.current.catch(()=>{}).then(async()=>{
    if(cancelled)return;
    try{
     const cad=await import('@/lib/cad/automotive');moduleRef.current=cad;
     if(cancelled)return;
     const built=await cad.buildAutomotiveGeometry({...JSON.parse(key),body:'white',accent:'navy'});
     if(!built)return;
     if(cancelled){cad.disposeAutomotiveGeometry(built);return;}
     setModel({built,key});
    }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Could not build this model');}
   });
  },350);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[key,active]);
 useEffect(()=>()=>{if(model)moduleRef.current?.disposeAutomotiveGeometry(model.built);},[model]);
 const ready=active&&model?.key===key&&!error;
 async function prepareCad(){
  if(config.brand!=='mercedes')return null;
  if(!ready||!model||!moduleRef.current)throw Error('The 3D model is updating. Wait for it to finish, then prepare your package.');
  // The exporter snapshots the displayed solids synchronously before awaiting ZIP work.
  const cad=moduleRef.current,result=await cad.exportAutomotiveGeometry(model.built,config);
  try{return {model:result.model,stl:result.stl};}finally{cad.disposeAutomotiveGroup(result.group);}
 }
 return {model:active?model:null,ready:!!ready,error,updating:active&&!ready&&!error,prepareCad};
}
