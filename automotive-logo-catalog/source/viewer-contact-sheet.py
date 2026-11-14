"""Arrange actual browser screenshots. No replacement or synthetic model renderer."""
from pathlib import Path
import os
from PIL import Image, ImageDraw
root=Path(os.environ.get('QA_REPORT_DIR','automotive-logo-catalog/reports/viewer/local'))
front=Image.open(root/'front-390.png').convert('RGB');back=Image.open(root/'back-390.png').convert('RGB')
canvas=Image.new('RGB',(front.width+back.width+24,max(front.height,back.height)+32),'#e8ecf0')
draw=ImageDraw.Draw(canvas);draw.text((8,8),'Front: sculpted Mercedes relief',fill='#102c4c');draw.text((front.width+24,8),'Back: readable flush branding',fill='#102c4c')
canvas.paste(front,(0,32));canvas.paste(back,(front.width+24,32));canvas.save(root/'front-back-390.png')
