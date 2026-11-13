"""Offline P2S slicing validation; never upload or print. Requires installed Bambu Studio."""
import sys,subprocess,json,zipfile,time,os
from pathlib import Path
root=Path('automotive-logo-catalog/reports/production-sprint').resolve()
profiles=root/'slicer-profiles';data=Path('.tokensave/slicer-data').resolve();data.mkdir(parents=True,exist_ok=True)
cases=[('capsule-none-ABC1234',.16)]
if '--all' in sys.argv:
 cases=[(f'{shape}-{border}-ABC1234',.16) for shape in ['capsule','rounded-rectangle'] for border in ['none','thin','bold','double']]+[(f'{shape}-bold-I1',.16) for shape in ['capsule','rounded-rectangle']]+[(f'{shape}-double-III11111111',.16) for shape in ['capsule','rounded-rectangle']]+[(f'{shape}-bold-ABC1234',.12) for shape in ['capsule','rounded-rectangle']]
rows=[]
for name,height in cases:
 target=root/'slicing'/f'{name}-{height:.2f}';target.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(root/'cad'/f'{name}.3mf') as source: colors=json.loads(source.read('Metadata/project_settings.config'))['filament_colour']
 for i,color in enumerate(colors,1):
  filament=json.loads((profiles/f'filament-{i}.json').read_text());filament['filament_colour']=[color];(target/f'filament-{i}.json').write_text(json.dumps(filament,indent=2))
 args=[str(Path('.tokensave/bambu-cli-runtime/python.exe').resolve()),'automotive-logo-catalog/source/bambu-cli.py','--datadir',str(data),'--load-settings',str(profiles/'machine.json')+';'+str(profiles/f'process-{height:.2f}.json'),'--load-filaments',str(target/'filament-1.json')+';'+str(target/'filament-2.json'),'--orient','0','--arrange','1','--slice','0','--debug','2','--outputdir',str(target),'--export-3mf','sliced.3mf',str(root/'cad'/f'{name}.3mf')]
 with (target/'cli.log').open('w') as log:
  start=time.monotonic();run=subprocess.run(args,stdout=log,stderr=subprocess.STDOUT,stdin=subprocess.DEVNULL,timeout=180,env={**os.environ,"PYTHONHOME":sys.base_prefix})
 row={'name':name,'layerHeight':height,'returnCode':run.returncode,'seconds':round(time.monotonic()-start,2),'gcodeCreated':False,'networkOrPrinting':False}
 if (target/'sliced.3mf').exists():
  with zipfile.ZipFile(target/'sliced.3mf') as archive:
   row['gcodeCreated']=any(n.endswith('.gcode') and archive.getinfo(n).file_size>1000 for n in archive.namelist())
   sliced_settings=json.loads(archive.read('Metadata/project_settings.config'));row['colorsMatch']=sliced_settings['filament_colour']==colors
  detail=json.loads((target/'result.json').read_text())['sliced_plates'][0];row['filaments']=detail['filaments'];row['twoFilamentsUsed']=len(detail['filaments'])==2 and all(f['main_used_g']>0 for f in detail['filaments']);row['filamentChanges']=detail['filament_change_times'];row['estimatedSeconds']=detail['total_predication'];row['warningMessage']=detail['warning_message'];row['topologyRepairLog']=any(t in (target/'cli.log').read_text(errors='replace').lower() for t in ['non-manifold','non manifold','repairing mesh'])
 row['files']=[p.name for p in target.iterdir()]
 rows.append(row);print(json.dumps(row),flush=True)
 (root/'slicer-results.json').write_text(json.dumps({'engine':'Installed Bambu Studio 02.09.01.70, official Windows DLL entry point','printer':'Bambu Lab P2S 0.4 nozzle','filament':'Bambu PETG Basic','passed':all(r['returnCode']==0 and r['gcodeCreated'] and r.get('twoFilamentsUsed') and r.get('colorsMatch') and not r.get('topologyRepairLog') for r in rows),'rows':rows},indent=2))
 if run.returncode!=0 or not row['gcodeCreated']:
  print((target/'cli.log').read_text(errors='replace')[-8000:]);raise SystemExit(1)

