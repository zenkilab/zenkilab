"use client";
import {Component,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import * as THREE from 'three';
import type {AutomotiveGeometry} from '@/lib/cad/automotive';
import {filamentColors} from '@/lib/automotive-config';
import styles from './preview.module.css';
type View='front'|'back'|'side'|'reset';
class DisplayBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p role="alert">The interactive 3D display is unavailable. Your selections are retained. Use the shape references and WhatsApp design review, or reload to retry.</p>:this.props.children;}
}
// Read-only diagnostics let browser regression tests verify real camera/GPU behavior.
function Diagnostics(){
 useFrame(({gl,camera})=>queueMicrotask(()=>{
  if(!gl.domElement.isConnected)return;
  gl.domElement.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(3)).join(',');
  gl.domElement.dataset.gpuGeometries=String(gl.info.memory.geometries);
 }));
 return null;
}
function Controls({view,revision,reduced}:{view:View;revision:number;reduced:boolean}){
 const controls=useRef<OrbitControlsImpl>(null),{camera,size,invalidate}=useThree();
 const fit=Math.max(28,58/(size.width/size.height))/2/Math.tan(THREE.MathUtils.degToRad(16))*1.22;
 useLayoutEffect(()=>{
  const direction=view==='front'?[0,0,1]:view==='back'?[0,0,-1]:view==='side'?[0,-1,0]:[.32,-.38,1];
  camera.position.copy(new THREE.Vector3(...direction).normalize().multiplyScalar(fit));
  camera.up.set(0,view==='side'?0:1,view==='side'?1:0);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  controls.current?.target.set(0,0,0);controls.current?.update();invalidate();
 },[camera,fit,view,revision,invalidate]);
 return <OrbitControls key={`${view}-${revision}`} ref={controls} makeDefault enablePan={false} minDistance={fit*.6} maxDistance={fit*2.8} enableDamping={!reduced} dampingFactor={.12}/>;
}
function Model({built,body,accent}:{built:AutomotiveGeometry;body:string;accent:string}){
 const {invalidate}=useThree();
 useLayoutEffect(()=>{
  for(const [i,mesh] of (built.group.children as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[]).entries()){
   mesh.material.color.set(filamentColors.find(c=>c.id===(i===0?body:accent))!.hex);
   mesh.material.roughness=i===0?.55:.4;mesh.material.metalness=i===0?.05:.15;
   // Shared side vertices must not bend normals across the body's flat faces.
   if(mesh.material.flatShading!==(i===0)){mesh.material.flatShading=i===0;mesh.material.needsUpdate=true;}
  }
  invalidate();
 },[built,body,accent,invalidate]);
 return <group position={[0,0,-1.96]}><primitive object={built.group} dispose={null}/></group>;
}
export default function AutomotiveScene({built,body,accent,back,onBackChange}:{built:AutomotiveGeometry;body:string;accent:string;back:boolean;onBackChange:(back:boolean)=>void}){
 const [view,setView]=useState<View>(back?'back':'reset'),[revision,setRevision]=useState(0),[dpr,setDpr]=useState(1),[reduced,setReduced]=useState(true),[lost,setLost]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);setDpr(matchMedia('(max-width: 768px)').matches?1:Math.min(1.5,devicePixelRatio));return()=>media.removeEventListener('change',update);},[]);
 function choose(next:View){setView(next);setRevision(n=>n+1);onBackChange(next==='back');}
 return <div className={styles.interactive} data-geometry-id={built.group.uuid}>
  <div className={styles.viewControls} role="group" aria-label="3D view controls">{(['front','back','side','reset'] as const).map(v=><button key={v} type="button" aria-pressed={view===v} onClick={()=>choose(v)}>{v==='reset'?'Reset View':v[0].toUpperCase()+v.slice(1)}</button>)}</div>
  <div className={styles.canvasStage} role="region" aria-label="Interactive 3D Mercedes keytag" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;const key=e.key.toLowerCase();if(['f','b','s','r'].includes(key)){e.preventDefault();choose(key==='f'?'front':key==='b'?'back':key==='s'?'side':'reset');}}}>
   <DisplayBoundary><Canvas frameloop="demand" dpr={dpr} camera={{position:[0,0,140],fov:32,near:.1,far:1000}} gl={{antialias:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.domElement.setAttribute('aria-label','3D keytag. Drag to rotate; scroll or pinch to zoom.');gl.domElement.addEventListener('webglcontextlost',()=>{gl.domElement.dataset.contextLost='true';setLost(true)},{once:true});}}>
    <ambientLight intensity={1.1}/><directionalLight position={[30,40,60]} intensity={2.2}/><directionalLight position={[-40,-20,30]} intensity={.7}/><directionalLight position={[60,30,-25]} intensity={2.4}/>
    <Model built={built} body={body} accent={accent}/><Controls view={view} revision={revision} reduced={reduced}/><Diagnostics/>
   </Canvas></DisplayBoundary>
  </div>
  <p className={styles.viewerHelp}>Drag to rotate. Scroll or pinch to zoom. Use the view buttons, or focus the viewer and press F, B, S or R.</p>
  {lost&&<p role="alert">The 3D display was interrupted. Reload this page to restore it. Keep your customization details.</p>}
 </div>;
}
