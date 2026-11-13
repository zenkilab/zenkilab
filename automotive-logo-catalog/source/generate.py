"""Internal SVG relief samples; existing helpers, font, shapes and border dimensions."""
import sys,pathlib,json,ast,zipfile
R=pathlib.Path(__file__).resolve().parents[1];repo=R.parent
sys.path.insert(0,str(repo/'mathxl-keytag-batch/source/vendor'))
import numpy as np,trimesh,manifold3d as m
from shapely.geometry import Polygon,Point,box
from shapely.ops import unary_union
from shapely import affinity
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as Patch
base=repo/'mathxl-keytag-batch/source/generate.py';nodes=ast.parse(base.read_text()).body
exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name in ['polys','solid','mesh','save_stl','draw']],type_ignores=[]),str(base),'exec'))
current=repo/'mercedes-cav3883-prototypes/source/generate.py';nodes=ast.parse(current.read_text()).body
exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name=='write_color_3mf'],type_ignores=[]),str(current),'exec'))
def fit(g,w,h,cx=0):
 a,b,c,d=g.bounds;k=min(w/(c-a),h/(d-b));return affinity.translate(affinity.scale(affinity.translate(g,-(a+c)/2,-(b+d)/2),xfact=k,yfact=k,origin=(0,0)),cx,0)
def outline(entries):return unary_union([Polygon(x['outer'],x['holes']).buffer(0) for x in entries])
text=json.loads((repo/'mercedes-cav3883-prototypes/source/text-outlines.json').read_text());reg=fit(outline(text['CAV 3883']),25,6,10.5);back=affinity.scale(fit(outline(text['ZenkiLab.com']),27,3.5),xfact=-1,yfact=1,origin=(0,0));hole=Point(-23.5,0).buffer(2.25,quad_segs=96)
records=json.loads((R/'manifest.json').read_text());results=[]
for rec in records:
 brand=rec['id'];p=R/'sanitized'/f'{brand}.json'
 if not p.exists():continue
 if brand in ['kia','nissan']:
  rec['technical_rejection']='Wordmark or integral lettering requires emblem-only selection/scale review';continue
 g=fit(outline(json.loads(p.read_text())),15,15,-12.5)
 loss=1-g.buffer(-.2).buffer(.2).area/g.area
 if loss>.08:rec['technical_rejection']=f'0.4 mm feature opening loses {loss:.1%} area';continue
 rec['technical_supported']=True;rec['prototype_status']='internal-only, not rights-cleared';rec['stroke_opening_area_loss']=loss
 for shape in ['capsule','rounded-rectangle']:
  outer=unary_union([box(-15,-14,15,14),Point(-15,0).buffer(14,quad_segs=96),Point(15,0).buffer(14,quad_segs=96)]) if shape=='capsule' else box(-24,-9,24,9).buffer(5,quad_segs=96)
  body=solid(outer-hole,3.2)-solid(back,.48)
  for border in ['none','thin','bold','double']:
   band=Polygon()
   if border!='none':
    edge=outer.buffer(-.8);band=edge-edge.buffer(-(.96 if border=='bold' else .48))
    if border=='double':edge=outer.buffer(-1.8);band=band.union(edge-edge.buffer(-.48))
   parts=[('White body',body,0),('Navy emblem',solid(g,.48,3.2),1),('Navy registration',solid(reg,.48,3.2),1)]
   if not band.is_empty:parts.append(('Navy border',solid(band,.48,3.2),1))
   full=m.Manifold()
   dest=R/'samples'/brand/shape/border;dest.mkdir(parents=True,exist_ok=True)
   for name,s,c in parts:full=full+s;save_stl(s,dest/(name.replace(' ','_')+'.stl'))
   save_stl(full,dest/'complete.stl');write_color_3mf(parts,dest/'geometry-only.3mf')
   checks={'art_inside':(outer-hole).covers(g.union(reg).union(band)),'art_border_clearance':band.is_empty or band.distance(g.union(reg))>=.6,'text_clearance':reg.distance(outer.boundary)>=3,'watertight_parts':all(mesh(s).is_watertight for _,s,_ in parts),'watertight_complete':mesh(full).is_watertight,'winding':mesh(full).is_winding_consistent,'positive_volume':full.volume()>0,'color_overlap':all((a^b).volume()<1e-6 for i,(_,a,_) in enumerate(parts) for _,b,_ in parts[i+1:])}
   results.append({'brand':brand,'shape':shape,'border':border,'checks':checks,'passed':all(checks.values()),'mass_g':full.volume()*.00127,'stroke_loss':loss})
   if border=='none':
    for face in ['front','back']:
     fig,ax=plt.subplots(figsize=(8,4));draw(ax,affinity.scale(outer-hole,xfact=-1,yfact=1,origin=(0,0)) if face=='back' else outer-hole,'#f2f3f2','#e8ecf0')
     if face=='front':draw(ax,g,'#102c4c','#f2f3f2');draw(ax,reg,'#102c4c','#f2f3f2')
     else:draw(ax,affinity.scale(back,xfact=-1,yfact=1,origin=(0,0)),'#102c4c','#f2f3f2')
     ax.set_xlim(-32,32);ax.set_ylim(-17,17);ax.set_aspect('equal');ax.axis('off');fig.patch.set_facecolor('#e8ecf0');ax.set_title(brand+' | '+shape+' | '+face+' | INTERNAL');fig.savefig(dest/(face+'.png'),dpi=140);plt.close(fig)
(R/'manifest.json').write_text(json.dumps(records,indent=2));(R/'reports/geometry.json').write_text(json.dumps({'models':results,'all_passed':all(x['passed'] for x in results),'slicer_verified':False},indent=2));print('samples',len(results),'pass',all(x['passed'] for x in results))
assert all(x['passed'] for x in results)
