/* Generated brand assets for the UI kits. The files live in the UBite repo's assets/ folder
   (the source of truth, with prompts and licences in assets/manifest.json); paths here are
   relative to a page inside ui_kits/<kit>/. Viewed outside the repo the images 404 and the
   kits fall back to their image-slots and glyphs. */
window.UBITE_ASSETS = (() => {
  const base = '../../../../../assets/';
  // Menu category pictograms that exist so far; a category without one keeps its Lucide icon.
  const PICTOS = ['soup', 'main', 'sides', 'dessert', 'drink', 'bread', 'salad', 'fish', 'sarmale', 'covrig'];
  const HAVE_PICTOS = PICTOS;
  return {
    base,
    dish: (id) => `${base}photos/dish-${id}.webp`,
    cutout: (id) => `${base}cutouts/dish-${id}.webp`,
    hall: `${base}photos/hall.webp`,
    ambient: { steam: `${base}ambient/steam.webp`, trays: `${base}ambient/trays.webp`, hallTrays: `${base}ambient/hall-trays.webp` },
    art: Object.fromEntries(['empty-menu', 'closed', 'no-results', 'install', 'offline', 'receipt']
      .map((n) => [n.replace(/-(\w)/g, (_, c) => c.toUpperCase()), `${base}illustrations/${n}.svg`])),
    // The brand illustration layer: characters, flat scenes, pictograms, wallpaper, city sketch.
    spot: (n) => `${base}illustrations/spots/${n}.svg`,
    scene: (n) => `${base}illustrations/scenes/${n}.svg`,
    picto: (n) => (PICTOS.includes(n) && HAVE_PICTOS.includes(n) ? `${base}illustrations/picto/picto-${n}.svg` : null),
    // Animated characters: white lines on black, blended into the card colour (Spotlight `video`).
    motion: (n) => `${base}motion/spot-${n}`,
    pattern: `${base}patterns/canteen.svg`,
    sketch: `${base}illustrations/sketch-city.png`,
    brand: { logo: `${base}brand/logo.svg`, icon: `${base}brand/app-icon.svg`, favicon: `${base}brand/favicon.svg` },
    // ?src=kiosk lets the pilot count QR scans that turn into first opens (docs/08-kiosk.md).
    qr: `${base}qr/kiosk-download.svg`,
  };
})();
