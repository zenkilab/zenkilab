const fs=require('fs'),assert=require('assert/strict');process.env.SHARED_FIXTURE_ONLY='1';require('./check-shared-submissions.cjs');
const {generateAutomotive}=require('../../src/lib/cad/automotive.ts'),{validateModel}=require('../../functions/_lib/submissions/validate.ts');
const {STLExporter}=require('three/examples/jsm/exporters/STLExporter.js');const {MeshBVH}=require('three-mesh-bvh');const THREE=require('three');
const root='automotive-logo-catalog/reports/production-sprint/cad';fs.mkdirSync(root,{recursive:true});
function selfScreen(geometry){const bvh=new MeshBVH(geometry.clone(),{maxLeafTris:4});let checked=0;const hit=bvh.bvhcast(bvh,new THREE.Matrix4(),{intersectsTriangles(a,b,ai,bi){if(ai>=bi)return false;const av=[a.a,a.b,a.c],bv=[b.a,b.b,b.c];if(av.some(x=>bv.some(y=>x.distanceToSquared(y)<1e-10)))return false;checked++;const line=new THREE.Line3();if(!a.intersectsTriangle(b,line,true)||line.distanceSq()<1e-12)return false;const mid=line.getCenter(new THREE.Vector3()),u=a.getBarycoord(mid,new THREE.Vector3()),v=b.getBarycoord(mid,new THREE.Vector3());return u&&v&&Math.min(u.x,u.y,u.z,v.x,v.y,v.z)>1e-6}});bvh.geometry.dispose();return {properNonCoplanarTriangleIntersection:hit,pairsChecked:checked,limitation:'Proper noncoplanar crossings only; shared vertices, boundary contacts and coplanar pairs excluded. Combined with solid construction and independent topology/volume checks'};}
(async()=>{const rows=[];for(const [ri,registration] of ['I1','ABC 1234','III 11111111'].entries())for(const shape of ['capsule','rounded-rectangle'])for(const border of ['none','thin','bold','double']){
 const config={brand:'mercedes',registration,shape,border,body:ri===0?'navy':'white',accent:ri===0?'white':ri===1?'navy':'black',branding:true};
 const generated=await generateAutomotive(config),model=Buffer.from(await generated.model.arrayBuffer()),validation=await validateModel(model,config);
 assert(validation.watertightEdgeScreen);assert.equal(validation.windingErrors,0);assert.equal(validation.degenerateTriangles,0);
 const selected=ri===1 || ri===0&&border==='bold' || ri===2&&border==='double';let prefix=null,screen=null;
 if(selected){prefix=shape+'-'+border+'-'+registration.replace(/ /g,'');fs.writeFileSync(root+'/'+prefix+'.3mf',model);fs.writeFileSync(root+'/'+prefix+'.stl',Buffer.from(await generated.stl.arrayBuffer()));fs.writeFileSync(root+'/'+prefix+'.json',JSON.stringify(config,null,2));for(const [i,label] of ['body','accent'].entries()){const data=new STLExporter().parse(generated.group.children[i],{binary:true});fs.writeFileSync(root+'/'+prefix+'-'+label+'.stl',Buffer.from(data.buffer));}
 screen=selfScreen(generated.group.children[0].geometry);assert.equal(screen.properNonCoplanarTriangleIntersection,false);}
 rows.push({config,validation,solidChecks:generated.solidChecks,prefix,selfIntersectionScreen:screen});console.log('PASS CAD',registration,shape,border);
 for(const mesh of generated.group.children){mesh.geometry.dispose();mesh.material.dispose()}
 }
 for(const shape of ['capsule','rounded-rectangle']){const config={brand:'mercedes',registration:'ABC 12',shape,border:'none',body:'white',accent:'navy',branding:false};const generated=await generateAutomotive(config);const validation=await validateModel(new Uint8Array(await generated.model.arrayBuffer()),config);assert(validation.watertightEdgeScreen);rows.push({config,validation,solidChecks:generated.solidChecks});}
 assert.equal(await generateAutomotive({brand:'toyota'}),null);
 fs.writeFileSync('automotive-logo-catalog/reports/production-sprint/cad-matrix.json',JSON.stringify({passed:true,cases:rows.length,sourceEmblemUnchanged:true,rows},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
