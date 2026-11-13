"""Web-only intake; does not touch manufacturing geometry or production approval."""
import pathlib,json,hashlib,re,xml.etree.ElementTree as E
R=pathlib.Path(__file__).resolve().parents[1];dest=R.parent/'public/automotive-logos';dest.mkdir(exist_ok=True)
allowed={'svg','g','path','circle','ellipse','rect','polygon','polyline','defs','clipPath','linearGradient','radialGradient','stop','title','desc'}
attrs={'width','height','viewBox','fill','fill-rule','clip-rule','clip-path','d','transform','cx','cy','r','rx','ry','x','y','points','id','opacity','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','version','offset','stop-color','stop-opacity','x1','x2','y1','y2','gradientUnits','gradientTransform','stroke-miterlimit','preserveAspectRatio'}
def clean(data):
 if re.search(br'<!DOCTYPE|<!ENTITY',data,re.I):raise ValueError('DTD/entity rejected')
 data=re.sub(br'<\?xml[^>]*\?>',b'',data)
 root=E.fromstring(data)
 for el in root.iter():
  tag=el.tag.split('}')[-1]
  if tag not in allowed:raise ValueError('Unsupported tag '+tag)
  el.tag=tag
  style=el.attrib.pop('style','')
  for pair in style.split(';'):
   if ':' in pair:
    k,v=pair.split(':',1)
    if k.strip() in attrs:el.set(k.strip(),v.strip())
  el.attrib.pop('class',None)
  for k,v in list(el.attrib.items()):
   if k not in attrs or re.search(r'javascript:|https?:|data:|expression|@import',v,re.I):raise ValueError('Unsafe attribute '+k)
   if 'url(' in v and not re.fullmatch(r'url\(#[\w-]+\)',v):raise ValueError('External URL rejected')
   if k in ['fill','stroke'] and v not in ['none','transparent']:
    el.set(k,'var(--body)' if v.lower() in ['white','#fff','#ffffff'] else 'currentColor')
 root.set('preserveAspectRatio','xMidYMid meet');root.set('xmlns','http://www.w3.org/2000/svg');return E.tostring(root,encoding='unicode')
if __name__=='__main__':
 records=[]
 for p in sorted((R/'assets').glob('*.svg')):
  brand='mercedes' if p.stem=='mercedes-benz' else p.stem
  owner='vehiclespecs' if brand in ['suzuki','isuzu','mercedes'] else 'cardog-ai';source=json.loads((R/'reports'/f'{owner}.json').read_text());file=p.stem+'-logo.svg' if owner=='vehiclespecs' else 'core/optimized/'+p.stem.title().replace('Bmw','BMW')+' Icon.svg'
  row={'id':brand,'name':'Mercedes-Benz' if brand=='mercedes' else p.stem.upper() if brand in ['bmw','kia'] else p.stem.title(),'source_url':f'https://github.com/{source["repository"]["full_name"]}/blob/{source["tree"]["sha"]}/{file}','version_tree_sha':source['tree']['sha'] if brand!='mercedes' else 'local-approved-provider','original_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'repository_license':'MIT; code/organization only, not manufacturer authorization','artwork_license':'unverified per-file grant','trademark_authorization':'unverified','commercially_authorized':False,'source_verified':True,'capability':'cad-validated' if brand=='mercedes' else 'logo-sourced-cad-pending','production_ready':False,'minimum_feature_mm':.4,'target_box_mm':[15,15],'feature_regions':[],'profile_parameters':{},'local_corrections':[],'mesh_grouping':['body','accent'],'validation_required':['profile fidelity','minimum width','watertight','AMS partition','clearance','first article'],'profile_plan':{'toyota':'Interlocking ovals with rounded crowns','honda':'H emblem with selected edge bevels','bmw':'Roundel, rim and distinct quadrant regions','audi':'Overlapping rounded-section rings','mitsubishi':'Three diamond facets','mercedes':'Existing validated crowned ring/star provider; unchanged'}.get(brand,'Derive profile from an approved physical/reference emblem, not shared extrusion')}
  try:
   if brand=='mercedes':
    data=(R/'derived/mercedes.svg').read_bytes();row['source_url']='Customer-approved Mercedes CAD provider (local)';row['original_sha256']=hashlib.sha256(data).hexdigest();row['capability']='cad-validated'
   else:data=p.read_bytes()
   svg=clean(data);(dest/f'{brand}.svg').write_text(svg);row['asset']='/automotive-logos/'+brand+'.svg';row['sanitized_sha256']=hashlib.sha256(svg.encode()).hexdigest()
  except Exception as e:row['capability']='source-pending';row['rejection']=str(e)
  regions={'mercedes':['circular crown','three-pointed star ridges'],'toyota':['outer oval','interlocking central ovals'],'honda':['H emblem','perimeter frame'],'bmw':['outer roundel rim','lettering ring','quadrant regions'],'audi':['four interlocked rings'],'mitsubishi':['three diamond facets']}.get(brand,['manufacturer-specific emblem regions'])
  row['feature_regions']=[{'id':str(i),'construction':v,'crown_height_mm':None,'bevel_width_mm':None,'mesh_group':'accent','approval':'validated-reference' if brand=='mercedes' else 'pending'} for i,v in enumerate(regions)]
  row['profile_parameters']={'crown_height_mm':.72 if brand=='mercedes' else None,'ring_crown_height_mm':.60 if brand=='mercedes' else None,'bevel_width_mm':None}
  records.append(row)
 (R/'web-manifest.json').write_text(json.dumps(records,indent=2));(R.parent/'src/lib/automotive-logo-definitions.json').write_text(json.dumps(records,indent=2));print([(x['id'],x['capability']) for x in records])
 for b in [b'<svg><script/></svg>',b'<svg onload="a"/>',b'<svg><path fill="url(https://x)"/></svg>']:
  try:clean(b);raise AssertionError('unsafe accepted')
  except ValueError:pass
