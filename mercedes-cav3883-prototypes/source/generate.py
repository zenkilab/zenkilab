"""Isolated customer recipe using the existing MathXL solid/export helpers; mm.
Run from repository root: python mercedes-cav3883-prototypes/source/generate.py
Regenerates only this order. No network, slicer, or printer calls.
"""
import ast,sys,pathlib,json,hashlib,subprocess,zipfile,xml.etree.ElementTree as ET
sys.dont_write_bytecode=True
R=pathlib.Path(__file__).resolve().parents[1]; REPO=R.parent
sys.path.insert(0,str(REPO/'mathxl-keytag-batch/source/vendor'))
import numpy as np
import trimesh, manifold3d as m
from shapely.geometry import Polygon,Point,box
from shapely.ops import unary_union
from shapely import affinity
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as Patch
# Reuse functions without executing the previous customer order's top-level batch.
base=REPO/'mathxl-keytag-batch/source/generate.py'
nodes=ast.parse(base.read_text()).body
wanted={'polys','solid','mesh','save_stl','draw'}
exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name in wanted],type_ignores=[]),str(base),'exec'))
# Float32 export can collapse sub-micron Boolean sliver triangles. Remove only
# degenerate/duplicate faces after conversion; verify all serialized meshes below.
base_mesh=mesh
def mesh(shape):
    tm=base_mesh(shape)
    tm.update_faces(tm.nondegenerate_faces(height=1e-6))
    tm.update_faces(tm.unique_faces());tm.remove_unreferenced_vertices()
    return tm

# Extend the existing standard 3MF component/material convention to named color parts.
def write_color_3mf(parts,path):
    resources=['<basematerials id="1"><base name="White PETG" displaycolor="#F2F3F2FF"/><base name="Navy PETG" displaycolor="#102C4CFF"/></basematerials>']
    children=[]
    for oid,(name,shape,color) in enumerate(parts,2):
        tm=mesh(shape)
        vertices=''.join(f'<vertex x="{x:.7f}" y="{y:.7f}" z="{z:.7f}"/>' for x,y,z in tm.vertices)
        faces=''.join(f'<triangle v1="{a}" v2="{b}" v3="{c}" pid="1" p1="{color}"/>' for a,b,c in tm.faces)
        resources.append(f'<object id="{oid}" type="model" name="{name}" pid="1" pindex="{color}"><mesh><vertices>{vertices}</vertices><triangles>{faces}</triangles></mesh></object>')
        children.append(f'<component objectid="{oid}"/>')
    assembly=len(parts)+2
    resources.append(f'<object id="{assembly}" type="model" name="CAV 3883"><components>'+''.join(children)+'</components></object>')
    xml='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>'+''.join(resources)+f'</resources><build><item objectid="{assembly}" transform="1 0 0 0 1 0 0 0 1 29 14 0"/></build></model>'
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model',xml)

P=json.loads((R/'source/parameters.json').read_text())
subprocess.run(['node',str(R/'source/outlines.mjs')],cwd=REPO,check=True)
texts=json.loads((R/'source/text-outlines.json').read_text())
def fit(g,w,h,cx=0):
    a,b,c,d=g.bounds;k=min(w/(c-a),h/(d-b))
    return affinity.translate(affinity.scale(affinity.translate(g,-(a+c)/2,-(b+d)/2),xfact=k,yfact=k,origin=(0,0)),cx,0)
def text(s,w,h,cx=0):return fit(unary_union([Polygon(p['outer'],p['holes']).buffer(0) for p in texts[s]]),w,h,cx)
src=trimesh.load_mesh(R/'reference/mercedes-original.stl')
# Exact triangle silhouette in XY, retaining all source openings; no raster tracing.
tri=[Polygon(t[:,:2]) for t in src.triangles if abs((t[1,0]-t[0,0])*(t[2,1]-t[0,1])-(t[1,1]-t[0,1])*(t[2,0]-t[0,0]))>1e-10]
raw=unary_union(tri).buffer(0)
logo=fit(raw,P['emblem_diameter'],P['emblem_diameter'],P['emblem_x'])
reg=text(P['registration'],P['registration_width'],P['registration_height'],P['registration_x'])
brand=text(P['branding'],P['branding_width'],P['branding_height'])
back=affinity.scale(brand,xfact=-1,yfact=1,origin=(0,0))
W,H,T,E,D=[P[k] for k in ['width','height','body_thickness','relief','recess']]
hole=Point(P['hole_x'],0).buffer(P['hole_diameter']/2,quad_segs=96)
# Rebuild the dirty source surface parametrically using its measured silhouette proportions.
# Source inner-ring radius ~65 mm, outer ~75 mm, valley radius ~11.2 mm.
from logo_catalog import build_logo
logo_shape,logo_local,_logo_dependencies=build_logo(P['logo_id'],P)
logo=affinity.translate(logo_local,P['emblem_x'],0)
base_h=P['emblem_base'];crown=P['emblem_ring_crown'];land=P['ring_top_land']
ro=P['emblem_diameter']/2;ri=ro-P['ring_width']
logo_s=logo_shape.translate((P['emblem_x'],0,T))
reg_s=solid(reg,E,T);branding_s=solid(back,D)
external_source=pathlib.Path(r'E:\Shared E\Mercedes logo.stl')
source_report={'sha256':hashlib.sha256((R/'reference/mercedes-original.stl').read_bytes()).hexdigest(),'external_source_matches':(hashlib.sha256(external_source.read_bytes()).hexdigest()==hashlib.sha256((R/'reference/mercedes-original.stl').read_bytes()).hexdigest()) if external_source.exists() else None,'bounds_mm':src.bounds.tolist(),'extents_mm':src.extents.tolist(),'triangles':len(src.faces),'watertight':bool(src.is_watertight),'consistent_winding':bool(src.is_winding_consistent),'components':len(src.split()),'source_units':'STL has no units; assumed mm','orientation':'Circular face XY; +Y star apex retained','adaptation':'Parametric rebuild from measured source proportions: outer/inner ring radii 7.5/6.5 mm, valley radius 1.15 mm, three arms 120 degrees apart. Source tiny central opening and sub-nozzle sliver facets removed. Prior extracted flat silhouette inspected but replaced. Star uses convex faceted shoulders with broad declining crest; ring uses revolved chamfer crown. Not a direct sculpted-STL export.','adapted_xy_mm':[15,15],'emblem_relief_mm':P['emblem_relief'],'ring_crown_mm':crown,'ring_top_land_mm':land,'star_top_land_mm':P['star_top_land'],'ring_chamfer_run_mm':(ro-ri-land)/2,'ring_chamfer_rise_mm':crown-base_h}
(R/'documentation/emblem-inspection.json').write_text(json.dumps(source_report,indent=2))
def cross_section(shape,z):
    contours=shape.slice(z).to_polygons()
    if not contours:return Polygon()
    # EvenOdd rule handles holes regardless of winding.
    result=Polygon()
    for contour in contours:result=result.symmetric_difference(Polygon(contour))
    return result.buffer(0)
sections=[];previous=logo_local
for height in np.arange(.06,P['emblem_relief'],.12):
    g=cross_section(logo_shape,float(height))
    sections.append({'height_above_front_mm':round(float(height),3),'area_mm2':g.area,'unsupported_area_mm2':g.difference(previous.buffer(.002)).area})
    previous=g
def render_mesh(body,accent,path,right,up):
    from PIL import Image
    pixels=np.full((480,1000,3),240,dtype=np.uint8);depth=np.full((480,1000),-np.inf)
    camera=np.cross(right,up)
    light=np.array([-.7,.3,1]);light/=np.linalg.norm(light)
    for shape,color in [(body,np.array([242,243,242])),(accent,np.array([16,44,76]))]:
        tm=mesh(shape)
        for tri,normal in zip(tm.triangles,tm.face_normals):
            if normal@camera<=0:continue
            px=tri@right*13+500;py=240-tri@up*13;pz=tri@camera
            x0=max(0,int(np.floor(px.min())));x1=min(999,int(np.ceil(px.max())))
            y0=max(0,int(np.floor(py.min())));y1=min(479,int(np.ceil(py.max())))
            if x1<x0 or y1<y0:continue
            xx,yy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
            den=(py[1]-py[2])*(px[0]-px[2])+(px[2]-px[1])*(py[0]-py[2])
            if abs(den)<1e-10:continue
            u=((py[1]-py[2])*(xx-px[2])+(px[2]-px[1])*(yy-py[2]))/den
            v=((py[2]-py[0])*(xx-px[2])+(px[0]-px[2])*(yy-py[2]))/den
            z=u*pz[0]+v*pz[1]+(1-u-v)*pz[2]
            target=depth[y0:y1+1,x0:x1+1];mask=(u>=-1e-7)&(v>=-1e-7)&(u+v<=1.0000001)&(z>target)
            target[mask]=z[mask];pixels[y0:y1+1,x0:x1+1][mask]=np.clip(color*(.65+.35*max(0,normal@light)),0,255)
    Image.fromarray(pixels).save(path)

results=[]
for kind in ['capsule','rounded-rectangle']:
    for border_style in ['none','thin','bold','double']:
        radius=H/2 if kind=='capsule' else P['rectangle_radius']
        outer=box(-W/2+radius,-H/2+radius,W/2-radius,H/2-radius).buffer(radius,quad_segs=96) if kind!='capsule' else unary_union([box(-(W-H)/2,-H/2,(W-H)/2,H/2),Point(-(W-H)/2,0).buffer(radius,quad_segs=96),Point((W-H)/2,0).buffer(radius,quad_segs=96)])
        export_dir=R/'exports' if border_style=='none' else R/'exports/borders'/border_style
        preview_dir=R/'previews' if border_style=='none' else R/'previews/variants'/border_style
        export_dir.mkdir(parents=True,exist_ok=True);preview_dir.mkdir(parents=True,exist_ok=True)
        border=Polygon()
        if border_style!='none':
            width=P['border_bold'] if border_style=='bold' else P['border_thin']
            edge=outer.buffer(-P['border_inset']);border=edge-edge.buffer(-width)
            if border_style=='double':
                edge=outer.buffer(-P['border_double_inset']);border=border.union(edge-edge.buffer(-P['border_thin']))
        border_s=solid(border,P['border_relief'],T) if not border.is_empty else m.Manifold()
        floor=outer-hole
        body=solid(floor,T)-branding_s
        accent=logo_s+reg_s+border_s
        full=body+accent
        stem='mercedes_'+kind
        parts={'body':body,'emblem':logo_s,'registration':reg_s,'branding-inlay-optional':branding_s}
        if not border.is_empty:parts['border']=border_s
        for name,s in parts.items():save_stl(s,export_dir/f'{stem}_{name}.stl')
        save_stl(full,export_dir/f'{stem}_complete-recessed.stl')
        save_stl(full+branding_s,export_dir/f'{stem}_complete-flush.stl')
        write_color_3mf([('White body',body,0),('Dark blue sculpted emblem',logo_s,1),('Dark blue registration',reg_s,1)]+([('Navy border',border_s,1)] if not border.is_empty else []),export_dir/f'{stem}_recessed_geometry.3mf')
        write_color_3mf([('White body',body,0),('Dark blue sculpted emblem',logo_s,1),('Dark blue registration',reg_s,1),('Optional navy back inlay',branding_s,1)]+([('Navy border',border_s,1)] if not border.is_empty else []),export_dir/f'{stem}_flush_geometry.3mf')
        t=mesh(full)
        strokes={name:float(1-g.buffer(-.2).buffer(.2).area/g.area) for name,g in [('registration',reg),('branding',brand),('emblem',logo)]}
        checks={'watertight':bool(t.is_watertight),'winding':bool(t.is_winding_consistent),'positive_volume':bool(t.volume>0),'single_solid':len(t.split())==1,'dimensions':bool(np.allclose(t.extents,[W,H,T+P['emblem_relief']],atol=.002)),'hole_clear':(full ^ solid(hole,T+P['emblem_relief'])).volume()<1e-6,'registration_edge_clearance':reg.distance(outer.boundary)>=3,'border_clear_of_hole':border.is_empty or border.distance(hole)>=.6,'border_clear_of_art':border.is_empty or border.distance(logo.union(reg))>=.6,'border_continuous':border.is_empty or len(polys(border))==(2 if border_style=='double' else 1),'features_inside_body':floor.buffer(1e-6).covers(logo.union(reg).union(back)),'front_features_separate':logo.distance(reg)>.4,'no_color_overlap':all((a ^ b).volume()<1e-6 for i,a in enumerate([body,logo_s,reg_s,branding_s,border_s]) for b in [body,logo_s,reg_s,branding_s,border_s][i+1:]),'volume_partition':abs((full+branding_s).volume()-body.volume()-accent.volume()-branding_s.volume())<1e-4,'dominant_strokes_0_4':all(v<.05 for v in strokes.values()),'floor_above_branding':T-D>=2.4,'hole_ligament':hole.distance(outer.boundary)>=3,'emblem_no_outward_overhangs':all(x['unsupported_area_mm2']<.01 for x in sections),'ridge_lands_at_least_0_4':P['ring_top_land']>=.4 and P['star_top_land']>=.4}
        report={'variant':kind,'border':border_style,'registration_edge_clearance_mm':reg.distance(outer.boundary),'registration_border_clearance_mm':None if border.is_empty else reg.distance(border),'border_hole_clearance_mm':None if border.is_empty else border.distance(hole),'checks':checks,'passed':all(checks.values()),'measured_dimensions_mm':t.extents.tolist(),'body_dimensions_mm':mesh(solid(floor,T)).extents.tolist(),'hole_diameter_mm':P['hole_diameter'],'minimum_hole_edge_ligament_mm':hole.distance(outer.boundary),'logo_to_hole_gap_mm':hole.distance(logo),'logo_to_registration_gap_mm':logo.distance(reg),'stroke_opening_area_loss':strokes,'volumes_mm3':{k:s.volume() for k,s in parts.items()},'recessed_volume_mm3':full.volume(),'solid_petg_mass_g':full.volume()*P['density_g_cm3']/1000,'solid_filament_length_m':full.volume()/(np.pi*(1.75/2)**2)/1000}
        results.append(report)
        # Orthographic views from the actual feature contours. Back is physically flipped around Y.
        for face in ['front','back','dimensioned','side']:
            fig,ax=plt.subplots(figsize=(10,4.8));fig.patch.set_facecolor('#e8ecf0');ax.set_facecolor('#e8ecf0')
            if face=='side':
                ax.fill([-29,29,29,-29],[0,0,T,T],color='#f2f3f2')
                for g in [logo,reg]:
                    a,b,c,d=g.bounds;ax.fill([a,c,c,a],[T,T,T+(P['emblem_relief'] if g is logo else E),T+(P['emblem_relief'] if g is logo else E)],color='#102c4c')
                ax.set_xlim(-34,34);ax.set_ylim(-2,6);ax.text(0,-1,'3.20 mm body | 0.72 mm emblem | 3.92 mm overall',ha='center')
            else:
                draw(ax,affinity.scale(floor,xfact=-1,yfact=1,origin=(0,0)) if face=='back' else floor,'#f2f3f2','#e8ecf0')
                if face=='back':draw(ax,brand,'#102c4c','#f2f3f2')
                else:
                    draw(ax,border,'#102c4c','#f2f3f2');draw(ax,logo,'#102c4c','#f2f3f2');draw(ax,reg,'#102c4c','#f2f3f2')
                ax.set_xlim(-35,35);ax.set_ylim(-20,20)
                if face=='dimensioned':
                    ax.annotate('',(-29,-17),(29,-17),arrowprops={'arrowstyle':'<->','color':'#444'});ax.text(0,-16.5,'58.00 mm',ha='center')
                    ax.annotate('',(32,-14),(32,14),arrowprops={'arrowstyle':'<->','color':'#444'});ax.text(33,0,'28.00 mm',rotation=90,va='center')
                    ax.text(0,17,f'Hole Ø4.50 | R{radius:g} | emblem 0.72 | text/recess 0.48 mm',ha='center',fontsize=10)
            ax.set_aspect('equal');ax.axis('off');ax.set_title(kind.replace('-',' ').title()+' | '+face+(' | navy-filled recess shown' if face=='back' else ''))
            fig.tight_layout();fig.savefig(preview_dir/f'{kind}-{face}.png',dpi=170);plt.close(fig)
        render_mesh(body,accent,preview_dir/f'{kind}-mesh.png',np.array([.94,.342,0]),np.array([-.225,.618,.753]))
        render_mesh(body,accent,preview_dir/f'{kind}-front.png',np.array([1,0,0]),np.array([0,1,0]))
# Validate serialized outputs, including each 3MF mesh and component references.
exports=[];ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
for p in sorted(p for p in (R/'exports').rglob('*') if p.suffix in ['.stl','.3mf']):
    meshes=[]
    if p.suffix=='.stl':meshes=[trimesh.load_mesh(p)]
    else:
        with zipfile.ZipFile(p) as z:
            assert z.testzip() is None
            xml=ET.fromstring(z.read('3D/3dmodel.model'))
        materials=xml.findall('m:resources/m:basematerials/m:base',ns)
        assert len(materials)==2
        assert all(0<=int(t.attrib['p1'])<len(materials) for t in xml.findall('.//m:triangle',ns))
        ids={o.attrib['id'] for o in xml.findall('m:resources/m:object',ns)}
        assert all(c.attrib['objectid'] in ids for c in xml.findall('.//m:component',ns)+xml.findall('.//m:item',ns))
        for o in xml.findall('m:resources/m:object',ns):
            g=o.find('m:mesh',ns)
            if g is None:continue
            v=[[float(q.attrib[c]) for c in ['x','y','z']] for q in g.findall('m:vertices/m:vertex',ns)]
            f=[[int(q.attrib[c]) for c in ['v1','v2','v3']] for q in g.findall('m:triangles/m:triangle',ns)]
            meshes.append(trimesh.Trimesh(v,f,process=True))
    passed=all(t.is_watertight and t.is_winding_consistent and t.volume>0 for t in meshes)
    exports.append({'file':p.relative_to(R/'exports').as_posix(),'meshes':len(meshes),'passed':bool(passed),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
report={'all_passed':all(r['passed'] for r in results+exports),'models':results,'exports':exports,'emblem_layer_sections_0_12mm':sections,'emblem_ridge_lands_mm':{'ring':P['ring_top_land'],'star':P['star_top_land']},'slicer_verified':False,'physical_print_verified':False,'three_mf_status':'Standard multipart material-assigned geometry, NOT sliced P2S projects or ready to print'}
(R/'documentation/validation.json').write_text(json.dumps(report,indent=2))
# Combined front/back review sheet.
from PIL import Image,ImageOps,ImageDraw
sheet=Image.new('RGB',(1600,800),'#e8ecf0')
for row,face in enumerate(['front','back']):
    for col,kind in enumerate(['capsule','rounded-rectangle']):
        im=Image.open(R/'previews'/f'{kind}-{face}.png').convert('RGB');im.thumbnail((800,400));sheet.paste(im,(col*800,row*400))
d=ImageDraw.Draw(sheet)
for col,kind in enumerate(['Capsule','Rounded rectangle']):
    d.text((col*800+25,12),kind+' | Front | sculpted emblem',fill='#263342')
sheet.save(R/'previews/comparison-front-back.png')
print(json.dumps({'all_passed':report['all_passed'],'models':results},indent=2))
assert report['all_passed'], 'Review documentation/validation.json'
subprocess.run([sys.executable,str(R/'source/sync-preview-assets.py')],check=True)


