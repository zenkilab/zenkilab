const fs=require('fs'),ts=require('typescript'),Module=require('module'),path=require('path'),assert=require('assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;Module._resolveFilename=function(n,p,...a){return resolve.call(this,n.startsWith('@/')?path.resolve('src',n.slice(2)):n,p,...a)};
const {registrationLayout}=require('../../src/lib/automotive-config.ts');
assert(!Object.keys(require.cache).some(p=>p.includes('node_modules'+path.sep+'three'+path.sep)),'Shared configuration imported browser Three.js');
const {FontLoader}=require('three/examples/jsm/loaders/FontLoader.js');const font=new FontLoader().parse(require('../../src/components/keytag/montserrat_bold.typeface.json'));
const samples=['CAV 3883','ABC 1234','I1','WW 8888','ABCDEFGHIJKL','0123456789','A-1',...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',c=>c+' '+c)];
for(const text of samples){const pts=font.generateShapes(text,10).flatMap(s=>s.extractPoints(20).shape);const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),k=Math.min(25/w,6/h),actual=registrationLayout(text);assert(Math.abs(actual.width-w*k)<1e-8,text+' width');assert(Math.abs(actual.height-h*k)<1e-8,text+' height');assert.equal(actual.valid,h*k>=3.2,text+' validity');}
console.log('PASS shared font measurements match Three.js for',samples.length,'registrations; no Three.js import on shared path');
