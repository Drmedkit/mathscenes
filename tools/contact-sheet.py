"""contact-sheet.py: all screenshots in a folder -> contact sheets (sheet-1.jpg, sheet-2.jpg, ...), 12 frames each,
3 columns of 640 x 360 with the file name under each frame. One look at a sheet replaces opening a dozen full
screenshots; open a full-size PNG only where the sheet shows a problem.

    python tools/contact-sheet.py <folder> [--per 12] [--cols 3] [--w 640]
"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
if not args:
    raise SystemExit(__doc__)
folder = args[0]
opt = lambda k, d: int(args[args.index(f"--{k}") + 1]) if f"--{k}" in args else d
per, cols, w = opt("per", 12), opt("cols", 3), opt("w", 640)
h, cap = w * 9 // 16, 26
files = sorted(f for f in glob.glob(os.path.join(folder, "*.png")))
for old in glob.glob(os.path.join(folder, "sheet-*.jpg")):
    os.remove(old)
try:
    font = ImageFont.truetype("segoeui.ttf", 17)
except OSError:
    font = ImageFont.load_default()
for s in range(0, len(files), per):
    chunk = files[s:s + per]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * (h + cap)), (12, 12, 20))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        x, y = (i % cols) * w, (i // cols) * (h + cap)
        sheet.paste(Image.open(f).convert("RGB").resize((w, h)), (x, y))
        d.text((x + 6, y + h + 3), os.path.basename(f), fill=(220, 220, 230), font=font)
    out = os.path.join(folder, f"sheet-{s // per + 1}.jpg")
    sheet.save(out, quality=82)
    print(out)
