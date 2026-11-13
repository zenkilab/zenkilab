"""Independent serialized-mesh validation with the existing approved CAD dependencies."""
import sys,json,zipfile,hashlib,ast
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path('mathxl-keytag-batch/source/vendor').resolve()))
import numpy as np,trimesh,manifold3d as m
from shapely.geometry import Polygon,box,Point
from PIL import Image
root=Path('automotive-logo-catalog/reports/production-sprint');rows=[]
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
import xml.etree.ElementTree as ET

def solid(tm):return m.Manifold(m.Mesh(np.asarray(tm.vertices,dtype=np.float32),np.asarray(tm.faces,dtype=np.uint32)))
def polygon(cs):
 result=Polygon()
 for ring in cs.to_polygons():result=result.symmetric_difference(Polygon(ring))
 return result.buffer(0)
def mesh(shape):return shape
# Reuse the existing project's actual triangle rasterizer, without executing its order recipe.
p=Path('mercedes-cav3883-prototypes/source/generate.py');nodes=ast.parse(p.read_text()).body
exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name=='render_mesh'],type_ignores=[]),str(p),'exec'))
for archive in sorted((root/'cad').glob('*.3mf')):
 with zipfile.ZipFile(archive) as z:
  xml=ET.fromstring(z.read('3D/3dmodel.model'));config=json.loads(z.read('Metadata/zenki-config.json'));parts=[]
  for obj in xml.findall('.//m:object',ns):
   node=obj.find('m:mesh',ns)
   if node is None:continue
   v=np.array([[float(p.get(k)) for k in ['x','y','z']] for p in node.findall('m:vertices/m:vertex',ns)]);f=np.array([[int(p.get(k)) for k in ['v1','v2','v3']] for p in node.findall('m:triangles/m:triangle',ns)])
   parts.append(trimesh.Trimesh(v,f,process=True))
 assert len(parts)==2
 whole=trimesh.load_mesh(archive.with_suffix('.stl'))
 checks={'materialWatertight':all(t.is_watertight for t in parts),'materialWinding':all(t.is_winding_consistent for t in parts),'materialPositiveVolume':all(t.volume>0 for t in parts),'stlWatertight':bool(whole.is_watertight),'stlWinding':bool(whole.is_winding_consistent),'stlPositiveVolume':bool(whole.volume>0),'singleStlSolid':len(whole.split())==1,'noDegenerateFaces':all(np.all(t.nondegenerate_faces(height=1e-7)) for t in [whole,*parts]),'dimensions':bool(np.allclose(whole.extents,[58,28,3.92],atol=.002))}
 a,b=map(solid,parts);full=solid(whole)
 intersection=(a^b).volume();difference=(a+b-full).volume()+(full-(a+b)).volume()
 checks.update(materialOverlapBelowTolerance=intersection<.001,stl3mfDifferenceBelowTolerance=difference<.01)
 front=polygon(b.slice(3.44));registration=front.intersection(box(-2.05,-3.05,23.05,3.05));branding=polygon(b.slice(.24))
 opened=registration.buffer(-.2).buffer(.2);loss=1-opened.area/registration.area
 brandloss=1-branding.buffer(-.2).buffer(.2).area/branding.area
 checks['dominantRegistrationStrokes04']=loss<.05
 checks['dominantBrandingStrokes04']=brandloss<.05
 checks['holeLigament']=3.25>=3
 checks['floorAboveBranding']=3.2-.48>=2.4
 checks['backMirror']=config['branding'] and branding.area>0
 row={'file':str(archive),'config':config,'checks':checks,'passed':all(checks.values()),'dimensionsMm':whole.extents.tolist(),'overlapVolumeMm3':intersection,'stl3mfSymmetricDifferenceMm3':difference,'registrationOpeningLossAt04':loss,'brandingOpeningLossAt04':brandloss,'holeLigamentMm':3.25,'volumeMm3':whole.volume,'solidMassG':whole.volume*1.27/1000,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}
 rows.append(row);print(archive.stem,row['passed'],{k:v for k,v in checks.items() if not v},flush=True)
 if config['registration']=='ABC 1234' and config['border']=='bold':
  target=root/'renders';target.mkdir(exist_ok=True)
  render_mesh(parts[0],parts[1],target/(config['shape']+'-front.png'),np.array([1.,0,0]),np.array([0.,1,0]))
  render_mesh(parts[0],parts[1],target/(config['shape']+'-back.png'),np.array([-1.,0,0]),np.array([0.,1,0]))
  render_mesh(parts[0],parts[1],target/(config['shape']+'-side.png'),np.array([1.,0,0]),np.array([0.,.45,.893]))
(root/'independent-cad.json').write_text(json.dumps({'passed':all(r['passed'] for r in rows),'tooling':'Existing vendored trimesh, Manifold3D and Shapely; serialized files reloaded independently','rows':rows},indent=2))
assert all(r['passed'] for r in rows),'Independent manufacturing checks failed'
