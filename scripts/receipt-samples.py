"""Synthetic Romanian fiscal receipts for the OCR benchmark (scripts/ocr-bench.ts).

Until the canteen's real receipt is photographed (docs/17 D6), the reader is measured on receipts
laid out the way Romanian fiscal printers (AMEF) print them — four layouts with the label variants
found on real receipts — and photographed the way a student would: on a table, tilted, in uneven
light, slightly out of focus, compressed by the phone.

    python scripts/receipt-samples.py [out_dir] [count] [seed]

Writes <out_dir>/<name>.jpg and <out_dir>/truth.json (the fields each image should yield).
Real photos go through the same benchmark: drop them in a folder with a truth.json of the same
shape.
"""
import json
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

OUT = sys.argv[1] if len(sys.argv) > 1 else "dist/receipts"
COUNT = int(sys.argv[2]) if len(sys.argv) > 2 else 48
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
# Thermal printers print a bitmap font with even strokes; these are the closest system fonts.
FONTS = ["C:/Windows/Fonts/lucon.ttf", "C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/consolab.ttf", "C:/Windows/Fonts/courbd.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"]
FONTS = [f for f in FONTS if os.path.exists(f)]
WIDTH = 40  # characters per line on an 80 mm roll

DISHES = [
    ("CIORBA DE PERISOARE", 950), ("SUPA CREMA DE LEGUME", 800), ("CIORBA DE BURTA", 1200),
    ("PUI LA CUPTOR CU CARTOFI", 1700), ("SNITEL DE PUI", 1550), ("TOCANITA DE VITA", 1900),
    ("PILAF CU LEGUME", 1100), ("PIURE DE CARTOFI", 600), ("SALATA DE VARZA", 450),
    ("PAPANASI CU SMANTANA", 1300), ("CLATITE CU GEM", 900), ("APA PLATA 0.5L", 400),
    ("PAINE", 100), ("MUSACA DE CARTOFI", 1600), ("FASOLE BATUTA", 850),
]

def lei(bani, sep=","):
    return f"{bani // 100}{sep}{bani % 100:02d}"

def row(left, right, fill=" "):
    gap = max(1, WIDTH - len(left) - len(right))
    return left + fill * gap + right

def center(s):
    return s.center(WIDTH).rstrip()

def make_receipt(r, layout):
    items = r.sample(DISHES, r.randint(2, 4))
    qtys = [1 if r.random() < 0.85 else 2 for _ in items]
    total = sum(p * q for (_, p), q in zip(items, qtys))
    day = r.randint(1, 28)
    month = r.randint(1, 12)
    date = f"2026-{month:02d}-{day:02d}"
    hh, mm, ss = r.randint(11, 16), r.randint(0, 59), r.randint(0, 59)
    number = r.randint(1, 1800)
    z = r.randint(1, 2400)
    cif = str(r.choice([4505375, 14543901, 26711810, 36178410]))
    device = r.choice(["DA", "DB", "TR", "ED"]) + str(r.randint(10**9, 10**10 - 1))
    vat = round(total * 11 / 111)
    sep = "," if layout in ("datecs", "storno") else "."
    L = []
    if layout == "datecs":
        L += [center("UNIVERSITATEA DIN BUCURESTI"), center("CANTINA M. KOGALNICEANU"), center("BD. M. KOGALNICEANU NR. 36-46"),
              center("SECTOR 5, BUCURESTI"), center(f"C.I.F.: RO{cif}"), "-" * WIDTH]
        for (name, p), q in zip(items, qtys):
            L += [f"{q}.000 BUC x {lei(p, sep)}", row(name, f"{lei(p * q, sep)} B")]
        L += ["-" * WIDTH, row("SUBTOTAL", lei(total, sep)), row("TOTAL", lei(total, sep)), row("CARD", lei(total, sep)),
              row("TVA B 11,00%", lei(vat, sep)), row("TOTAL TVA", lei(vat, sep)), "-" * WIDTH,
              row(f"Z: {z:04d}", f"BF: {number:04d}"), row(f"{day:02d}-{month:02d}-2026", f"{hh:02d}:{mm:02d}:{ss:02d}"),
              f"ID UNIC: {device}", center("BON FISCAL")]
    elif layout == "storno":
        L += [center("CANTINA STUDENTEASCA SRL"), center(f"CUI: RO{cif}"), center("Str. Mihail Kogalniceanu nr. 36"),
              center("Punct de lucru: Cantina"), ""]
        for (name, p), q in zip(items, qtys):
            L += [row(f"{name.title()[:24]}", ""), row(f"  {q} x {lei(p, sep)}", f"{lei(p * q, sep)} B")]
        L += ["", row("TVA 11%", lei(vat, sep)), row("TOTAL ", f" {lei(total, sep)} RON", "."), "Plata CARD", "",
              center(f"BON FISCAL Nr. {number:06d}"), center(f"Seria AMEF: {device}"), center(f"Z: {z:04d}"),
              center(f"Data: {day:02d}.{month:02d}.2026   Ora: {hh:02d}:{mm:02d}")]
    elif layout == "kaufland":
        L += [center("CANTINA KOGALNICEANU"), center("BUCURESTI SECTOR 5"), center(f"COD FISCAL: RO{cif}"), "-" * WIDTH]
        for (name, p), q in zip(items, qtys):
            L += [row(name[:28], f"{lei(p * q, sep)} B") if q == 1 else f"{q} BUC x {lei(p, sep)}"]
            if q != 1:
                L += [row(name[:28], f"{lei(p * q, sep)} B")]
        L += ["-" * WIDTH, row("TOTAL LEI", lei(total, sep)), row("NUMERAR", lei(total + 500, sep)), row("REST", lei(500, sep)),
              row("TVA B=11%", lei(vat, sep)), "-" * WIDTH,
              f"BF {number:05d}  {day:02d}.{month:02d}.2026 {hh:02d}:{mm:02d}", f"Z {z:04d}   S/N: {device}", center("BON FISCAL")]
    else:  # "tremol": ISO date, "Nr. bon fiscal", "Nr. Z"
        L += [center("S.C. CANTINA UB S.R.L."), center(f"Cod fiscal: RO{cif}"), center("Bucuresti"), "=" * WIDTH]
        for (name, p), q in zip(items, qtys):
            L += [row(name, f"{lei(p * q, sep)} B")]
        L += ["=" * WIDTH, row("TOTAL:", f"{lei(total, sep)} LEI"), row("CARD:", lei(total, sep)), row("TVA B 11%:", lei(vat, sep)),
              "", f"Nr. bon fiscal: {number}", f"Nr. Z: {z}", f"Data: 2026-{month:02d}-{day:02d} {hh:02d}:{mm:02d}", f"Serie fiscala: {device}"]
    truth = {"receiptNumber": str(number), "totalBani": total, "date": date, "time": f"{hh:02d}:{mm:02d}", "fiscalCode": cif,
             "deviceId": device, "zNumber": str(z), "items": [n for n, _ in items]}
    return L, truth

def render(lines, r):
    """Print the receipt the way an AMEF does: black dots on an 80 mm roll at 203 dpi (576 dots
    across), then the paper as a camera sees it — dots spread a little, faded where the head ran
    cold."""
    font_path = r.choice(FONTS)
    dots = 576
    size = 30
    while ImageFont.truetype(font_path, size).getlength("M" * WIDTH) > dots - 24:
        size -= 1
    font = ImageFont.truetype(font_path, size)
    line_h = int(size * 1.3)
    h = line_h * (len(lines) + 3) + 24
    paper = Image.new("L", (dots, h), 255)
    d = ImageDraw.Draw(paper)
    for i, text in enumerate(lines):
        d.text((12, 12 + i * line_h), text, fill=0, font=font)
    paper = paper.point(lambda v: 0 if v < 140 else 255)  # a dot is printed or it is not
    k = 3  # dots → pixels of the "physical" paper the camera looks at
    paper = paper.resize((dots * k, h * k), Image.NEAREST).filter(ImageFilter.GaussianBlur(0.8))
    # Ink from black to faded grey, lighter bands where the print head ran cold, paper not white.
    ink = r.randint(15, 80)
    paper = paper.point(lambda v: ink + (v / 255) * (244 - ink))
    w, hh = paper.size
    fade = Image.new("L", (w, hh), 0)
    fd = ImageDraw.Draw(fade)
    for _ in range(r.randint(0, 3)):
        y = r.randint(0, hh)
        fd.rectangle([0, y, w, y + r.randint(30, 150)], fill=r.randint(30, 110))
    paper = Image.composite(Image.new("L", (w, hh), 244), paper, fade.filter(ImageFilter.GaussianBlur(20)))
    return paper

def photograph(paper, r, level):
    """Put the paper on a table and take a phone photo of it."""
    tilt = {0: 0.5, 1: 4, 2: 9}[level]
    angle = r.uniform(-tilt, tilt)
    paper = paper.convert("RGB").rotate(angle, expand=True, fillcolor=(0, 0, 0))
    scale = {0: 1.0, 1: 0.8, 2: 0.65}[level]
    bw, bh = int(paper.size[0] / scale * 1.25), int(paper.size[1] / scale * 1.1)
    table = Image.new("RGB", (bw, bh), tuple(r.randint(60, 140) for _ in range(3)))
    noise = Image.effect_noise((bw, bh), 18).convert("RGB")
    table = Image.blend(table, noise, 0.15)
    ox = (bw - paper.size[0]) // 2 + r.randint(-20, 20)
    oy = (bh - paper.size[1]) // 2 + r.randint(-20, 20)
    # Mask out the black corners the rotation made, so the table shows through.
    pm = paper.convert("L").point(lambda v: 255 if v > 0 else 0)
    table.paste(paper, (ox, oy), pm)
    img = table
    # Uneven light: a soft shadow from one side.
    if level:
        grad = Image.linear_gradient("L").resize(img.size).rotate(r.choice([0, 90, 180, 270]))
        shade = ImageEnhance.Brightness(img).enhance(r.uniform(0.55, 0.8))
        img = Image.composite(img, shade, grad.point(lambda v: min(255, int(v * 1.6))))
    blur = {0: 0.3, 1: 1.0, 2: 1.6}[level]
    img = img.filter(ImageFilter.GaussianBlur(r.uniform(blur * 0.6, blur)))
    img = Image.blend(img, Image.effect_noise(img.size, 30).convert("RGB"), {0: 0.02, 1: 0.05, 2: 0.08}[level])
    # A phone's resolution: the receipt fills part of the frame.
    target = {0: 2400, 1: 2000, 2: 1600}[level]
    k = target / max(img.size)
    img = img.resize((int(img.size[0] * k), int(img.size[1] * k)), Image.LANCZOS)
    return img

def main():
    os.makedirs(OUT, exist_ok=True)
    truth = {}
    layouts = ["datecs", "storno", "kaufland", "tremol"]
    for i in range(COUNT):
        r = random.Random(SEED + i)
        layout = layouts[i % len(layouts)]
        level = (i // len(layouts)) % 3
        lines, t = make_receipt(r, layout)
        img = photograph(render(lines, r), r, level)
        name = f"{i:03d}-{layout}-{['clean', 'phone', 'hard'][level]}"
        img.save(os.path.join(OUT, f"{name}.jpg"), quality={0: 92, 1: 85, 2: 75}[level])
        t["layout"] = layout
        t["level"] = ["clean", "phone", "hard"][level]
        truth[f"{name}.jpg"] = t
    with open(os.path.join(OUT, "truth.json"), "w", encoding="utf-8") as f:
        json.dump(truth, f, indent=1)
    print(f"{COUNT} receipts in {OUT}")

if __name__ == "__main__":
    main()
