import json,hashlib
from pathlib import Path
src=Path(r'C:\Program Files\Bambu Studio\resources\profiles\BBL')
out=Path('automotive-logo-catalog/reports/production-sprint/slicer-profiles');out.mkdir(parents=True,exist_ok=True)
index={}
for folder in ['machine','process','filament']:
 for p in (src/folder).glob('*.json'):
  d=json.loads(p.read_text(encoding='utf-8-sig'));index[(folder,p.stem)]=(p,d);index[(folder,d.get('name',p.stem))]=(p,d)
used={}
def resolve(folder,name,seen=()):
 assert (folder,name) not in seen
 p,d=index[(folder,name)];used[str(p.relative_to(src))]=hashlib.sha256(p.read_bytes()).hexdigest();result={}
 if d.get('inherits'):result.update(resolve(folder,d['inherits'],(*seen,(folder,name))))
 for include in d.get('include',[]):result.update(resolve(folder,include,(*seen,(folder,name))))
 result.update({k:v for k,v in d.items() if k not in ['inherits','include']})
 return result
machine=resolve('machine','Bambu Lab P2S 0.4 nozzle')
(out/'machine.json').write_text(json.dumps(machine,indent=2))
for height in [.12,.16]:
 p=resolve('process',f'{height:.2f}mm High Quality @BBL P2S');p.update(layer_height=str(height),initial_layer_print_height=str(height),wall_loops='3',sparse_infill_density='20%',enable_support='0',brim_type='no_brim',curr_bed_type='Textured PEI Plate',wall_generator='arachne');(out/f'process-{height:.2f}.json').write_text(json.dumps(p,indent=2))
f=resolve('filament','Bambu PETG Basic @BBL P2S 0.4 nozzle')
for n,color in [(1,'#F2F3F2'),(2,'#102C4C')]:
 f['filament_colour']=[color];(out/f'filament-{n}.json').write_text(json.dumps(f,indent=2))
(out/'provenance.json').write_text(json.dumps({'source':'Installed Bambu Studio 02.09.01.70 packaged BBL profiles, no user or printer account settings','printer':'Bambu Lab P2S 0.4 nozzle','filament':'Bambu PETG Basic','hashes':used,'use':'Offline slicing validation only; no physical printing'},indent=2))
