"""Run from repo root after node source/outlines.mjs. All lengths are mm."""
import sys, pathlib, json, hashlib, subprocess, zipfile, struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'source/vendor'))
import numpy as np
import cv2
from PIL import Image
import manifold3d as m
import trimesh
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from shapely import affinity
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as Patch

for d in ['logo','exports/individual','exports/parts','exports/batch','previews','documentation']:(ROOT/d).mkdir(parents=True,exist_ok=True)
def polys(g):
    if g.is_empty:return []
    return [g] if g.geom_type=='Polygon' else [p for x in g.geoms for p in polys(x)]
def solid(g,h,z=0):
    contours=[]
    for p in polys(g):
        contours.append(np.array(p.exterior.coords[:-1]))
        contours.extend(np.array(i.coords[:-1]) for i in p.interiors)
    return m.CrossSection(contours,m.FillRule.EvenOdd).extrude(h).translate((0,0,z))
def mesh(s):
    a=s.to_mesh();return trimesh.Trimesh(vertices=np.array(a.vert_properties)[:,:3],faces=np.array(a.tri_verts),process=True)
def save_stl(s,path):mesh(s).export(str(path))
def svg(g,path):
    paths=[]
    for p in polys(g):
        rings=[p.exterior,*p.interiors]
        paths.append(' '.join('M '+' L '.join(f'{x:.5f},{-y:.5f}' for x,y in r.coords)+' Z' for r in rings))
    x0,y0,x1,y1=g.bounds
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {-y1} {x1-x0} {y1-y0}"><path fill="#092957" fill-rule="evenodd" d="'+ ' '.join(paths)+'"/></svg>')

# Isolate the primary wordmark by its dark blue / orange face colours, excluding glow.
crop=np.asarray(Image.open(ROOT/'logo/mathxl-wordmark-source-crop.png').convert('RGBA'))
r,g,b=[crop[:,:,i].astype(float) for i in range(3)]
mask=(crop[:,:,3]>127).astype('uint8')*255
mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
contours,hierarchy=cv2.findContours(mask,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
pieces=[]
for i,c in enumerate(contours):
    if hierarchy[0,i,3]!=-1 or cv2.contourArea(c)<50:continue
    outer=cv2.approxPolyDP(c,0.65,True)[:,0,:].astype(float)
    holes=[];j=hierarchy[0,i,2]
    while j!=-1:
        if cv2.contourArea(contours[j])>12:holes.append(cv2.approxPolyDP(contours[j],0.5,True)[:,0,:].astype(float))
        j=hierarchy[0,j,0]
    pieces.append(Polygon(outer,holes).buffer(0))
logo=unary_union(pieces)
x0,y0,x1,y1=logo.bounds
logo=affinity.translate(logo,-(x0+x1)/2,-(y0+y1)/2)
scale=min(31.65/(x1-x0),6/(y1-y0))
logo=affinity.scale(logo,xfact=scale,yfact=-scale,origin=(0,0))
# Mirrored in model coordinates, reads normally when viewed from the back.
logo_back=affinity.translate(affinity.scale(logo,xfact=-1,yfact=1,origin=(0,0)),4.275,0)
svg(logo,ROOT/'logo/mathxl-wordmark.svg')
Image.fromarray(mask).save(ROOT/'logo/isolated-wordmark-mask.png')

# Existing capsule profile, border, hole and boss dimensions.
outer=unary_union([box(-12.5,-12.5,12.5,12.5),Point(-12.5,0).buffer(12.5,quad_segs=80),Point(12.5,0).buffer(12.5,quad_segs=80)])
hole=Point(-17.5,0).buffer(2.25,quad_segs=64)
floor=outer.difference(hole)
rim=outer.difference(outer.buffer(-2.3))
boss=Point(-17.5,0).buffer(3.55,quad_segs=64).difference(hole)
zone=box(-11.55,-4.5,20.1,4.5)
names=json.loads((ROOT/'source/name-outlines.json').read_text())
floor_s=solid(floor,1.6)
logo_s=solid(logo_back,0.4)
body=floor_s-logo_s
fixed=solid(rim,1,1.6)+solid(boss,1,1.6)
results=[]; models=[]; arts=[]

def write3mf(items,path):
    # Each tag is one assembled component object containing two material-assigned meshes.
    resources=['<basematerials id="1"><base name="White PETG" displaycolor="#FFFFFFFF"/><base name="Dark blue PETG" displaycolor="#092957FF"/></basematerials>']
    builds=[];oid=2
    for name,white,blue,dx,dy in items:
        children=[]
        for color,s in enumerate([white,blue]):
            t=mesh(s);vertices=''.join(f'<vertex x="{x:.7f}" y="{y:.7f}" z="{z:.7f}"/>' for x,y,z in t.vertices)
            triangles=''.join(f'<triangle v1="{a}" v2="{b}" v3="{c}" pid="1" p1="{color}"/>' for a,b,c in t.faces)
            resources.append(f'<object id="{oid}" type="model" name="{name} '+('white body' if color==0 else 'blue ring rim name logo')+f'"><mesh><vertices>{vertices}</vertices><triangles>{triangles}</triangles></mesh></object>')
            children.append(f'<component objectid="{oid}"/>');oid+=1
        resources.append(f'<object id="{oid}" type="model" name="{name}"><components>'+''.join(children)+'</components></object>')
        builds.append(f'<item objectid="{oid}" transform="1 0 0 0 1 0 0 0 1 {dx} {dy} 0"/>');oid+=1
    xml='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>'+''.join(resources)+'</resources><build>'+''.join(builds)+'</build></model>'
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model',xml)

for name,gs in names.items():
    text=unary_union([Polygon(p['outer'],p['holes']).buffer(0) for p in gs])
    a,b,c,d=text.bounds;k=min(9/(d-b),31.65/(c-a))
    text=affinity.translate(affinity.scale(affinity.translate(text,-(a+c)/2,-(b+d)/2),xfact=k,yfact=k,origin=(0,0)),4.275,0)
    blue=fixed+solid(text,1,1.6)+logo_s
    full=body+blue
    stem='mathxl_keytag_'+name.lower()
    path=ROOT/'exports/individual'/f'{stem}.stl';save_stl(full,path)
    save_stl(body,ROOT/'exports/parts'/f'{stem}_white.stl');save_stl(blue,ROOT/'exports/parts'/f'{stem}_blue.stl')
    write3mf([(name,body,blue,25,12.5)],ROOT/'exports/individual'/f'{stem}.3mf')
    t=trimesh.load_mesh(str(path));tb=text.bounds
    # Morphological opening checks dominant stroke support at a 0.4 mm nozzle.
    opened=text.buffer(-0.2).buffer(0.2);stroke_loss=1-opened.area/text.area
    checks={'filename':path.name==f'mathxl_keytag_{name.lower()}.stl','watertight':bool(t.is_watertight),'winding':bool(t.is_winding_consistent),'positive_volume':bool(t.volume>0),'single_connected_solid':len(t.split())==1,'text_in_zone':zone.buffer(1e-6).covers(text),'logo_in_floor':floor.covers(logo_back),'logo_present':logo_s.volume()>0,'hole_clear':(full ^ solid(hole,2.6)).volume()<1e-6,'dimensions':bool(np.allclose(t.extents,[50,25,2.6],atol=0.002)),'no_colour_overlap':(body ^ blue).volume()<1e-6,'volume_partition':abs(full.volume()-body.volume()-blue.volume())<1e-4,'stroke_support_0_4mm':stroke_loss<0.05}
    results.append({'name':name,'filename':path.name,'passed':all(checks.values()),'checks':checks,'name_bounds_mm':list(tb),'text_height_mm':tb[3]-tb[1],'uniform_scale':k,'stroke_opening_area_loss':stroke_loss,'volume_mm3':full.volume(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    models.append((name,body,blue));arts.append((name,text))
    print(name,results[-1]['passed'],flush=True)

for plate in range(2):
    chunk=models[plate*12:(plate+1)*12]
    write3mf([(n,w,b,30+(i%3)*62,25+(i//3)*37) for i,(n,w,b) in enumerate(chunk)],ROOT/'exports/batch'/f'mathxl_plate_{plate+1}.3mf')

def draw(ax,g,color,holecolor='white'):
    for p in polys(g):
        ax.add_patch(Patch(np.array(p.exterior.coords),facecolor=color,edgecolor='none'))
        for h in p.interiors:ax.add_patch(Patch(np.array(h.coords),facecolor=holecolor,edgecolor='none'))
def view(ax,text,back=False):
    ax.set_facecolor('#e2e8ef');draw(ax,affinity.scale(floor,xfact=-1,yfact=1,origin=(0,0)) if back else floor,'white','#e2e8ef')
    if back:draw(ax,affinity.scale(logo_back,xfact=-1,yfact=1,origin=(0,0)),'#092957')
    else:
        draw(ax,rim,'#092957');draw(ax,boss,'#092957','#e2e8ef');draw(ax,text,'#092957')
    ax.set_xlim(-27,27);ax.set_ylim(-14,14);ax.set_aspect('equal');ax.axis('off')
fig,axes=plt.subplots(6,3,figsize=(15,15));fig.patch.set_facecolor('#e2e8ef')
for ax,(name,text) in zip(axes.flat,arts):view(ax,text);ax.set_title(name,fontsize=12)
fig.suptitle('MathXL | 18 capsule keytags | FRONT | 50 x 25 mm',fontsize=18);fig.tight_layout(rect=(0,0,1,.97));fig.savefig(ROOT/'previews/all-18-front.png',dpi=170);plt.close(fig)
fig,axes=plt.subplots(6,3,figsize=(15,15));fig.patch.set_facecolor('#e2e8ef')
for ax,(name,text) in zip(axes.flat,arts):view(ax,text,True);ax.set_title(name+' | back',fontsize=12)
fig.suptitle('MathXL | BACK | flush 0.4 mm inlay',fontsize=18);fig.tight_layout(rect=(0,0,1,.97));fig.savefig(ROOT/'previews/all-18-back.png',dpi=150);plt.close(fig)
fig,axes=plt.subplots(2,2,figsize=(12,7));fig.patch.set_facecolor('#e2e8ef')
for ax,name in zip(axes.flat,['Diyon','Stephanie','Sheiney','Keshava']):view(ax,dict(arts)[name]);ax.set_title(name)
fig.tight_layout();fig.savefig(ROOT/'previews/name-closeups.png',dpi=220);plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(12,4));view(axes[0],arts[0][1],True);axes[0].set_title('MathXL back inlay (read from back)');view(axes[1],arts[0][1]);axes[1].set_xlim(-24,-11);axes[1].set_ylim(-7,7);axes[1].set_title('Ring / floor transition');fig.tight_layout();fig.savefig(ROOT/'previews/logo-ring-closeups.png',dpi=220);plt.close(fig)

baseline=json.loads((ROOT/'source/baseline-hashes.json').read_text());repo=ROOT.parent
changed=[p for p,h in baseline.items() if not (repo/p).is_file() or hashlib.sha256((repo/p).read_bytes()).hexdigest()!=h]
report={'count':len(results),'all_passed':all(r['passed'] for r in results),'existing_files_changed':changed,'logo_dimensions_mm':[logo.bounds[2]-logo.bounds[0],logo.bounds[3]-logo.bounds[1]],'logo_crop_pixels':[596,350,1266,490],'models':results}
(ROOT/'documentation/validation.json').write_text(json.dumps(report,indent=2))
(ROOT/'documentation/final-git-status.txt').write_bytes(subprocess.check_output(['git','status','--short'],cwd=repo))
assert len(results)==18 and report['all_passed'] and not changed, report
