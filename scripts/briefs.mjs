/* Every generated asset UBite uses, as a brief: which preset, what subject, how many seeds.
   Run them all with `node scripts/asset.mjs batch` (already-generated seeds are skipped), or a
   subset with `--only dish-`. Subjects describe Romanian dishes concretely because the model
   does not know them by name. Seeds are fixed so a re-run reproduces the same candidates. */

const dish = (slug, subject) => ({ slug: `dish-${slug}`, style: 'food', subject, n: 2 });
const cut = (slug, subject) => ({ slug: `cut-${slug}`, style: 'cutout', subject, n: 2 });
const line = (slug, subject) => ({ slug: `ill-${slug}`, style: 'line', subject, n: 2 });
const mark = (slug, subject) => ({ slug: `mark-${slug}`, style: 'mark', subject, n: 2 });

export const BRIEFS = [
  /* Today's menu — the ten dishes in the student-app kit. */
  dish('ciorba-perisoare', 'a bowl of Romanian sour soup with pork meatballs, diced carrot, celery and parsnip in a clear light-golden broth, chopped green lovage on top'),
  dish('supa-legume', 'a bowl of smooth orange cream of carrot and pumpkin soup with a thin swirl of cream and a few small croutons'),
  dish('pui-cartofi', 'a roast chicken leg quarter with golden crispy skin next to rosemary roast potato wedges on a plate'),
  dish('musaca', 'a square portion of Romanian vegetable moussaka with visible layers of aubergine and potato and a golden baked béchamel top, on a plate'),
  dish('sarmale', 'three Romanian cabbage rolls in a little tomato sauce beside a round mound of yellow polenta topped with a spoon of sour cream, on a plate'),
  dish('peste', 'a baked white fish fillet with a lemon wedge and fresh dill, next to boiled baby potatoes, on a plate'),
  dish('salata-varza', 'a small bowl of finely shredded white cabbage salad with a little grated carrot, dill and sunflower oil'),
  dish('papanasi', 'Romanian papanași on a plate: a large fried ring doughnut topped with a small doughnut ball, covered with thick sour cream and dark sour-cherry jam'),
  dish('compot', 'a tall clear glass of homemade apple compote with apple slices floating in pale golden liquid'),
  dish('paine', 'two thick slices of rustic white bread with a golden crust on a small plate'),

  /* Sticker cut-outs for the kiosk attract loop and the picks rail. */
  cut('ciorba-perisoare', 'a bowl of Romanian sour soup with pork meatballs, carrot and green lovage in a golden broth'),
  cut('pui-cartofi', 'a roast chicken leg with crispy golden skin and roast potato wedges'),
  cut('papanasi', 'Romanian papanași: a fried ring doughnut topped with a small doughnut ball, covered with white sour cream and dark cherry jam'),
  cut('sarmale', 'three cabbage rolls in tomato sauce with a mound of yellow polenta and sour cream'),

  /* Atmosphere: the Zone 1 hero until the site-visit photo exists, and the kiosk/video loop. */
  { slug: 'amb-hall', style: 'ambient', subject: 'an empty university canteen dining hall with long pale tables and simple chairs in rows, a stack of grey plastic trays in the foreground', n: 3, size: '1280x768' },
  { slug: 'amb-steam', style: 'ambient', subject: 'steam rising from a large stainless steel soup pot with a ladle on a canteen serving counter, dark background', n: 2, size: '1280x768' },
  { slug: 'amb-trays', style: 'ambient', subject: 'close-up of a tall stack of pale grey canteen trays with a cutlery bin beside them', n: 2, size: '1280x768' },

  /* Empty states and onboarding — vectorised to currentColor after review. */
  line('empty-menu', 'an empty canteen tray with a spoon and a fork lying on it'),
  line('closed', 'a few chairs turned upside down on top of a table, as at closing time'),
  line('offline', 'a smartphone leaning against a steaming cup of tea'),
  line('no-results', 'a magnifying glass lying next to an empty plate'),
  line('install', 'a smartphone standing upright next to a steaming bowl of soup'),
  line('receipt', 'a long narrow shop till receipt standing slightly curled, with short rows of printed lines and a total line near the bottom, and a zigzag torn bottom edge'),

  /* Set B: the same six scenes in a bolder single line (GPT-Image via Pollinations reads
     better at 96px). Whichever set reads better at size ships; the other stays in _raw. */
  ...['empty-menu', 'closed', 'offline', 'no-results', 'install', 'receipt'].map((k) => {
    const b = { 'empty-menu': 'an empty canteen tray with a spoon and a fork lying on it', closed: 'a few chairs turned upside down on top of a table, as at closing time', offline: 'a smartphone leaning against a steaming cup of tea', 'no-results': 'a magnifying glass lying next to an empty plate', install: 'a smartphone standing upright next to a steaming bowl of soup', receipt: 'a long narrow shop till receipt, slightly curled, with short rows of printed lines and a zigzag torn bottom edge' }[k];
    return { slug: `illb-${k}`, style: 'line', subject: b, n: 1, provider: 'pollinations' };
  }),

  /* The brand illustration layer. GPT-Image through Pollinations draws these best; each costs
     ~0.007 pollen, so one seed each and the free AI Horde for alternatives. */
  ...[
    ['run', 'a university student running happily while carrying a canteen tray with a steaming bowl of soup, a bread roll and a glass of juice, a backpack bouncing on the back, a few speed lines behind'],
    ['phone', 'a relaxed student leaning back with one foot up against a wall, headphones around the neck, looking at a smartphone with a small satisfied smile'],
    ['cook', 'a cheerful, round canteen cook in a white apron and a cook\'s cap ladling soup from a big pot into a bowl held out in the other hand, steam curling up'],
    ['friends', 'two students sitting side by side at a small table, eating soup from bowls and laughing, one gesturing with a spoon'],
    ['balance', 'a student walking carefully on tiptoe while balancing a full canteen tray on one flat hand and holding a stack of books under the other arm, tongue out in concentration'],
    ['queue', 'three students standing in a short relaxed line, each holding an empty canteen tray, the one at the front turning back to chat with the other two'],
  ].map(([k, s]) => ({ slug: `spot-${k}`, style: 'spot', subject: s, n: 1, seed: 101, provider: 'pollinations' })),

  { slug: 'doodles-canteen', style: 'doodles', n: 1, seed: 101, provider: 'pollinations',
    subject: 'sixteen canteen and Romanian food objects — a soup bowl with steam, a canteen tray, a spoon, a fork, a ladle, a slice of bread, an apple, a glass of fruit compote, a cabbage roll, a cooking pot, a salt shaker, a carrot, a bell pepper, a round wall clock, a fish, a ring doughnut' },
  { slug: 'doodles-student', style: 'doodles', n: 1, seed: 101, provider: 'pollinations',
    subject: 'sixteen student-life objects — a smartphone, a backpack, an open book, a pencil, a coffee cup with steam, a pretzel ring, a pair of headphones, a graduation cap, a till receipt, a tram, a mug of tea, a sandwich, a slice of cake, a cheese pastry, a lunch box, a water bottle' },

  { slug: 'picto-menu', style: 'picto', n: 1, seed: 101, provider: 'pollinations',
    subject: 'eight menu categories — a bowl of soup with steam, a plate with a roast chicken leg, a small bowl of boiled potatoes, a bowl of green salad, a slice of layered cake, a glass of fruit compote, a round loaf of bread, a carrot with a leaf' },

  ...[
    ['counter', 'a friendly university canteen serving counter seen from the front: big steaming pots behind a glass sneeze guard, a stack of trays at one end, a menu board showing coloured bars instead of writing, a pendant lamp and a potted plant'],
    ['campus', 'a neoclassical university building façade with columns and tall windows among trees, a parked bicycle, and three simple figures of students with backpacks walking towards it'],
    ['phone', 'a large smartphone standing upright whose screen shows three simple rounded bars of different heights, next to a steaming bowl of soup on a canteen tray'],
  // Square on Pollinations: a wide GPT-Image frame costs half as much again. (AI Horde's
  // Z-Image returned an unrelated photo for all three on 22 Sep — flat scenes stay on GPT-Image.)
  ].map(([k, s]) => ({ slug: `flat-${k}`, style: 'flat', subject: s, n: 1, seed: 101, size: '1024x1024', provider: 'pollinations' })),

  /* Redrawn on 26 Sep 2026 from a real photo of the University palace: the first, text-only
     version read as Berlin or Warsaw (a tram and blocks no one at UB would recognise). Seed 504 was
     chosen; it ships through `asset.mjs inkmask` with the credit below, also on the About page. */
  { slug: 'sketch-city', style: 'sketch', n: 1, seed: 504, provider: 'comfy',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bucharest_-_Dec_2014_-_B-dul_Regina_Elisabeta_04.jpg/1280px-Bucharest_-_Dec_2014_-_B-dul_Regina_Elisabeta_04.jpg',
    credit: 'drawn after "Bucharest - Dec 2014 - B-dul Regina Elisabeta 04" by Joe Mabel, CC BY 3.0, commons.wikimedia.org',
    subject: 'the University of Bucharest palace on Piața Universității, simplified to a few confident outlines: the domed corner pavilion, the long facade with its rows of tall windows and the mansard roof, two or three trees and a street lamp in front; windows as simple strokes, no ornament, drawn on a single sheet' },

  /* Logo exploration — sketches only, redrawn as vector if one wins. */
  mark('tray-queue', 'the letter U shaped like a canteen tray seen from the side, with three small solid circles in a row above it like heads waiting in a queue'),
  mark('bowl-level', 'a round bowl in cross-section, half filled with a flat horizontal band like a level gauge'),
  mark('compartment-tray', 'a rounded rectangular canteen tray seen from above with three compartments, one large and two small'),
  mark('plate-clock', 'a circular plate drawn as a thick ring with a filled pie-slice wedge inside, like a clock showing a wait'),
  mark('ub-monogram', 'the letters U and B merged into one monogram that shares a single vertical stroke'),
  mark('spoon-u', 'a spoon whose handle bends round to form the letter U'),
  mark('bitten-u', 'a bold letter U with a round bite taken out of the top of its right arm'),
  mark('flap-tile', 'a rounded square split-flap departure board tile showing a bold letter U, a thin horizontal hinge line across the middle'),
];
