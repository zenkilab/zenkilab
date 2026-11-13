"""Assemble captures from source/contact-sheet.cjs; no alternate logo renderer."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,os
R=Path(__file__).resolve().parents[1];folder=Path(os.environ.get('QA_REPORT_DIR',str(R/'reports/fitting')));definitions=json.loads((R/'web-manifest.json').read_text());out=Image.new('RGB',(1800,1200),'#e8ecf0');draw=ImageDraw.Draw(out)
for i,brand in enumerate(definitions):
    im=Image.open(folder/f'contact-{brand["id"]}.png').convert('RGB');im.thumbnail((440,260));x=(i%4)*450;y=(i//4)*300
    out.paste(im,(x,y+25));draw.text((x+12,y+8),brand['name'],fill='#102c4c')
out.save(folder/'all-16-contact-sheet.png')
