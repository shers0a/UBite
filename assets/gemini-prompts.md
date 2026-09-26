# Prompturi pentru Gemini: ilustrații și animații în stilul UBite

Stilul e deja stabilit de ce am generat pe 22 septembrie: personaje desenate cu pensula, o singură
cerneală; doodle-uri; pictograme cu contur și o singură culoare; scene plate în paleta UBite. Aici
e ce mai lipsește și ce nu am putut face gratis azi: **8 imagini** (Nano Banana) și **4 animații**
(Veo). Logo-ul nu apare aici, pentru că e desenat din geometrie în cod.

## Cum lucrezi

1. Stilul e **blocat** (aprobat pe 22 septembrie). Referințele oficiale sunt planșele din
   `assets/style/`; cele pentru animații sunt în `assets/_raw/gemini/ref/`. Unde scrie **Încarcă**,
   pune fișierul în Gemini împreună cu promptul. Ce iese diferit de planșe se aruncă.
2. Salvează rezultatul în `assets/_raw/gemini/` cu **exact numele de la „Salvează ca”**.
3. Spune-mi „am pus fișierele de la Gemini”. Eu le vectorizez (personajele devin SVG care își iau
   culoarea din temă), tai scenele pe paleta UBite, adaug doodle-urile în tapet, fac animațiile
   să se lege în buclă, le trec în manifest și le pun în pagini.

Promptul e în engleză, pentru că modelele țin mai strict stilul așa. Regenerează dacă vezi text
sau litere, degete în plus, umbre ori degradeuri, sau culori în afara paletei.

---

## Imagini (Nano Banana): 8

Setări: **1:1**, dacă nu scrie altfel.

### I1 · Personaj: cantina e închisă

Unde apare: starea „Închis” (după 17:00 și în weekend).
**Încarcă:** `assets/style/characters.png` · **Salvează ca:** `spot-nap.png`

```
Draw one new character in exactly the same hand as the reference sheet of six characters: bold, expressive
brush-pen ink drawing in solid black on a plain flat white background, confident
thick-and-thin outlines, simple rounded shapes, long bendy limbs, slightly oversized hands and
shoes, hair and shoes filled solid black, everything else white inside the outlines. No
shading, no grey, no texture, no text, no letters.
The character: a university student asleep at a canteen table, head resting on folded arms,
an empty canteen tray pushed to one side, three small curls floating above the head to show
sleep. The whole figure and table fully in frame with generous white space around them.
```

### I2 · Personaj: fără internet

Unde apare: starea offline.
**Încarcă:** `assets/style/characters.png` · **Salvează ca:** `spot-offline.png`

```
Draw one new character in exactly the same hand as the reference sheet of six characters: bold, expressive
brush-pen ink drawing in solid black on a plain flat white background, confident
thick-and-thin outlines, simple rounded shapes, long bendy limbs, slightly oversized hands and
shoes, hair and shoes filled solid black, everything else white inside the outlines. No
shading, no grey, no texture, no text, no letters.
The character: a student standing on tiptoe holding a smartphone high above the head with one
arm, searching for a signal, a puzzled but good-humoured face, three short curved lines
beside the phone. The whole figure fully in frame with generous white space around it.
```

### I3 · Personaj: fidelitate

Unde apare: a cincea vizită, cardul de fidelitate.
**Încarcă:** `assets/style/characters.png` · **Salvează ca:** `spot-reward.png`

```
Draw one new character in exactly the same hand as the reference sheet of six characters: bold, expressive
brush-pen ink drawing in solid black on a plain flat white background, confident
thick-and-thin outlines, simple rounded shapes, long bendy limbs, slightly oversized hands and
shoes, hair and shoes filled solid black, everything else white inside the outlines. No
shading, no grey, no texture, no text, no letters.
The character: a delighted student holding up a small plate with a round doughnut topped with
cream, eyes closed in a big smile, a few small four-pointed sparkles around the plate. The
whole figure fully in frame with generous white space around it.
```

### I4 · Personaj: casiera

Unde apare: ecranul „Adaugă o vizită” (bonul), bucla kioskului.
**Încarcă:** `assets/style/characters.png` · **Salvează ca:** `spot-cashier.png`

```
Draw one new character in exactly the same hand as the reference sheet of six characters: bold, expressive
brush-pen ink drawing in solid black on a plain flat white background, confident
thick-and-thin outlines, simple rounded shapes, long bendy limbs, slightly oversized hands and
shoes, hair filled solid black, everything else white inside the outlines. No shading, no
grey, no texture, no text, no letters, no numbers.
The character: a friendly canteen cashier behind a simple till, handing a long curled paper
receipt across the counter with a warm smile. Fully in frame with generous white space.
```

### I5 · Pictograme: încă patru

Unde apare: categoriile meniului și filtrele.
**Încarcă:** `assets/style/pictograms.png` · **Salvează ca:** `picto-more.png`

```
Draw four more pictograms in exactly the same style as the reference sheet of six: a thick, uniform,
rounded near-black outline, one flat cobalt blue (#1F4FD8) fill on a few areas, the rest
white, simple geometric shapes, the same line weight and size as the reference.
The four: a bowl of salad leaves, a whole fish on an oval plate, three cabbage rolls side by
side, a round pretzel ring. Arrange them in a 2 by 2 grid with very wide white gaps, each well
away from the image edges. Plain white background, no shadows, no gradients, no text.
```

### I6 · Doodle-uri românești pentru tapet

Unde apare: se adaugă în tapetul de pe splash, onboarding și kiosk.
**Încarcă:** `ref-doodles.jpg` · **Salvează ca:** `doodles-ro.png`

```
Draw a new sheet of sixteen doodles in exactly the same style as the reference: simple outline
drawings in one black monoline marker stroke of even medium weight, slightly wobbly like quick
notebook sketches, black lines only on plain white, no fills, no shading, no text, no labels.
The sixteen: a cabbage roll, a grilled sausage roll, a pretzel ring, a sugar-dusted doughnut
with a small ball on top, a round loaf of polenta, a sweet bread loaf with a swirl, a jar of
pickles, a stuffed pepper, a slice of pie, a watermelon slice, two cherries, a steaming tea
cup, a lemon, a boiled egg, a wedge of cheese, a wooden spoon. Scatter them in a loose 4 by 4
grid with wide gaps, none touching another, none touching the edges.
```

### I7 · Scenă plată: telefonul

Unde apare: onboarding, pasul 3.
**Încarcă:** `assets/style/scenes.png` · **Salvează ca:** `flat-phone.png`

```
A new flat vector illustration in exactly the same style and palette as the two reference scenes: simple
geometric shapes, no outlines, only these flat colours — deep cobalt blue (#1F4FD8), pale blue
(#DCE5FB), near-black navy (#11161B), white, and small touches of warm amber (#E0A03A). Solid
flat fills, no gradients, no texture, no shading, crisp edges, wordless, no numbers.
The scene: a large smartphone standing upright whose screen shows three rounded vertical bars
of different heights, next to a canteen tray with a steaming bowl of soup and a glass of
juice, a small potted plant behind. Centred on a plain white background with wide space.
```

### I8 · Scenă plată: sala de mese

Unde apare: pagina de lansare, header-ul pe desktop.
**Încarcă:** `assets/style/scenes.png` · **Salvează ca:** `flat-hall.png` · **Format: 16:9**

```
A new flat vector illustration in exactly the same style and palette as the two reference scenes: simple
geometric shapes, no outlines, only these flat colours — deep cobalt blue (#1F4FD8), pale blue
(#DCE5FB), near-black navy (#11161B), white, and small touches of warm amber (#E0A03A). Solid
flat fills, no gradients, no texture, no shading, crisp edges, wordless.
The scene: a bright university dining hall seen from the side — long tables with simple
chairs, tall windows, pendant lamps, a few simple figures of students sitting and eating, one
carrying a tray. Plain white background around the scene, generous space on all sides.
```

---

## Animații (Veo): 4

Setări: **16:9**, cea mai mare rezoluție. Sunetul îl scot eu. Toate pornesc de la o imagine
de-a noastră, ca să rămână exact desenul din aplicație.

### V1 · Studentul care aleargă, în buclă

Unde apare: bannerul „Sfat pentru marți”, bucla kioskului, pagina de lansare.
**Încarcă:** `ref-banner-run.jpg` · **Salvează ca:** `vid-run.mp4`

```
Animate this drawing as classic 2D hand-drawn animation. The white ink-line student runs in
place in a smooth, bouncy run cycle, legs and arms swinging, the backpack bouncing, the steam
above the bowl curling, the speed lines flickering. The tray stays level. The drawing keeps
its exact style: white brush lines on a perfectly flat cobalt blue background, no shading, no
3D, no new colours. The camera does not move. The background stays flat and still. The run
cycle repeats so the clip loops seamlessly. No text.
```

### V2 · Bucătăreasa care servește

Unde apare: bannerul „Meniul de mâine”.
**Încarcă:** `ref-banner-cook.jpg` · **Salvează ca:** `vid-cook.mp4`

```
Animate this drawing as classic 2D hand-drawn animation. The white ink-line cook lifts the
ladle from the pot and pours soup into the bowl, then dips it again, in a gentle repeating
motion; steam curls up from the pot and the bowl. The drawing keeps its exact style: white
brush lines on a perfectly flat cobalt blue background, no shading, no 3D, no new colours.
The camera does not move. The motion repeats so the clip loops. No text.
```

### V3 · Linia de servire prinde viață

Unde apare: onboarding, pasul 2, și kioskul.
**Încarcă:** `ref-scene-counter-16x9.jpg` · **Salvează ca:** `vid-counter.mp4`

```
Animate this flat vector illustration while keeping it perfectly flat: steam rises in soft
wavy lines from both pots and fades, the pendant lamp sways very slightly, the coloured bars
on the menu board slide in from the left one after another. Only flat colours from the image,
no gradients, no shading, no 3D, no camera movement, no new objects, no text. Calm motion
that can loop.
```

### V4 · Campusul

Unde apare: onboarding, pasul 1, și pagina de lansare.
**Încarcă:** `ref-scene-campus-16x9.jpg` · **Salvează ca:** `vid-campus.mp4`

```
Animate this flat vector illustration while keeping it perfectly flat: the three students walk
towards the building with a gentle bouncing step, the trees sway slightly, a few small birds
cross the sky. Only flat colours from the image, no gradients, no shading, no 3D, no camera
movement, no text. Calm motion that can loop.
```

---

## Ce fac eu după

| Primesc | Devine |
|---|---|
| `spot-*.png` | SVG vectorizat, care își ia culoarea din temă, în `assets/illustrations/spots/` |
| `picto-more.png` | 4 pictograme separate, contur plus accent |
| `doodles-ro.png` | tapet refăcut, cu 48 de obiecte în loc de 32 |
| `flat-*.png` | scene tăiate pe paleta UBite, un strat pe culoare |
| `vid-*.mp4` | buclă fără cusătură, comprimată în mp4 și webm, în `assets/motion/` |

Pozele de mâncare au fost doar înlocuitori până vin pozele reale de la cantină. Prompturile
vechi pentru ele nu mai sunt prioritare.
