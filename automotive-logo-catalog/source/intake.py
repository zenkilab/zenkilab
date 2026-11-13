"""Strict local SVG intake. Unsupported markup is rejected, never executed."""
import pathlib,json,hashlib,xml.etree.ElementTree as ET
R=pathlib.Path(__file__).resolve().parents[1]
allowed={'svg','g','path','circle','ellipse','rect','polygon','polyline','title','desc'}
attrs={'width','height','viewBox','fill','fill-rule','clip-rule','d','transform','cx','cy','r','rx','ry','x','y','points','id','opacity','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','xmlns','version'}
def sanitize(data):
 if b'<!' in data.upper() or b'<?' in data:raise ValueError('Declarations/entities not accepted')
 root=ET.fromstring(data)
 for el in root.iter():
  if el.tag.split('}')[-1] not in allowed:raise ValueError('Unsupported element '+el.tag)
  for k,v in el.attrib.items():
   if k not in attrs or any(t in v.lower() for t in ['url(', 'javascript:', 'http:', 'https:', 'data:']):raise ValueError('Unsafe/unsupported attribute '+k)
 return ET.tostring(root,encoding='unicode').replace('ns0:','').replace(':ns0','')
if __name__=='__main__':
 records=[]
 for p in sorted((R/'assets').glob('*.svg')):
  brand=p.stem;owner='vehiclespecs' if brand=='suzuki' else 'cardog-ai';info=json.loads((R/'reports'/f'{owner}.json').read_text());sha=info['tree']['sha'];repo=info['repository']['full_name'];f='suzuki-logo.svg' if brand=='suzuki' else 'core/optimized/'+brand.title()+' Icon.svg';f=f.replace('Bmw','BMW')
  rec={'id':brand,'repository':f'https://github.com/{repo}','source_version':sha,'original_url':f'https://github.com/{repo}/blob/{sha}/{f}','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'repository_license':'MIT (scope limited; see snapshot)','asset_copyright_license':'Unverified; no per-file grant established','original_artwork_provenance':'Upstream asset; original manufacturer/Commons file not established','trademark_authorization':'unverified','commercially_authorized':False,'ordering':'inquiry-only','source_verified':True,'technical_supported':False}
  try:
   clean=sanitize(p.read_bytes());dest=R/'sanitized'/p.name;dest.parent.mkdir(exist_ok=True);dest.write_text(clean);rec['sanitized_sha256']=hashlib.sha256(dest.read_bytes()).hexdigest();rec['sanitization']='accepted'
  except Exception as e:rec['sanitization']='rejected';rec['rejection']=str(e)
  records.append(rec)
 records.append({'id':'mercedes','source_verified':True,'technical_supported':True,'preferred_asset':'../mercedes-cav3883-prototypes/source/logo_catalog.py','asset_copyright_license':'Customer-supplied STL; redistribution/manufacturing rights unverified','trademark_authorization':'unverified','commercially_authorized':False,'ordering':'inquiry-only','note':'Approved ridged geometry preserved, no SVG replacement'})
 (R/'manifest.json').write_text(json.dumps(records,indent=2))
 for bad in [b'<svg><script/></svg>',b'<svg><path onload="x"/></svg>',b'<!DOCTYPE svg><svg/>',b'<svg><image href="https://x"/></svg>']:
  try:sanitize(bad);raise AssertionError('Unsafe SVG accepted')
  except ValueError:pass
 print([(r['id'],r.get('sanitization')) for r in records])
