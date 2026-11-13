"""Call the installed slicer's official Windows entry point in an isolated process.
Equivalent to BambuStudio_app_msvc.cpp's launcher, with console streams retained.
Only local CLI slicing/export arguments are permitted. Never upload or print.
"""
import ctypes,os,sys
from pathlib import Path
install=Path(r'C:\Program Files\Bambu Studio')
args=sys.argv[1:]
if any('print' in a.lower() and a.startswith('--') or 'upload' in a.lower() or 'send' in a.lower() or ':// ' in a for a in args):
 raise SystemExit('Network/printing operations are not allowed by this validation wrapper')
os.add_dll_directory(str(install))
ctypes.windll.kernel32.SetErrorMode(0x0001|0x0002)
dll=ctypes.WinDLL(str(install/'BambuStudio.dll'))
entry=dll.bambustu_main
entry.argtypes=[ctypes.c_int,ctypes.POINTER(ctypes.c_wchar_p)]
entry.restype=ctypes.c_int
argv=[str(install/'bambu-studio.exe'),*args]
array=(ctypes.c_wchar_p*(len(argv)+1))(*argv,None)
raise SystemExit(entry(len(argv),array))
