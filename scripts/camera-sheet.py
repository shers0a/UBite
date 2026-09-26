"""Builds docs/camere-romania-2026-09.xlsx — the camera options on the Romanian market for
server-side processing on the UB servers (the camera only streams; counting runs on the VM).

    python scripts/camera-sheet.py

Prices were checked on 25 Sep 2026 (eMAG listings, compari.ro minimum, Rovision). eMAG is a
marketplace: the same model is listed by several sellers at different prices — the cheapest
in-stock listing found is used. Re-check before ordering; update the rows below and re-run.
"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = Path(__file__).resolve().parent.parent / "docs" / "camere-romania-2026-09.xlsx"
CHECKED = "25.09.2026"
EMAG = "https://www.emag.ro"

# UBite palette (design-system tokens, light theme) so the sheet looks like the project.
ACCENT, ACCENT_QUIET = "1F4FD8", "E4EAFB"
LOW_Q, MOD_Q, HIGH_Q, GREY_Q = "D8F0E8", "FBEBCF", "FBE2DA", "E4E8ED"
INK, MUTED = "11161B", "606A73"
TIER_FILL = {"Recomandat": LOW_Q, "Bun": ACCENT_QUIET, "Premium": GREY_Q, "Buget": MOD_Q, "Doar test": HIGH_Q}

CAMERAS = [
    # tier, brand, model, form, res, mp, sensor, lens, hfov, wdr, codec, rtsp_onvif, power, mic, price, shop, url, fit, note
    ("Recomandat", "Uniview", "IPC3618LE-ADF28K-G", "Eyeball (turret)", "3840×2160 @20 fps", 8, '1/2.7"', "2.8", "~113", "120 dB (real)",
     "Ultra 265 / H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 452.19, "eMAG",
     f"{EMAG}/search/IPC3618LE-ADF28K-G", 5,
     "Cel mai bun raport calitate/preț: 4K cu WDR real sub 500 lei. La 8 MP oamenii din capătul cozii au destui pixeli; serverul poate rula modelul la 1280 px sau pe tile-uri."),
    ("Recomandat", "Hikvision", "DS-2CD2383G2-IU (2.8mm)", "Turret", "3840×2160 @20 fps", 8, '1/2.8"', "2.8", "107", "120 dB (real)",
     "H.265+ / H.265 / H.264", "Da / Da (ONVIF S, G, T)", "PoE 802.3af", "Da — se dezactivează", 937.76, "eMAG",
     f"{EMAG}/camera-de-supraveghere-hikvision-network-pro-series-with-acusense-2-8mm-acusense-fixed-turret-network-camera-8mp-3840x2160-ds-2cd2383g2-iu-28/pd/DMBXB5MBM/", 5,
     "Seria Pro AcuSense, senzor 1/2.8\", unghi 107°. Varianta DS-2CD2383G2-IUB2 apare la 819,17 lei. Firmware și ISAPI documentate — snapshot JPEG simplu de tras de pe server."),
    ("Recomandat", "Uniview", "IPC3235SB-ADZK-I0", "Dome (motorizat)", "2880×1620 @25 fps", 5, '1/2.7"', "2.7–13.5", "98.3–31.4", "120 dB (real)",
     "Ultra 265 / H.265 / H.264 / MJPEG", "Da / Da", "PoE 802.3af", "Microfon integrat — verifică / dezactivează", 878.99, "eMAG",
     f"{EMAG}/search/IPC3235SB-ADZK-I0", 5,
     "LightHunter (lumină slabă foarte bună) + zoom motorizat: încadrezi exact coada din browser după montaj, fără să urci pe scară. Dome IK10, se poate monta pe tavan."),
    ("Bun", "Hikvision", "DS-2CD2143G2-IU (2.8mm)", "Dome", "2688×1520 @30 fps", 4, '1/3"', "2.8", "103", "120 dB (real)",
     "H.265+ / H.265 / H.264", "Da / Da (ONVIF S, G, T)", "PoE 802.3af", "Da — se dezactivează", 435.60, "eMAG",
     f"{EMAG}/camera-cu-microfon-hikvision-poe-ip67-4mp-alb-ds-2cd2143g2-iu-2-8mm/pd/D36QPLMBM/", 4,
     "Modelul din docs/23. Suficient dacă coada are sub ~6 m. Alte oferte: de la 603,19 lei pe compari.ro; varianta -IS la Rovision 823,99 lei."),
    ("Bun", "Hikvision", "DS-2CD2743G2-IZS", "Dome (motorizat)", "2688×1520 @30 fps", 4, '1/3"', "2.8–12", "95.8–29.2", "120 dB (real)",
     "H.265+ / H.265 / H.264", "Da / Da (ONVIF S, G, T)", "PoE 802.3af", "Nu (doar intrare audio)", 1228.55, "eMAG",
     f"{EMAG}/camera-ip-acusense-rezolutie-4-0-mp-lentila-2-8-12mm-ir-40m-sdcard-ik10-hikvision-2-8-12mm-ds-2cd2743g2-izs/pd/D4DRNXYBM/", 4,
     "Zoom motorizat 2.8–12 mm: bun dacă singurul loc de montaj e departe de coadă. Fără microfon — un argument în plus pentru DPO."),
    ("Bun", "Uniview", "IPC3534LB-ADZK-H", "Dome (motorizat)", "2560×1440 @30 fps", 4, '1/3"', "2.8–12", "86.3–35.2", "120 dB (real)",
     "Ultra 265 / H.265 / H.264", "Da / Da", "PoE 802.3af", "Verifică în fișă", 449.99, "eMAG",
     f"{EMAG}/camera-de-supraveghere-uniview-vf-4mp-dome-lentila-varifocala-2-8-12mm-infrarosu-pana-la-40m-stocare-microsd-pana-la-512-ip-67-vandal-ik10-alb-ipc3534lb-adzk-h/pd/DFH04L2BM/", 4,
     "Cea mai ieftină cameră cu zoom motorizat și WDR real găsită. Alternativă de buget la Hikvision DS-2CD2743G2-IZS."),
    ("Bun", "Dahua", "IPC-HDBW2441E-S-0280B", "Dome (IK10)", "2688×1520 @30 fps", 4, '1/2.9"', "2.8", "102", "120 dB (real)",
     "H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 697.61, "eMAG",
     f"{EMAG}/camera-supraveghere-dahua-ip-4mp-ir-30m-wizsense-smd-card-poe-lentila-2-8mm-ik10-ipc-hdbw2441e-s-0280b/pd/D65VF5YBM/", 4,
     "WizSense seria 2, dome anti-vandal. Snapshot pe /cgi-bin/snapshot.cgi, RTSP standard."),
    ("Bun", "Reolink", "RLC-833A", "Turret (zoom optic 3×)", "3840×2160 @25 fps", 8, '1/2.8"', "2.8–8", "94–50", "HDR (de verificat în contralumină)",
     "H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 725.33, "eMAG",
     f"{EMAG}/camera-de-supraveghere-reolink-rlc-833a-cu-inteligenta-artificiala-detectare-persoana-vehicul-zoom-optic-3x-rezolutie-de-8mp-4k-rlc-833a/pd/DBD5J6MBM/", 4,
     "4K cu zoom optic la preț mic. Reolink e mai puțin configurabil decât Hikvision/Uniview (GOP, bitrate), dar RTSP și ONVIF merg."),
    ("Premium", "Axis", "M3086-V (02374-001)", "Mini dome interior", "2688×1512 @30 fps", 4, '1/2.7" RGB', "2.4", "130", "WDR Axis (de verificat dB)",
     "H.265 / H.264 + Zipstream", "Da / Da (ONVIF S, G, T)", "PoE 802.3af", "Nu", 1705.16, "compari.ro (preț minim)",
     "https://www.compari.ro/camere-de-supraveghere-c3871/axis-communications/m3086-v-2-4mm-02374-001-p954784317/", 4,
     "Producător suedez, firmware cu actualizări lungi și fără cloud — cel mai ușor de apărat în fața IT UB și a DPO. Unghi foarte larg (130°). Pe eMAG 3.684,30 lei, stoc epuizat."),
    ("Buget", "Reolink", "RLC-810A", "Bullet", "3840×2160 @25 fps", 8, '1/2.49"', "4", "87", "HDR (de verificat)",
     "H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 503.99, "eMAG",
     f"{EMAG}/camera-de-supraveghere-reolink-rlc-810a-cu-inteligenta-artificiala-detectare-persoana-vehicul-rezolutie-de-8mp-4k-avertizare-miscare-rlc-810a/pd/D5DWQ7MBM/", 3,
     "Aceeași imagine ca RLC-820A (dome), mult mai ieftin. Bullet: se montează pe perete, nu pe tavan."),
    ("Buget", "Reolink", "RLC-820A", "Dome", "3840×2160 @25 fps", 8, '1/2.49"', "4", "87", "HDR (de verificat)",
     "H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 1336.04, "eMAG (marketplace)",
     f"{EMAG}/camera-de-supraveghere-reolink-rlc-820a-cu-inteligenta-artificiala-detectare-persoana-vehicul-rezolutie-8mp-4k-notificare-pe-telef-rlc-820a/pd/D1Z01TMBM/", 3,
     "Senzor mare (1/2.49\"), dar pe eMAG e scump (1.336–1.638 lei). Merită doar dacă apare sub ~600 lei."),
    ("Buget", "Reolink", "RLC-520A", "Dome", "2560×1920 @30 fps", 5, '1/2.7"', "4", "80", "Fără WDR real",
     "H.264 (H.265 — verifică firmware)", "Da / Da (ONVIF T)", "PoE 802.3af", "Da — se dezactivează", 285.50, "eMAG",
     f"{EMAG}/camera-de-supraveghere-reolink-rlc-520a-cu-inteligenta-artificiala-detectare-persoana-vehicul-rezolutie-5mp-notificare-pe-telefon-rlc-520a/pd/DLS3XTMBM/", 3,
     "Opțiunea B din docs/23. Unghi îngust (80°) — bun dacă se montează în capătul cozii. Fără WDR real: slabă spre ferestre."),
    ("Buget", "Dahua", "IPC-HDW1839T-A-IL-0280B-S6", "Turret (iluminare duală)", "3840×2160", 8, "de verificat", "2.8", "de verificat", "DWDR (digital) — de verificat",
     "H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 517.79, "eMAG",
     f"{EMAG}/search/IPC-HDW1839T-A-IL", 3,
     "Cea mai ieftină cameră 8 MP de la un brand profesional găsită. Seria Lite: probabil fără WDR real — testează în contralumină."),
    ("Buget", "TP-Link", "VIGI C340 (2.8mm)", "Bullet", "2560×1440", 4, '1/3"', "2.8", "102", "DWDR (digital)",
     "H.265+ / H.265 / H.264", "Da / Da", "PoE 802.3af", "Da — se dezactivează", 241.52, "eMAG",
     f"{EMAG}/camera-de-supraveghere-tp-link-4mp-hd-poe-detectare-inteligenta-full-color-night-vision-microfon-integrat-suport-onvif-ip66-control-de-la-distanta-vigi-c340-2-8mm/pd/D2MVYXYBM/", 2,
     "Ieftin și ușor de configurat. DWDR digital: ferestrele din spatele cozii pot ascunde oamenii în siluetă."),
    ("Buget", "TP-Link", "VIGI C230I Mini (2.8mm)", "Mini dome interior", "2304×1296", 3, '1/2.8"', "2.8", "de verificat", "de verificat",
     "H.265+ / H.265 / H.264", "Da / Da", "PoE 802.3af", "de verificat", 213.72, "eMAG",
     f"{EMAG}/camera-de-retea-tp-link-vigi-3mp-dom-pentru-interior-vigi-c230i-mini-2-8-mm-cmos-de-scanare-progresiva-1-2-8-o-vigi-c230i-mini-2-8mm/pd/D4FXQXYBM/", 2,
     "Mică și discretă, pentru interior. Doar 3 MP: suficient pentru o coadă scurtă și apropiată."),
    ("Buget", "HiLook (Hikvision)", "IPC-D141H-C", "Dome interior (plastic)", "2560×1440", 4, "de verificat", "2.8", "de verificat", "DWDR (digital)",
     "H.265+ / H.264", "Da / Da", "PoE 802.3af", "Nu", 153.66, "eMAG",
     f"{EMAG}/camera-supraveghere-ip-hilook-4mp-lentila-fixa-2-8-mm-ir-20m-dome-poe-h-265-dwdr-carcasa-plastic-camera-de-supraveghere-interior-ipc-d141h-c/pd/D9QL8X3BM/", 2,
     "Cea mai ieftină cameră PoE cu RTSP găsită. Bună ca a doua cameră de test sau pentru probe de unghi."),
    ("Doar test", "TP-Link", "Tapo C120", "Cameră Wi-Fi", "2560×1440", 4, "de verificat", "de verificat", "de verificat", "de verificat",
     "H.264", "Da (cont cameră) / Da", "Wi-Fi 2.4 GHz + alimentator", "Da — se dezactivează", 289.99, "eMAG",
     f"{EMAG}/search/tapo%20c120", 1,
     "Wi-Fi-ul din cantină e slab (docs/06): nu pentru producție. Utilă o zi, pentru o probă de unghi și de model înainte de achiziție."),
]

ACCESSORIES = [
    ("Injector PoE", "TP-Link TL-PoE150S", "802.3af, 15,4 W, gigabit", 1, 100.42, f"{EMAG}/poe-injector-tp-link-tl-poe150s/pd/EHDXKBBBM/",
     "O cameră, un cablu, lângă o priză. Cea mai simplă variantă."),
    ("Switch PoE", "TP-Link LS106P", "6 porturi, 4 PoE+, 65 W", 0, 137.38, f"{EMAG}/switch-tp-link-6-porturi-rj45-4-porturi-poe-65-w/pd/D2ZYGG3BM/",
     "Dacă se pun două camere sau tableta chioșcului pe cablu."),
    ("Switch PoE", "TP-Link TL-SG1005P", "5 porturi gigabit, 4 PoE, 65 W", 0, 247.79, f"{EMAG}/switch-tp-link-cu-5-porturi-gigabit-4-porturi-poe-tl-sg1005p/pd/D1JBN1BBM/",
     "Varianta clasică, foarte bine evaluată (4,7/5)."),
    ("Cablu", "Lanberg CAT6 FTP 30 m (PCF6-10CC-3000-B)", "CAT6, ecranat, mufat", 1, 60.83,
     f"{EMAG}/cablu-ecranat-ftp-lanberg-42798-cat-6-mufat-2xrj45-lungime-30m-awg-26-250-mhz-de-legatura-retea-ethernet-albastru-albastru-30-m-pcf6-10cc-3000-b/pd/DD50HYMBM/",
     "Verifică la cumpărare: conductor din cupru integral, nu CCA (cupru-aluminiu), pentru PoE."),
    ("Cablu", "Spacer S/FTP CAT6 30 m", "CAT6, dublu ecranat", 0, 61.69, f"{EMAG}/patch-cord-spacer-s-ftp-cat6-30m-alb-sppc-sftp-cat6-30m/pd/D2Z7HZYBM/",
     "Alternativă, același preț."),
    ("Cablu (rolă)", "Extralink CAT6 F/UTP 305 m", "Cupru AWG23, pentru montaj pe traseu", 0, 999.99,
     f"{EMAG}/cablu-de-retea-cat6-ftp-f-utp-extralink-305m-exterior-conductor-cupru-awg23-izolatie-pe-hdpe-negru-rezistenta-la-interferente-fast-gigabit-ethernet-instalare-profesionala-dnxfmporermnhmv2/pd/D3ZJ053BM/",
     "Doar dacă traseul trebuie tras prin pereți de un electrician (atunci și mufe RJ45 + clește)."),
]

thin = Side(style="thin", color="DCE1E7")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
H_FONT = Font(bold=True, color="FFFFFF", name="Arial", size=10)
H_FILL = PatternFill("solid", fgColor=ACCENT)
BODY = Font(name="Arial", size=10, color=INK)
MUTED_FONT = Font(name="Arial", size=9, color=MUTED, italic=True)
WRAP = Alignment(wrap_text=True, vertical="top")
LEI = '#,##0.00" lei"'


def header(ws, row, titles, widths):
    for i, (t, w) in enumerate(zip(titles, widths), start=1):
        c = ws.cell(row=row, column=i, value=t)
        c.font, c.fill, c.alignment, c.border = H_FONT, H_FILL, Alignment(wrap_text=True, vertical="center"), BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 32


def title(ws, text, sub=None):
    ws["A1"] = text
    ws["A1"].font = Font(name="Arial", size=16, bold=True, color=INK)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = MUTED_FONT


wb = Workbook()

# ── Rezumat ─────────────────────────────────────────────────────────────────────────────
ws = wb.active
ws.title = "Rezumat"
title(ws, "UBite — camere pentru coada cantinei, piața din România", f"Prețuri verificate pe {CHECKED} (eMAG, compari.ro, Rovision). Prețurile de marketplace variază — reverifică înainte de comandă.")
ws.column_dimensions["A"].width = 30
ws.column_dimensions["B"].width = 110
rows = [
    ("Cum lucrăm", "Camera doar filmează. Serverul UB (VM-ul ACC-UB) ia imaginea, rulează detecția de persoane și păstrează doar un număr (docs/07, docs/11). Nicio imagine nu se salvează."),
    ("Ce contează la cameră", "Imagine de calitate la cadență mică: rezoluție 4–8 MP, WDR real 120 dB (ferestre în spatele cozii), senzor mare pentru lumină slabă, RTSP + ONVIF (Profile S) și snapshot JPEG, H.265, alimentare PoE, cadență setabilă la 1–5 fps."),
    ("Ce NU mai contează", "Numărarea în firmware (opțiunea A din docs/23) nu mai e necesară — procesarea e pe server. Nici NVR, nici card, nici aplicații cloud."),
    ("Recomandarea 1", "Uniview IPC3618LE-ADF28K-G — 8 MP, WDR 120 dB, ~452 lei. Cel mai bun raport calitate/preț."),
    ("Recomandarea 2", "Hikvision DS-2CD2383G2-IU — 8 MP, senzor 1/2.8\", 107°, ~820–940 lei. Seria Pro, cea mai bine documentată pentru integrare."),
    ("Dacă montajul e departe de coadă", "Uniview IPC3235SB-ADZK-I0 (5 MP, zoom motorizat, lumină slabă foarte bună, ~879 lei) sau varianta ieftină IPC3534LB-ADZK-H (~450 lei)."),
    ("Dacă IT UB cere un brand european", "Axis M3086-V — de la ~1.705 lei. Firmware fără cloud, actualizări pe termen lung."),
    ("Cost total, o cameră", "Vezi foaia „Scenarii”: de la ~447 lei (test) la ~1.866 lei (premium), cu injector PoE și 30 m de cablu."),
    ("Rețea — de lămurit înainte de comandă", "Camera trebuie să fie pe un cablu (nu Wi-Fi) și să poată fi accesată de pe VM-ul UB: aceeași rețea UB sau o regulă de firewall/VPN (întrebarea C5 din docs/17). Vezi foaia „Rețea și întrebări”."),
    ("Cine cumpără", "DCCAS (docs/14, docs/17 B1). Trimite-le foaia „Camere” cu recomandările marcate."),
]
for i, (k, v) in enumerate(rows, start=4):
    ws.cell(row=i, column=1, value=k).font = Font(name="Arial", size=10, bold=True, color=INK)
    c = ws.cell(row=i, column=2, value=v)
    c.font, c.alignment = BODY, WRAP
    ws.cell(row=i, column=1).alignment = WRAP
    ws.row_dimensions[i].height = 30 if len(v) < 110 else 44

# ── Camere ──────────────────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Camere")
title(ws, "Camere IP disponibile în România", f"Verificat {CHECKED}. „Potrivire” = cât de bine servește coada cantinei cu procesare pe server (1–5).")
cols = ["#", "Nivel", "Brand", "Model", "Formă", "Rezoluție max", "MP", "Senzor", "Obiectiv (mm)", "Unghi orizontal (°)",
        "WDR", "Codec", "RTSP / ONVIF", "Alimentare", "Microfon", "Preț găsit (lei, cu TVA)", "Unde", "Link", "Potrivire (1–5)",
        "Lei / MP", "Note"]
widths = [4, 12, 12, 26, 18, 18, 5, 11, 11, 11, 18, 22, 18, 14, 20, 14, 16, 12, 10, 9, 70]
header(ws, 4, cols, widths)
for n, cam in enumerate(CAMERAS, start=1):
    r = 4 + n
    tier, brand, model, form, res, mp, sensor, lens, hfov, wdr, codec, proto, power, mic, price, shop, url, fit, note = cam
    values = [n, tier, brand, model, form, res, mp, sensor, lens, hfov, wdr, codec, proto, power, mic, price, shop, "deschide", fit,
              f"=P{r}/G{r}", note]
    for c, v in enumerate(values, start=1):
        cell = ws.cell(row=r, column=c, value=v)
        cell.font, cell.alignment, cell.border = BODY, WRAP, BORDER
        cell.fill = PatternFill("solid", fgColor=TIER_FILL[tier])
    ws.cell(row=r, column=16).number_format = LEI
    ws.cell(row=r, column=20).number_format = '#,##0" lei"'
    link = ws.cell(row=r, column=18)
    link.hyperlink = url
    link.font = Font(name="Arial", size=10, color=ACCENT, underline="single")
    ws.row_dimensions[r].height = 58
last = 4 + len(CAMERAS)
ws.freeze_panes = "E5"
ws.auto_filter.ref = f"A4:U{last}"
ws.conditional_formatting.add(f"S5:S{last}", CellIsRule(operator="greaterThanOrEqual", formula=["5"], font=Font(bold=True, color="0B6B52")))
ws.conditional_formatting.add(f"S5:S{last}", CellIsRule(operator="lessThanOrEqual", formula=["2"], font=Font(bold=True, color="A83A1E")))
legend = last + 2
ws.cell(row=legend, column=2, value="Legendă").font = Font(name="Arial", size=10, bold=True)
for i, (t, fill) in enumerate(TIER_FILL.items()):
    c = ws.cell(row=legend + 1 + i, column=2, value=t)
    c.fill, c.font, c.border = PatternFill("solid", fgColor=fill), BODY, BORDER
ws.cell(row=legend + 7, column=2, value="„de verificat” = nu apare în sursele consultate; cere fișa tehnică vânzătorului.").font = MUTED_FONT

# ── Accesorii ───────────────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Accesorii")
title(ws, "Accesorii pentru o cameră pe cablu", "Nu e nevoie de NVR sau card: serverul trage imaginea direct din cameră.")
header(ws, 4, ["Tip", "Produs", "Detalii", "Buc. în scenariu", "Preț (lei)", "Link", "Note"], [14, 36, 30, 10, 12, 10, 70])
for i, (kind, name, det, qty, price, url, note) in enumerate(ACCESSORIES, start=5):
    for c, v in enumerate([kind, name, det, qty, price, "deschide", note], start=1):
        cell = ws.cell(row=i, column=c, value=v)
        cell.font, cell.alignment, cell.border = BODY, WRAP, BORDER
    ws.cell(row=i, column=5).number_format = LEI
    ws.cell(row=i, column=6).hyperlink = url
    ws.cell(row=i, column=6).font = Font(name="Arial", size=10, color=ACCENT, underline="single")
    ws.row_dimensions[i].height = 32
acc_last = 4 + len(ACCESSORIES)
ws.cell(row=acc_last + 2, column=4, value="Total accesorii (scenariu)").font = Font(name="Arial", size=10, bold=True)
tot = ws.cell(row=acc_last + 2, column=5, value=f"=SUMPRODUCT(D5:D{acc_last},E5:E{acc_last})")
tot.number_format, tot.font = LEI, Font(name="Arial", size=10, bold=True)
ws.cell(row=acc_last + 4, column=1, value="Montaj: suport/doză de joncțiune de la același producător (de cotat la vânzător), diblu și șuruburi. Permisiunea de montaj: DCCAS, în scris (docs/17 B4).").font = MUTED_FONT
ACC_TOTAL = f"Accesorii!E{acc_last + 2}"

# ── Scenarii ────────────────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Scenarii")
title(ws, "Scenarii de cost — o cameră", "Prețurile se iau automat din foaia „Camere”; schimbă modelul în coloana B și totalul se recalculează.")
header(ws, 4, ["Scenariu", "Model (din „Camere”)", "Cameră (lei)", "Accesorii (lei)", "Total (lei)", "De ce"], [26, 30, 14, 14, 14, 70])
scen = [
    ("Recomandat — valoare", "IPC3618LE-ADF28K-G", "8 MP cu WDR real, cel mai mic preț pentru calitatea asta."),
    ("Recomandat — Hikvision Pro", "DS-2CD2383G2-IU (2.8mm)", "Cea mai documentată integrare (ISAPI + ONVIF), senzor 1/2.8\"."),
    ("Încadrare exactă", "IPC3235SB-ADZK-I0", "Zoom motorizat și lumină slabă foarte bună."),
    ("Premium, brand european", "M3086-V (02374-001)", "Pentru o eventuală cerință de securitate a IT UB."),
    ("Test ieftin", "RLC-520A", "O cameră de probă pentru unghi și model, înainte de achiziția finală."),
]
for i, (name, model, why) in enumerate(scen, start=5):
    ws.cell(row=i, column=1, value=name)
    ws.cell(row=i, column=2, value=model)
    ws.cell(row=i, column=3, value=f'=IFERROR(VLOOKUP(B{i},Camere!$D$5:$P${last},13,FALSE),"model negăsit")')
    ws.cell(row=i, column=4, value=f"={ACC_TOTAL}")
    ws.cell(row=i, column=5, value=f"=IFERROR(C{i}+D{i},\"\")")
    ws.cell(row=i, column=6, value=why)
    for c in range(1, 7):
        cell = ws.cell(row=i, column=c)
        cell.font, cell.alignment, cell.border = BODY, WRAP, BORDER
    for c in (3, 4, 5):
        ws.cell(row=i, column=c).number_format = LEI
    ws.cell(row=i, column=5).font = Font(name="Arial", size=10, bold=True)
    ws.row_dimensions[i].height = 30

# ── Flux spre server ────────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Flux spre server")
title(ws, "Cât trafic trimite camera spre serverul UB", "Estimări — modifică celulele galbene. Măsoară pe camera reală (interfața camerei arată bitrate-ul).")
inputs = [
    ("Ore de funcționare pe săptămână", 27.5, "L–V 11:30–17:00 (docs/20)"),
    ("Săptămâni pe lună", 4.33, ""),
    ("Coeficient H.265 (Mbps per MP per fps)", 0.06, "~0,04 la 25 fps; mai mare la cadență mică, unde cadrele cheie cântăresc mai mult"),
    ("JPEG — KB per MP (calitate înaltă)", 90, "4 MP ≈ 350 KB, 8 MP ≈ 700 KB"),
]
ws.column_dimensions["A"].width = 40
for c, w in zip("BCDEFG", [14, 14, 14, 16, 16, 50]):
    ws.column_dimensions[c].width = w
for i, (k, v, note) in enumerate(inputs, start=4):
    ws.cell(row=i, column=1, value=k).font = BODY
    cell = ws.cell(row=i, column=2, value=v)
    cell.fill, cell.font, cell.border = PatternFill("solid", fgColor="FFF6CC"), Font(name="Arial", size=10, bold=True), BORDER
    ws.cell(row=i, column=3, value=note).font = MUTED_FONT
HOURS, WEEKS, K, JPEG = "$B$4", "$B$5", "$B$6", "$B$7"

ws.cell(row=10, column=1, value="Varianta 1 — flux RTSP continuu la cadență mică").font = Font(name="Arial", size=11, bold=True)
header_row = 11
for c, t in enumerate(["Rezoluție", "MP", "fps", "Mbps (estimat)", "GB / lună", "Observații"], start=1):
    cell = ws.cell(row=header_row, column=c, value=t)
    cell.font, cell.fill, cell.border = H_FONT, H_FILL, BORDER
rtsp = [("4 MP (2688×1520)", 4, 2), ("4 MP (2688×1520)", 4, 5), ("5 MP (2880×1620)", 5, 2), ("8 MP (3840×2160)", 8, 1),
        ("8 MP (3840×2160)", 8, 2), ("8 MP (3840×2160)", 8, 5)]
for i, (label, mp, fps) in enumerate(rtsp, start=header_row + 1):
    ws.cell(row=i, column=1, value=label)
    ws.cell(row=i, column=2, value=mp)
    ws.cell(row=i, column=3, value=fps)
    ws.cell(row=i, column=4, value=f"=B{i}*C{i}*{K}").number_format = "0.00"
    ws.cell(row=i, column=5, value=f"=D{i}*3600*{HOURS}*{WEEKS}/8/1000").number_format = "0.0"
    ws.cell(row=i, column=6, value="Setează în cameră: cadență = fps, GOP = 2 × fps, bitrate variabil, calitate înaltă.")
    for c in range(1, 7):
        ws.cell(row=i, column=c).border = BORDER
        ws.cell(row=i, column=c).font = BODY
r0 = header_row + len(rtsp) + 2
ws.cell(row=r0, column=1, value="Varianta 2 — o fotografie JPEG la câteva secunde (recomandat)").font = Font(name="Arial", size=11, bold=True)
for c, t in enumerate(["Rezoluție", "MP", "Interval (s)", "Mbps (medie)", "GB / lună", "Observații"], start=1):
    cell = ws.cell(row=r0 + 1, column=c, value=t)
    cell.font, cell.fill, cell.border = H_FONT, H_FILL, BORDER
snap = [("4 MP", 4, 5), ("8 MP", 8, 5), ("8 MP", 8, 2)]
for i, (label, mp, sec) in enumerate(snap, start=r0 + 2):
    ws.cell(row=i, column=1, value=label)
    ws.cell(row=i, column=2, value=mp)
    ws.cell(row=i, column=3, value=sec)
    ws.cell(row=i, column=4, value=f"=B{i}*{JPEG}*8/1000/C{i}").number_format = "0.00"
    ws.cell(row=i, column=5, value=f"=D{i}*3600*{HOURS}*{WEEKS}/8/1000").number_format = "0.0"
    ws.cell(row=i, column=6, value="Imagine completă la calitate maximă, fără artefacte de compresie video; serverul cere cadrul exact când îl procesează.")
    for c in range(1, 7):
        ws.cell(row=i, column=c).border = BORDER
        ws.cell(row=i, column=c).font = BODY
tip = r0 + 2 + len(snap) + 1
notes = [
    "Snapshot: Hikvision /ISAPI/Streaming/channels/101/picture · Dahua /cgi-bin/snapshot.cgi · Uniview și Axis prin ONVIF GetSnapshotUri · Reolink /cgi-bin/api.cgi?cmd=Snap.",
    "services/vision (bench.py watch) citește deja RTSP; varianta cu snapshot e o schimbare mică dacă aleg-o după test.",
    "Procesare pe VM (docs/23): yolo11n la 640 px ≈ 40 ms pe 2 vCPU; la 1280 px (utile pentru 8 MP) ≈ 4× mai mult, tot sub o secundă pe cadru — suficient pentru un cadru la 2–5 s.",
]
for i, t in enumerate(notes):
    c = ws.cell(row=tip + i, column=1, value=t)
    c.font = MUTED_FONT

# ── Rețea și întrebări ──────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Rețea și întrebări")
title(ws, "Ce trebuie lămurit înainte de comandă")
ws.column_dimensions["A"].width = 6
ws.column_dimensions["B"].width = 26
ws.column_dimensions["C"].width = 100
qs = [
    ("IT UB / ACC-UB", "Poate VM-ul UB să acceseze o cameră din rețeaua cantinei (RTSP port 554, HTTP 80)? Aceeași rețea, VLAN sau VPN? (docs/17 C5)"),
    ("IT UB / ACC-UB", "Există restricții de brand pentru echipamente conectate la rețeaua UB? (unele instituții publice din UE limitează Hikvision/Dahua)"),
    ("IT UB / ACC-UB", "Camera primește IP fix sau rezervare DHCP? Cine ține parola de administrare?"),
    ("DCCAS", "Cumpără DCCAS camera, cu ce dată și la ce preț maxim? (docs/17 B1)"),
    ("DCCAS", "Permisiune scrisă de montaj pe perete/tavan, lângă coadă (docs/17 B4). Există priză sau un port de rețea acolo?"),
    ("Vizită în cantină", "Fotografie din poziția camerei, înălțimea tavanului, lungimea cozii la vârf (docs/20). Decide obiectivul: 2.8 mm fix sau zoom motorizat."),
    ("DPO", "Aprobarea DPIA înainte de pornire: microfon dezactivat, zona limitată la coadă, fără stocare de imagini (docs/11)."),
    ("Echipa", "Setări la montaj: parolă nouă, firmware la zi, microfon oprit, cloud/P2P oprit, UPnP oprit, NTP pe ora României, un singur cont doar-citire pentru server."),
]
header(ws, 3, ["#", "Pentru", "Întrebare / pas"], [6, 26, 100])
for i, (who, q) in enumerate(qs, start=4):
    for c, v in enumerate([i - 3, who, q], start=1):
        cell = ws.cell(row=i, column=c, value=v)
        cell.font, cell.alignment, cell.border = BODY, WRAP, BORDER
    ws.row_dimensions[i].height = 30

# ── Surse ───────────────────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Surse")
title(ws, "Surse", f"Consultate pe {CHECKED}")
ws.column_dimensions["A"].width = 40
ws.column_dimensions["B"].width = 110
sources = [
    ("eMAG — căutări și pagini de produs", "https://www.emag.ro"),
    ("compari.ro — Axis M3086-V", "https://www.compari.ro/camere-de-supraveghere-c3871/axis-communications/m3086-v-2-4mm-02374-001-p954784317/"),
    ("compari.ro — Hikvision DS-2CD2143G2-IU", "https://camera-ip.compari.ro/hikvision/ds-2cd2143g2-iu-2-8mm-p635289147/"),
    ("Rovision — Hikvision DS-2CD2143G2-IS", "https://rovision.ro/produs/camera-supraveghere-ip-acusense-4mp-ir-30m-lentila-2-8mm-card-hikvision-ds-2cd2143g2-is28/"),
    ("Fișă Hikvision DS-2CD2383G2-I(U)", "https://blvs.com/content/downloads/Datasheet-for-DS-2CD2383G2-IU.pdf"),
    ("Fișă Hikvision DS-2CD2743G2-IZS", "https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000003/S000000025/OFR000038/M000037856/Data_Sheet/DS-2CD2743G2-IZS_Datasheet_V5.5.102_20200923.pdf"),
    ("Fișă Uniview IPC3618LE-ADF28(40)K-G", "https://global.uniview.com/fr/Products/Cameras/Easy/IPC3618LE-ADF28(40)K-G/"),
    ("Fișă Uniview IPC3534LB-ADZK-H", "https://www.uniview.com/Products/Network_Cameras/Easy_Series/EasyBasic_Series/IPC3534LB-ADZK-H/"),
    ("Fișă Uniview IPC3235SB-ADZK-I0", "https://global.uniview.com/Products/Network_Cameras/Prime_Series/PRIMEI_Series/IPC3235SB-ADZK-I0/"),
    ("Fișă Dahua IPC-HDBW2441E-S", "https://www.dahuasecurity.com/products/network-products/network-cameras/WizSense-Series/2-Series/IR/IPC-HDBW2441E-S"),
    ("Fișă Dahua IPC-HDW2441T-S", "https://www.dahuasecurity.com/mena/products/All-Products/Network-Cameras/WizSense-2-Series/IR/IPC-HDW2441T-S"),
    ("Fișă Reolink RLC-520A", "https://cdn.reolink.com/files/docs/specs/RLC-520A-IP-Camera-Specifications.pdf"),
    ("Fișă Reolink RLC-820A", "https://reolink.com/product/rlc-820a/"),
    ("Fișă Reolink RLC-833A", "https://reolink.com/product/rlc-833a/"),
    ("Fișă TP-Link VIGI C340", "https://www.tp-link.com/us/business-networking/vigi-network-camera/vigi-c340/"),
    ("UBite docs/23 — cercetare camere, benchmark CPU", "docs/23-camera-research.md"),
]
header(ws, 3, ["Ce", "Link"], [40, 110])
for i, (k, url) in enumerate(sources, start=4):
    ws.cell(row=i, column=1, value=k).font = BODY
    c = ws.cell(row=i, column=2, value=url)
    if url.startswith("http"):
        c.hyperlink = url
        c.font = Font(name="Arial", size=10, color=ACCENT, underline="single")
    else:
        c.font = BODY

for sheet in wb.worksheets:
    sheet.sheet_view.showGridLines = False
wb.active = 0
OUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUT)
print(OUT)
