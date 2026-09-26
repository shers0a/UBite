/* @ds-bundle: {"format":4,"namespace":"UBiteDesignSystem_40c8c2","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"LogoSplash","sourcePath":"components/brand/Logo.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"SectionHeader","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Badge","sourcePath":"components/core/Chip.jsx"},{"name":"DietaryTag","sourcePath":"components/core/Chip.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Skeleton","sourcePath":"components/core/Input.jsx"},{"name":"PersonMeter","sourcePath":"components/crowding/CrowdingIndicator.jsx"},{"name":"QualityBadge","sourcePath":"components/crowding/CrowdingIndicator.jsx"},{"name":"FreshnessStamp","sourcePath":"components/crowding/CrowdingIndicator.jsx"},{"name":"CrowdingIndicator","sourcePath":"components/crowding/CrowdingIndicator.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"OfflineBanner","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"WaitReport","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"CrowdingByHour","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"GLYPHS","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"AppHeader","sourcePath":"components/layout/AppShell.jsx"},{"name":"AppFooter","sourcePath":"components/layout/AppShell.jsx"},{"name":"Announcement","sourcePath":"components/layout/AppShell.jsx"},{"name":"Sheet","sourcePath":"components/layout/AppShell.jsx"},{"name":"Toast","sourcePath":"components/layout/AppShell.jsx"},{"name":"AppShell","sourcePath":"components/layout/AppShell.jsx"},{"name":"DishDetailHeader","sourcePath":"components/menu/DishDetailHeader.jsx"},{"name":"DishPhoto","sourcePath":"components/menu/DishRow.jsx"},{"name":"DishRow","sourcePath":"components/menu/DishRow.jsx"},{"name":"CategoryHeader","sourcePath":"components/menu/DishRow.jsx"},{"name":"RatingStars","sourcePath":"components/menu/RatingStars.jsx"},{"name":"LoyaltyDots","sourcePath":"components/menu/RatingStars.jsx"},{"name":"useReducedMotion","sourcePath":"components/brand/Illustration.jsx"},{"name":"Illustration","sourcePath":"components/brand/Illustration.jsx"},{"name":"Pattern","sourcePath":"components/brand/Illustration.jsx"},{"name":"Spotlight","sourcePath":"components/core/Spotlight.jsx"}],"sourceHashes":{"assets/image-slot.js":"fff26d081c8d","components/brand/Logo.jsx":"754a66b33ae0","components/brand/Wordmark.jsx":"499b29ed92d7","components/core/Button.jsx":"a82db1751f66","components/core/Card.jsx":"1cec087e68b5","components/core/Chip.jsx":"3d0499ddcafe","components/core/Input.jsx":"f5a7e1d273b0","components/crowding/CrowdingIndicator.jsx":"a78eed1dc1bf","components/feedback/EmptyState.jsx":"d4597d0a9da0","components/icons/Icon.jsx":"7b2ee5b2aed9","components/layout/AppShell.jsx":"d9f7ddddf944","components/menu/DishDetailHeader.jsx":"607763d0a762","components/menu/DishRow.jsx":"822d4f8144ec","components/menu/RatingStars.jsx":"7b2688afd848","scripts/check-assets.cjs":"8a357cb6db53","scripts/manifest-add.cjs":"6decf0b6ebbb","ui_kits/dccas-dashboard/app.jsx":"1bea2b241d0c","ui_kits/kiosk/app.jsx":"8e82d80597dc","ui_kits/staff-editor/app.jsx":"030880d6ce5f","ui_kits/student-app/HomeScreen.jsx":"9d17af0eddbb","ui_kits/student-app/Screens.jsx":"a6cc0a35ce12","ui_kits/student-app/app.jsx":"062554706e10","components/brand/Illustration.jsx":"016a03ad8ccf","components/core/Spotlight.jsx":"b638fc5691df"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.UBiteDesignSystem_40c8c2 = window.UBiteDesignSystem_40c8c2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever a design needs an image.
 * You control the slot's shape; it sizes to its container by default. When the search_stock_photos tool
 * is available, prefill the slot by default — write the photo's URL into
 * src (with credit/credit-href); the user can still fill or replace it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The sidecar is a SIBLING of the HTML file that uses this component: the
 * read is a document-relative fetch, and the host resolves the bridge's
 * sidecar writes into the previewed file's directory to match (same
 * contract as design_canvas.jsx). Pages in the same directory share one
 * sidecar; keep slot ids distinct across them.
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          Initial framing baseline: cover | contain.   (default 'cover')
 *                cover starts the image filling the frame (overflow cropped);
 *                contain starts it fully visible (letterboxed). Either way the
 *                user can always pan/scale from there — double-click, or the
 *                Edit control, enters reframe mode (drag to move, scroll or
 *                corner-handles to scale; Escape / click-out commits). The
 *                crop persists alongside the image in the sidecar.
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. Prefill it with a real
 *                photo via search_stock_photos when that tool is available
 *                (set credit/credit-href from the result). A user drop
 *                overrides it; clearing the drop reveals src again.
 *   credit       Attribution text shown as a small overlay at the
 *                bottom-left of the filled slot. REQUIRED whenever src
 *                points at any Unsplash host (images.unsplash.com,
 *                plus.unsplash.com, …): an Unsplash src with no credit
 *                renders an error tile INSTEAD of the photo (Unsplash
 *                terms forbid showing their photos unattributed). Use the
 *                exact form 'Photo by {photographer name} on Unsplash' —
 *                the overlay then links the name to credit-href and
 *                'Unsplash' to the Unsplash homepage, and links back to
 *                unsplash.com automatically get the required utm referral
 *                params appended at render time. The credit belongs to
 *                the src image, so it only shows while src is what's
 *                displayed — a user-dropped image hides it.
 *   credit-href  Link for the photographer's name in the credit overlay
 *                (their Unsplash profile URL from the stock-photo search
 *                results). http(s) URLs only — anything else renders the
 *                name as plain text.
 *
 * Sizing: the slot fills its container by default (width/height 100%).
 * Put it in a sized wrapper — absolutely positioned, a grid cell, a fixed
 * frame — and it takes exactly that box. When the parent's height is
 * indefinite (ordinary flow), it falls back to full width at a 3:2 aspect
 * ratio instead of collapsing. In a shrink-to-fit parent (a float,
 * width:max-content, an unsized absolute wrapper), percentages have
 * nothing to resolve against — size the slot or its wrapper explicitly
 * there. For a fixed-size slot, set
 * width/height on the element itself (inline style), which overrides the
 * default. When
 * layering content above a slot (full-bleed layouts), make the overlay
 * click-through — pointer-events: none on scrims/text plates, re-enabled
 * on interactive children — so the slot's hover controls stay reachable.
 * Keep the slot's bottom-left corner visually clear as well: the credit
 * overlay renders there, and a dark fade or text plate covering it hides
 * the attribution Unsplash's terms require — end the fade above that
 * corner, or keep it nearly transparent where the credit sits.
 *
 * Usage:
 *   <div style="position:relative;width:100%;height:100%">      <!-- full-bleed: -->
 *     <image-slot id="bg" shape="rect"></image-slot>            <!-- fills the wrapper -->
 *   </div>
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';

  // Unsplash terms require visible attribution wherever their photos
  // display, and every link back to unsplash.com must carry utm referral
  // params. Two render-time rules enforce that here:
  //  - an Unsplash-src slot with NO credit attribute renders an error
  //    tile INSTEAD of the photo (an uncredited Unsplash photo on screen
  //    is itself the terms violation, so it never renders bare);
  //  - rendered credit links pointing at unsplash.com get the referral
  //    params appended when absent (credit-href values live in page
  //    content that can't be edited after the fact).
  // Keep the utm_source value in sync with UTM_SOURCE in
  // platform/web-agent/unsplash.ts — this file is a project-local
  // artifact and cannot import it (equality is pinned by tests).
  const UNSPLASH_HOMEPAGE_HREF = 'https://unsplash.com/?utm_source=claude_design&utm_medium=referral';
  // Host rule mirrors the hotlink validator that admits Unsplash srcs into
  // pages in the first place (cdn$ in unsplash.ts: apex or any subdomain)
  // — Unsplash+ results serve from plus.unsplash.com, not just images.*,
  // and an admitted-but-uncredited photo must error whatever unsplash
  // host it rides on.
  // Trailing-dot FQDNs (images.unsplash.com.) are the same host to the
  // browser but would miss the regex — strip one dot so the check fails
  // CLOSED (unrecognized-but-real Unsplash srcs must error, not render).
  const isUnsplashHost = u => {
    try {
      return /(^|\.)unsplash\.com$/.test(new URL(u, document.baseURI).hostname.replace(/\.$/, ''));
    } catch {
      return false;
    }
  };
  // Render-time referral normalization for links back to Unsplash:
  // appends utm_source/utm_medium when absent, preserves every existing
  // query param, never overwrites an existing utm_source, and passes
  // non-Unsplash URLs through untouched. Input is an ABSOLUTE validated
  // http(s) URL (the credit render funnel resolves + validates first).
  const withReferral = href => {
    try {
      const u = new URL(href);
      if (!/(^|\.)unsplash\.com$/.test(u.hostname.replace(/\.$/, ''))) {
        return href;
      }
      if (!u.searchParams.has('utm_source')) {
        u.searchParams.set('utm_source', 'claude_design');
      }
      if (!u.searchParams.has('utm_medium')) {
        u.searchParams.set('utm_medium', 'referral');
      }
      return u.toString();
    } catch (e) {
      return href;
    }
  };
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  // Unload-time flush: save()'s serialization defers a mid-RTT re-fire to a
  // .then that never runs in an unloading document, silently dropping a
  // pagehide commit. Post the current slots immediately instead — content
  // is a superset snapshot of any in-flight save's, the write is a
  // whole-file last-writer-wins replace, and postMessage FIFO delivers it
  // to the host after the in-flight one, so a backend-side reorder at
  // worst reproduces the dropped-commit outcome this flush improves on.
  // Guarded on the initial sidecar read: pre-hydration slots can miss
  // other slots' persisted entries, and flushing it would clobber them —
  // that narrow case stays best-effort (the in-memory merge in load()
  // cannot happen in an unloading document anyway).
  function flushNow() {
    if (!loaded) return;
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    try {
      Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {});
    } catch (e) {}
  }
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
  // Fill the container by default: slots are usually placed inside a
  // sized wrapper (a hero frame, a grid cell, an inset:0 layer) and are
  // expected to take that box — a fixed intrinsic size would render as
  // a small tile in the corner of a full-bleed wrapper instead.
  // aspect-ratio is the companion fallback that keeps a bare slot
  // visible when the parent's height is indefinite: height:100%
  // resolves to auto there, and the ratio then derives height from
  // width instead of letting the slot collapse to zero height.
  // Explicit width/height on the element override all of this.
  // color:inherit (not a fixed near-black): the placeholder chrome —
  // empty-state icon/caption (currentColor) and the dashed ring — must
  // read on dark decks too, and the slide's own text color is the one
  // color guaranteed to contrast with the slide background. The soft
  // look comes from opacity on those parts, not from a baked-in alpha.
  ':host{display:block;position:relative;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;' + '  width:100%;height:100%;aspect-ratio:3/2}' + '.empty .cap,.empty .sub{opacity:.75}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(127,127,127,.08)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  // popover=manual promotes the spill to the top layer on reframe, so it is
  // not clipped by any overflow:hidden / clip-path / scroll-container
  // ancestor (a plain z-index can't escape overflow clipping). UA popover
  // defaults (inset:0;margin:auto) are reset; _applyView sets viewport px.
  '.spill{position:fixed;margin:0;inset:auto;border:0;padding:0;background:transparent;' + '  overflow:visible;transform:translate(-50%,-50%);z-index:1;cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px}' + '.empty:hover .sub{opacity:1}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed currentColor;' + '  opacity:.35;transition:border-color .12s,opacity .12s}' + ':host([data-over]) .ring{border-color:#c96442;opacity:1}' + ':host([data-filled]) .ring{display:none}' +
  // Controls overlay INSIDE the frame, pinned to the top-right corner, so
  // a full-bleed slot in an overflow:hidden container still shows them
  // (the old below-mask placement got clipped). Credit sits bottom-left,
  // so top-right avoids collision. The blurred pill background keeps them
  // legible over the image.
  // The UA [popover] base rule styles the element in EVERY state (only
  // display:none is gated on :not(:popover-open), and the display:flex
  // below overrides that) — so the UA resets live HERE, like .spill's,
  // or the ordinary hover-state strip renders as a bordered Canvas box
  // centered by margin:auto. inset:auto precedes top/right (shorthand).
  '.ctl{position:absolute;inset:auto;top:8px;right:8px;margin:0;border:0;padding:0;' + '  background:transparent;overflow:visible;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' +
  // While reframing, the spill owns the top layer and would swallow every
  // click on the in-frame controls. Promoting .ctl into the top layer
  // ABOVE the spill (shown after it — later popovers stack higher) keeps
  // Edit-as-toggle and Replace clickable mid-reframe. _applyView pins it
  // to the frame's top-right in viewport px (translateX(-100%)
  // right-aligns against the computed left edge); inset:auto clears the
  // base rule's top/right so the inline left/top position it alone.
  '.ctl:popover-open{position:fixed;inset:auto;transform:translateX(-100%)}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' +
  // Replacement in flight: after a src swap the browser keeps painting
  // the PREVIOUS image until the new one decodes, so a Replace would
  // flash the old photo and then pop. Hide the stale frame (visibility,
  // not display — _applyView geometry still applies) and spin until the
  // new image reports in (load/error clears data-swapping).
  ':host([data-swapping]) .frame img{visibility:hidden}' + '.loading{position:absolute;inset:0;display:none;align-items:center;' + '  justify-content:center;pointer-events:none}' + ':host([data-swapping]) .loading{display:flex}' + '.loading::after{content:"";width:22px;height:22px;border-radius:50%;' + '  border:2px solid rgba(127,127,127,.25);border-top-color:currentColor;' + '  animation:om-slot-spin .7s linear infinite}' + '@keyframes om-slot-spin{to{transform:rotate(360deg)}}' +
  // Reduced motion: the static two-tone ring still reads as "working".
  '@media (prefers-reduced-motion:reduce){.loading::after{animation:none}}' + '.credit{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);display:none;' + '  padding:3px 7px;border-radius:5px;background:rgba(0,0,0,.55);color:#fff;' + '  font:10px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;' + '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}' +
  // The credit is a SPAN holding one or two <a>s (Unsplash's prescribed
  // form links the photographer AND Unsplash) — anchors style inline so
  // the overlay reads as one line of text.
  '.credit a{color:inherit;text-decoration:none}' + '.credit a:hover,.credit a:focus-visible{text-decoration:underline}' + ':host([data-filled][data-credit]) .credit{display:block}' +
  // Exports must ship JUST the image — no hover controls, no credit chip
  // (the host marks <html data-om-exporting> for the capture window; the
  // page-level hide script can't reach shadow DOM, this rule can).
  ':host-context([data-om-exporting]) .ctl,' + ':host-context([data-om-exporting]) .credit{display:none !important}' +
  // Print must ship just the image too: the hover-gated controls can be
  // mid-hover when print() fires, and the credit chip is screen chrome —
  // the same rule the capture window gets, keyed on print media instead
  // of the host's data-om-exporting mark (the print path sets no mark).
  '@media print{.ctl,.credit{display:none !important}}' +
  // No export-window mask rules here on purpose: the export capture
  // releases the replacement mask by REMOVING data-swapping (the
  // shadow-root pass in pages/export/shared.ts HIDE_EXPORT_CHROME_SCRIPT)
  // — attribute removal works in every engine (:host-context is
  // Chromium-only), is scoped by construction to slots actually
  // mid-swap, and hides the spinner through the same gate. A masked img
  // would otherwise be silently dropped from PPTX decks (the capture
  // walk skips visibility:hidden imgs).
  // Attribution error tile: REPLACES the photo when an Unsplash src has
  // no credit attribute — rendering the photo uncredited is the terms
  // violation, so the photo must not appear at all.
  // Calm and neutral on purpose (review feedback): the tile informs the
  // user; the fix instructions are machine-facing (usage docblock, tool
  // description, and the turn-end scan's bounce copy name the attributes
  // for the agent).
  '.attr-error{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  background:#f2f1ef;color:#6e6c66;user-select:none;' + '  font:13px/1.45 system-ui,-apple-system,sans-serif}' + '.attr-error svg{opacity:.55}' + '.attr-error .cap{max-width:92%;font-weight:500;letter-spacing:.01em}' + ':host([data-attribution-error]) .attr-error{display:flex}' + ':host([data-attribution-error]) .ring{display:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  const warnIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' + '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'placeholder', 'src', 'id', 'credit', 'credit-href'];
    }

    /** Duplicate-slide hook (called by deck-stage, see its
     *  _remintDuplicateIds): copy this id's stored image, if any, under a
     *  freshly minted key and return that key — so a duplicated slide's
     *  slot keeps its dropped photo instead of reverting to the
     *  placeholder. 'isFree' is the caller's uniqueness check (document
     *  ids); candidates must ALSO be unused in the sidecar, which can
     *  hold keys from other pages sharing the project root. (An EMPTY
     *  slot on another page leaves no sidecar entry, so its id is not
     *  detectable here — a minted key can collide with it and that slot
     *  would show this photo. Same blast radius as two pages reusing an
     *  id by hand, which the shared sidecar already permits.) Returns null
     *  when no id could be minted (caller strips the id, today's
     *  behavior). */
    static cloneSlot(fromId, isFree) {
      if (typeof fromId !== 'string' || !fromId) return null;
      // Pre-hydration the store can't veto candidates or source the copy
      // — degrade to the strip (today's behavior) rather than mint
      // against keys we can't see yet. Any rendered (= droppable) slot
      // means load() has already settled.
      if (!loaded) return null;
      const stem = fromId.replace(/-\d+$/, '') || fromId;
      for (let n = 2; n < 100; n++) {
        const toId = stem + '-' + n;
        if (toId === fromId) continue;
        if (slots[toId] !== undefined) {
          // Reuse a key holding this exact value (bytes AND crop) if no
          // live element here owns it — a duplicate op the host refused
          // after minting leaves such a key behind, and reusing keeps
          // refused retries from accumulating one orphaned copy per
          // attempt. Full equality (not just bytes) so a byte-identical
          // key another PAGE owns with its own crop is stepped past, not
          // adopted or rewritten. (Entries without .u never match.)
          const prev = getSlot(toId);
          const cur = getSlot(fromId);
          if (!(prev && cur && prev.u && prev.u === cur.u && prev.s === cur.s && prev.x === cur.x && prev.y === cur.y && (typeof isFree !== 'function' || isFree(toId)))) continue;
          return toId;
        }
        if (typeof isFree === 'function' && !isFree(toId)) continue;
        const v = getSlot(fromId);
        if (v) setSlot(toId, Object.assign({}, v));
        return toId;
      }
      return null;
    }
    constructor() {
      super();
      // clonable: rail thumbnails deep-clone slides and carry this shadow
      // along; reuse an already-cloned root so upgrade-after-clone works.
      // (Deliberately NOT serializable — a getHTML consumer would embed
      // multi-MB sidecar data-URLs into serialized page HTML.)
      const root = this.shadowRoot || this.attachShadow({
        mode: 'open',
        clonable: true
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="attr-error" part="attribution-error">' + warnIcon + '    <div class="cap">This photo needs attribution</div></div>' + '  <div class="loading" part="loading"></div>' + '  <div class="ring" part="ring"></div>' + '</div>' +
      // Outside .frame, like .spill/.ctl — the frame's overflow:hidden +
      // border-radius/clip-path would cut the credit off on circle/pill/mask.
      // A SPAN, not an <a>: the prescribed Unsplash credit holds two links
      // (photographer + Unsplash), built per-render in _render().
      '<span class="credit" part="credit"></span>' + '<div class="spill" popover="manual" data-dc-edit-transparent>' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' +
      // data-dc-edit-transparent: the DC editor's edit-mode picker lets
      // clicks through for chrome marked with it (EDIT_TRANSPARENT_SEL)
      // — without it, Replace/Edit clicks in Edit mode are swallowed by
      // element selection and the controls look dead.
      '<div class="ctl" popover="manual" data-dc-edit-transparent><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="edit" title="Reframe image">Edit</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ctl = root.querySelector('.ctl');
      this._credit = root.querySelector('.credit');
      this._attrError = root.querySelector('.attr-error');
      // Credit clicks open the link, not browse/reframe.
      this._credit.addEventListener('click', e => e.stopPropagation());
      this._credit.addEventListener('dblclick', e => e.stopPropagation());
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      // Encode-in-flight marker (the owning _ingest generation): while set,
      // the same-src "nothing in flight" clear in _render must not fire —
      // the stored value still points at the OLD image until the encode
      // lands, so that clear would unmask the stale image mid-replace.
      this._swapGen = 0;
      // Render-owned swap in flight: set when _render assigns a new src,
      // cleared only by the img's own load/error (or the empty branch).
      // img.complete CANNOT stand in for this — setting src only QUEUES
      // the current-request swap (a microtask), so synchronously after an
      // assignment, complete still reports the OLD settled request. The
      // pick path does exactly that: the host sets src, credit, and
      // credit-href back-to-back in one task, and renders #2/#3 would
      // read the stale complete === true and drop the mask one render
      // after it was set.
      this._loadPending = false;
      // See _render's empty branch: a transient attribution-error wipe of a
      // showing image must make the follow-up render a replacement (spinner),
      // not a first fill (blank frame).
      this._hidShowing = false;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        // The hidden controls are opacity-0 but still tabbable — without
        // this gate a keyboard user could drive them on a read-only share
        // link (mirrors the dblclick handler's editable gate).
        if (!this.hasAttribute('data-editable')) return;
        if (act === 'replace') {
          this._exitReframe(true);
          // Host-owned picker (Unsplash modal; it also offers local import).
          this.dispatchEvent(new CustomEvent('image-slot:pick', {
            bubbles: true,
            composed: true,
            detail: {
              id: this.id || null
            }
          }));
        }
        if (act === 'edit') {
          if (!this._reframes()) return;
          if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      // load/error also release the replacement-in-flight mask (via the
      // single discipline in _releaseMask): the swap is only revealed once
      // the new image can actually paint (on error the frame shows its
      // background, same as a fresh slot with a broken src).
      this._img.addEventListener('load', () => {
        this._loadPending = false;
        this._releaseMask(true);
        this._applyView();
      });
      this._img.addEventListener('error', () => {
        this._loadPending = false;
        this._releaseMask(true);
      });
      // Gated only on editable — any filled slot can be repositioned/scaled,
      // regardless of fit. Share links (no writeFile) stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
          const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // The host may inject window.omelette.writeFile AFTER the first render;
      // re-render on hover so the editable-gated controls reliably appear.
      this.addEventListener('pointerenter', this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('pointerenter', this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      // commit=false: a disconnect is not a user intent — committing here
      // would persist whatever half-finished drag a React remount or DOM
      // splice happened to interrupt. Deliberate exits commit on their own
      // paths (Escape/click-out/toggle), and unloads commit via pagehide.
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._signalReframe(true);
      // Best-effort commit when the document unloads mid-reframe (a host
      // navigation racing the enter signal, a manual reload, tab close):
      // the sidecar write rides the host bridge, which outlives this
      // document, so the crop survives even though the mode dies with the
      // DOM. Held on the instance so _exitReframe detaches exactly what
      // was attached.
      this._pagehide = () => {
        this._exitReframe(true);
        flushNow();
      };
      window.addEventListener('pagehide', this._pagehide);
      // Promote spill to the top layer, then keep it pinned over the frame:
      // scroll/resize cover the common cases, and a per-frame rect check
      // catches layout shifts that fire neither (an image above finishing
      // load, streamed DOM pushing the slot down, an ancestor transform
      // change) so the overlay can't detach from the frame.
      try {
        this._spill.showPopover();
      } catch {}
      // After the spill, so the controls stack above it in the top layer.
      try {
        this._ctl.showPopover();
      } catch {}
      this._reposition = () => {
        if (this.hasAttribute('data-reframe')) this._applyView();
      };
      window.addEventListener('scroll', this._reposition, true);
      window.addEventListener('resize', this._reposition);
      this._lastRect = '';
      this._watch = () => {
        if (!this.hasAttribute('data-reframe')) return;
        const r = this.getBoundingClientRect();
        const key = r.left + ',' + r.top + ',' + r.width + ',' + r.height;
        if (key !== this._lastRect) {
          this._lastRect = key;
          this._applyView();
        }
        this._watchId = requestAnimationFrame(this._watch);
      };
      this._watchId = requestAnimationFrame(this._watch);
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (this._reposition) {
        window.removeEventListener('scroll', this._reposition, true);
        window.removeEventListener('resize', this._reposition);
        this._reposition = null;
      }
      if (this._watchId) {
        cancelAnimationFrame(this._watchId);
        this._watchId = 0;
      }
      if (this._pagehide) {
        window.removeEventListener('pagehide', this._pagehide);
        this._pagehide = null;
      }
      try {
        this._spill.hidePopover();
      } catch {}
      try {
        this._ctl.hidePopover();
      } catch {}
      this._ctl.style.left = '';
      this._ctl.style.top = '';
      if (commit) this._commitView();
      this._signalReframe(false);
    }

    // Reframe state lives only in this DOM until commit, invisible to the
    // host's dirty signals — announce enter/exit so the host can hold
    // auto-reloads for exactly the gesture (the guest bundle forwards
    // image-slot:reframe to the host as imageSlotReframe). Dispatched on
    // the element (composed, so it escapes shadow roots) while connected;
    // a disconnected exit (disconnectedCallback) falls back to document so
    // the host still hears it.
    _signalReframe(active) {
      const target = this.isConnected ? this : document;
      target.dispatchEvent(new CustomEvent('image-slot:reframe', {
        bubbles: true,
        composed: true,
        detail: {
          active: active,
          id: this.id || null
        }
      }));
    }

    // Public: host's "Import from computer" calls this to run local browse.
    openFilePicker() {
      this._exitReframe(true);
      this._input.click();
    }

    // A src write is a newer intent for this slot's content — the host
    // pick path (setImageSlotImage) or an agent edit — so it must win
    // over any encode still in flight from an earlier drop: left live,
    // that encode lands later, passes _ingest's gen guard, and its
    // setSlot silently overwrites the pick (the stored value shadows
    // src in _render). Bumping _gen kills the encode before its own
    // _swapGen clear runs, so clear the dead claim here too — otherwise
    // _releaseMask (gated on !_swapGen) never fires and the pick's
    // spinner is stranded. src ONLY: the pick sets credit/credit-href
    // in the same task, and clearing _swapGen on those would let the
    // same-src branch unmask the old image mid-encode.
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'src' && oldVal !== newVal) {
        this._gen++;
        this._swapGen = 0;
      }
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      // Replacing a shown image: surface the swap through the encode too,
      // not just the decode — otherwise the old photo sits there with no
      // feedback while the canvas re-encode runs. An empty slot keeps its
      // placeholder (no spinner) until the encode lands, as before.
      // _swapGen guards the mask against re-renders DURING the encode
      // (pointerenter, ResizeObserver, another slot's store write): the
      // stored value still resolves to the old image there, so _render's
      // same-src clear would otherwise unmask it mid-replace.
      if (this.hasAttribute('data-filled')) {
        this.setAttribute('data-swapping', '');
        this._swapGen = gen;
      }
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        // Clear BEFORE setSlot: its synchronous re-render must see no
        // pending encode, so a byte-identical re-upload (same data URL, no
        // load event coming) still clears the mask via the complete branch.
        this._swapGen = 0;
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._swapGen = 0;
        // Reveal the kept old image — unless another replacement (a
        // remote pick's src swap) is still in flight, in which case the
        // mask stays until THAT image settles (its load/error releases).
        this._releaseMask();
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is available on any filled slot — the user can
    // always reposition/scale. `fit` only sets the initial baseline (see
    // _geom): contain starts fully-visible, cover starts frame-filling.
    _reframes() {
      return this.hasAttribute('data-filled');
    }

    // The single release discipline for the replacement-in-flight mask
    // (data-swapping). The mask comes off only when BOTH hold:
    //  - no encode is pending (_swapGen) — mid-encode the stored value
    //    still resolves to the old image, so any reveal paints it;
    //  - the frame img has settled on its current src — an unsettled src
    //    means some replacement is still in flight (e.g. a remote pick),
    //    whoever started it, and revealing would paint the previous
    //    frame. The load/error listeners pass settled=true (the event IS
    //    the settlement signal, per spec complete is true by then);
    //    other callers rely on the complete flag (covers loaded AND
    //    failed).
    // Every release path funnels through here EXCEPT _render's empty
    // branch (the img is being cleared — nothing will ever settle).
    _releaseMask(settled) {
      if (!this._swapGen && !this._loadPending && (settled || this._img.complete)) {
        this.removeAttribute('data-swapping');
      }
    }

    // Baseline geometry, shared by clamp/apply/resize. `base` is the scale at
    // view-scale s=1: cover = fill the frame (overflow on the looser axis),
    // contain = fit fully inside (letterboxed). Zooming a contain image past
    // s where it overflows naturally becomes a crop. Null until the img has
    // loaded (naturalWidth is 0 before that) or when the slot has no layout
    // box — ResizeObserver fires with a 0×0 rect under display:none, and
    // clamping against a degenerate 1×1 frame would silently pull the stored
    // pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
      const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
      return {
        iw,
        ih,
        fw,
        fh,
        base
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      // Top-layer controls: pin to the frame's top-right in viewport px
      // (the same 8px inset as the in-frame layout; unscaled — top-layer UI
      // reads as chrome, not page content). BEFORE the geometry branch:
      // placement needs only the frame rect, and a not-yet-loaded or broken
      // src must not leave the promoted strip floating unpositioned. Gated
      // on the popover actually being open: without the Popover API,
      // showPopover() threw (swallowed in _enterReframe), .ctl stays in
      // its in-frame absolute layout, and viewport-px coordinates would
      // shove it off-frame — and matches(':popover-open') itself throws
      // there (unknown pseudo-class), hence the try/catch.
      if (this.hasAttribute('data-reframe')) {
        let onTop = false;
        try {
          onTop = this._ctl.matches(':popover-open');
        } catch {}
        if (onTop) {
          const r = this.getBoundingClientRect();
          this._ctl.style.left = r.right - 8 + 'px';
          this._ctl.style.top = r.top + 8 + 'px';
        }
      }
      if (!g) {
        // Dimensions not known yet (before img load) — centered fit so there
        // is no flash of an unpositioned image before the geometry lands.
        const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = contain ? 'contain' : 'cover';
        return;
      }
      // Baseline (cover-fill or contain-fit) × view scale. Width/height and
      // left/top are all frame-% — depends only on the frame aspect ratio, so
      // a responsive resize keeps the same crop. The spill layer mirrors the
      // same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      if (this.hasAttribute('data-reframe')) {
        // Top-layer spill: position in viewport px over the frame. The top
        // layer escapes ancestor transforms entirely, so EVERY term must be
        // in viewport units: getBoundingClientRect gives the frame's scaled
        // origin AND size, and the rect/layout ratio rescales the ghost —
        // sizing from layout px alone renders it 1/scale too large under a
        // scaled deck slide. Inner ghost + handles stay box-relative.
        const r = this.getBoundingClientRect();
        const sx = g.fw ? r.width / g.fw : 1;
        const sy = g.fh ? r.height / g.fh : 1;
        this._spill.style.width = g.iw * k * sx + 'px';
        this._spill.style.height = g.ih * k * sy + 'px';
        this._spill.style.left = r.left + (50 + this._view.x) / 100 * r.width + 'px';
        this._spill.style.top = r.top + (50 + this._view.y) / 100 * r.height + 'px';
      }
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      // An Unsplash src with no credit attribute must NOT render — showing
      // the photo uncredited is the Unsplash-terms violation itself. The
      // error tile replaces the photo until the credit is written. A
      // user-dropped image is the user's own content and always renders.
      // Trimmed: credit is agent/user-editable content, and a whitespace-
      // only value must count as missing — otherwise it would suppress the
      // error tile AND render an empty credit box (no text, no links),
      // exactly the unattributed state this gate exists to prevent.
      const credit = (this.getAttribute('credit') || '').trim();
      const attrError = !!(!credit && !this._userUrl && srcAttr && isUnsplashHost(srcAttr));
      this.toggleAttribute('data-attribution-error', attrError);
      if (url && !attrError) {
        const prev = this._img.getAttribute('src');
        if (prev !== url) {
          // Replacing an already-shown image: mark the swap BEFORE setting
          // src so the stale frame is never revealed (see the data-swapping
          // stylesheet rules). First fill (prev empty) keeps the existing
          // placeholder-until-load behavior — no spinner. _hidShowing
          // covers the pick path's transient attribution-error wipe: prev
          // is gone, but an image WAS showing, so this is a replacement.
          if (prev || this._hidShowing) this.setAttribute('data-swapping', '');
          // Mark the swap BEFORE assigning src: complete keeps reporting
          // the old settled request until the browser's
          // update-the-image-data microtask runs, so same-task re-renders
          // (the pick path's credit/credit-href setAttributes) need this
          // flag, not complete, to know a load is in flight.
          this._loadPending = true;
          this._img.src = url;
          this._ghost.src = url;
        } else {
          // Same-src re-render — release if settled, so an ingest-set
          // spinner can't stick after a byte-identical re-upload (same
          // data URL, no further load event ever fires).
          this._releaseMask();
        }
        this._hidShowing = false;
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this.removeAttribute('data-swapping');
        // The src is being removed — no load/error will ever fire for it.
        this._loadPending = false;
        // A transient attribution-error wipe of a showing image happens on
        // the pick path: the host sets src one setAttribute before credit,
        // so render N hides the old image (attrError) and render N+1
        // restores a URL. Remember the wipe so that restore renders as a
        // replacement (spinner), not a first fill (blank frame).
        this._hidShowing = attrError && !!this._img.getAttribute('src');
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        // The error tile owns the blocked-photo state; .empty stays for
        // the genuinely-empty slot.
        this._empty.style.display = attrError ? 'none' : 'flex';
        this.removeAttribute('data-filled');
      }

      // Credit belongs to the author src, so a user drop hides it.
      // textContent + the http(s)-only funnel keep external strings inert.
      const showCredit = !!(url && credit && !this._userUrl && !attrError);
      this._credit.textContent = '';
      if (showCredit) {
        // Validate once (resolved against the document, http(s) only),
        // then append the terms-required utm referral params to links
        // that point back at unsplash.com.
        let href = '';
        const rawHref = this.getAttribute('credit-href') || '';
        if (rawHref) {
          try {
            const u = new URL(rawHref, document.baseURI);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
              href = withReferral(u.href);
            }
          } catch {}
        }
        const mkLink = (text, linkHref) => {
          const a = document.createElement('a');
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          a.setAttribute('href', linkHref);
          a.textContent = text;
          return a;
        };
        // Unsplash's prescribed credit is TWO links — the photographer's
        // name to their profile (credit-href) and 'Unsplash' to the
        // homepage. Render that split whenever the text has the canonical
        // shape; other text keeps the legacy single-link rendering.
        const m = /^Photo by (.+) on Unsplash$/.exec(credit);
        if (m) {
          this._credit.appendChild(document.createTextNode('Photo by '));
          this._credit.appendChild(href ? mkLink(m[1], href) : document.createTextNode(m[1]));
          this._credit.appendChild(document.createTextNode(' on '));
          this._credit.appendChild(mkLink('Unsplash', UNSPLASH_HOMEPAGE_HREF));
        } else if (href) {
          this._credit.appendChild(mkLink(credit, href));
        } else {
          this._credit.textContent = credit;
        }
      }
      this.toggleAttribute('data-credit', showCredit);
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/image-slot.js", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
/* The UBite mark, drawn as geometry — no raster file, no generator.
   It is a LIVE mark: the three counters fill with the current queue level, so the app icon,
   the header and the kiosk corner all show today's canteen. The word is always elsewhere on
   screen; the mark never carries the level on its own.
   The team chose A, the tray-U. The other variants stay for the logo explorations only. */

const FILLED = {
  closed: 0,
  low: 1,
  moderate: 2,
  high: 3
};
const LEVEL_TONE = {
  low: 'var(--crowd-low-fill)',
  moderate: 'var(--crowd-moderate-fill)',
  high: 'var(--crowd-high-fill)',
  closed: 'var(--crowd-closed-fill)'
};
function Counters({
  variant,
  filled,
  tone,
  favicon
}) {
  const dotR = favicon ? 5 : 4;
  if (variant === 'signal') {
    const bars = [{
      x: 17,
      y: 10,
      h: 8
    }, {
      x: 28,
      y: 6,
      h: 12
    }, {
      x: 39,
      y: 2,
      h: 16
    }];
    return bars.map((b, i) => /*#__PURE__*/React.createElement("rect", {
      key: i,
      x: b.x,
      y: b.y,
      width: "8",
      height: b.h,
      rx: "2",
      className: i < filled ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c',
      style: {
        animationDelay: `${i * 70}ms`
      },
      fill: i < filled ? tone || 'currentColor' : 'none',
      stroke: i < filled ? 'none' : 'currentColor',
      strokeWidth: favicon ? 4 : 3
    }));
  }
  return [21, 32, 43].map((cx, i) => /*#__PURE__*/React.createElement("circle", {
    key: cx,
    cx: cx,
    cy: "12",
    r: dotR,
    className: i < filled ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c',
    style: {
      animationDelay: `${i * 70}ms`
    },
    fill: i < filled ? tone || 'currentColor' : 'none',
    stroke: i < filled ? 'none' : 'currentColor',
    strokeWidth: favicon ? 4 : 3
  }));
}

/* The chosen lockup (logo A, 22 Sep 2026): the tray-U followed directly by "Bite", so the
   word reads UBite with the mark as its first letter. Built by the repo's scripts/brand.mjs:
   the U's height is Archivo's cap height, its stroke Archivo Bold's stem, and "Bite" is
   Archivo Bold converted to outlines — the lockup never waits for a font. */
const LOCKUP = {
  vb: '-24 14 2994 1022',
  w: 2994,
  h: 1022,
  sw: 145,
  r: 85,
  u: 'M72.5 378.5V734.5A203 203 0 0 0 275.5 937.5H719.5A203 203 0 0 0 922.5 734.5V378.5',
  heads: [[263.8, 123], [497.5, 123], [731.3, 123]],
  word: 'M1538 1000L1145 1000L1145 314L1537 314Q1591 314 1634.5 335Q1678 356 1703 394Q1728 432 1728 483Q1728 524 1713 556Q1698 588 1672.5 609Q1647 630 1615 640L1615 644Q1653 652 1682.5 674Q1712 696 1729.5 730.5Q1747 765 1747 812Q1747 874 1718.5 916Q1690 958 1643 979Q1596 1000 1538 1000M1294 707L1294 878L1509 878Q1546 878 1569.5 857Q1593 836 1593 792Q1593 766 1583 747Q1573 728 1553 717.5Q1533 707 1502 707L1294 707M1294 433L1294 591L1492 591Q1519 591 1537.5 580.5Q1556 570 1565.5 552.5Q1575 535 1575 512Q1575 473 1553.5 453Q1532 433 1497 433L1294 433M1994 397L1855 397L1855 277L1994 277L1994 397M1994 1000L1855 1000L1855 474L1994 474L1994 1000M2279 1012Q2229 1012 2198 994Q2167 976 2153 945.5Q2139 915 2139 878L2139 581L2074 581L2074 474L2144 474L2170 324L2278 324L2278 474L2374 474L2374 581L2278 581L2278 855Q2278 879 2289 891.5Q2300 904 2325 904L2374 904L2374 996Q2362 1000 2346 1003.5Q2330 1007 2312 1009.5Q2294 1012 2279 1012M2703 1012Q2616 1012 2557 982.5Q2498 953 2468 892Q2438 831 2438 737Q2438 642 2468 581.5Q2498 521 2556.5 491.5Q2615 462 2700 462Q2780 462 2835 490.5Q2890 519 2918 578.5Q2946 638 2946 732L2946 768L2579 768Q2581 814 2593.5 846Q2606 878 2632.5 893.5Q2659 909 2703 909Q2727 909 2746.5 903Q2766 897 2780 885Q2794 873 2802 855Q2810 837 2810 814L2946 814Q2946 864 2928 901Q2910 938 2878 962.5Q2846 987 2801.5 999.5Q2757 1012 2703 1012M2581 680L2803 680Q2803 650 2795.5 628Q2788 606 2775 592Q2762 578 2743.5 571.5Q2725 565 2702 565Q2664 565 2638.5 577.5Q2613 590 2599.5 615.5Q2586 641 2581 680'
};
function Lockup({
  size,
  filled,
  counterTone,
  colour,
  wordColour,
  intro
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: LOCKUP.vb,
    width: Math.round(size * LOCKUP.w / LOCKUP.h),
    height: size,
    role: "img",
    "aria-label": "UBite",
    className: intro ? 'ub-lockup ub-lockup--intro' : 'ub-lockup',
    style: {
      display: 'block',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    className: "ub-lockup-u",
    d: LOCKUP.u,
    pathLength: "1",
    fill: "none",
    stroke: colour,
    strokeWidth: LOCKUP.sw,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), LOCKUP.heads.map(([cx, cy], i) => {
    const on = i < filled;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: on ? LOCKUP.r : LOCKUP.r - 30,
      className: on ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c',
      style: {
        animationDelay: `${(intro ? 240 : 0) + i * 80}ms`
      },
      fill: on ? counterTone || colour : 'none',
      stroke: on ? 'none' : colour,
      strokeWidth: on ? 0 : 60
    });
  }), /*#__PURE__*/React.createElement("path", {
    className: "ub-lockup-w",
    d: LOCKUP.word,
    fill: wordColour
  }));
}
function Logo({
  variant = 'tray',
  size = 34,
  level,
  tone = 'accent',
  favicon = false,
  intro = false,
  withText = false,
  style
}) {
  const uid = React.useId().replace(/:/g, '');
  const filled = level ? FILLED[level] ?? 2 : variant === 'plate' || variant === 'bite' ? 0 : 2;
  const counterTone = level && tone === 'level' ? LEVEL_TONE[level] : undefined;
  const colour = tone === 'mono' ? 'var(--text-primary)' : tone === 'inverse' ? 'var(--surface-raised)' : tone === 'on-accent' ? 'var(--text-on-accent)' : 'var(--accent)';
  const wordColour = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'on-accent' ? 'var(--text-on-accent)' : 'var(--text-primary)';
  const sw = favicon ? 7 : 5;
  const mark = /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 64 64",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: "img",
    "aria-label": "UBite",
    className: intro ? 'ub-logo-intro' : undefined,
    style: {
      color: colour,
      display: 'block',
      flex: 'none'
    }
  }, variant === 'tray' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22v14a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8V22"
  }), /*#__PURE__*/React.createElement(Counters, {
    variant: "tray",
    filled: filled,
    tone: counterTone,
    favicon: favicon
  })), variant === 'signal' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 24v12a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8V24"
  }), /*#__PURE__*/React.createElement(Counters, {
    variant: "signal",
    filled: filled,
    tone: counterTone,
    favicon: favicon
  })), variant === 'bite' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("mask", {
    id: `m${uid}`,
    stroke: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "64",
    height: "64",
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "14",
    r: "13",
    fill: "#000"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "24",
    fill: "currentColor",
    stroke: "none",
    mask: `url(#m${uid})`
  }), !favicon && /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "14",
    r: "5",
    fill: "currentColor",
    stroke: "none"
  })), variant === 'plate' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("mask", {
    id: `m${uid}`,
    stroke: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "64",
    height: "64",
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "56",
    cy: "8",
    r: "11",
    fill: "#000"
  })), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "6",
    width: "52",
    height: "52",
    rx: favicon ? 10 : 14,
    fill: "currentColor",
    stroke: "none",
    mask: `url(#m${uid})`
  }), /*#__PURE__*/React.createElement("text", {
    x: "30",
    y: favicon ? 45 : 43,
    textAnchor: "middle",
    fontFamily: "var(--font-sans)",
    fontSize: favicon ? 32 : 28,
    fontWeight: "800",
    fill: "var(--surface-raised)",
    stroke: "none"
  }, "UB")));
  const css = /*#__PURE__*/React.createElement("style", null, `
      .ub-logo-c{transition:fill var(--motion-slow) var(--ease-out),stroke var(--motion-slow) var(--ease-out)}
      .ub-logo-c--on{animation:ub-logo-fill var(--motion-slow) var(--ease-out)}
      @keyframes ub-logo-fill{from{transform:scale(.55);opacity:.35}to{transform:none;opacity:1}}
      .ub-logo-c{transform-box:fill-box;transform-origin:center}
      .ub-logo-intro{animation:ub-logo-in 620ms var(--ease-out)}
      @keyframes ub-logo-in{0%{opacity:0;transform:scale(.82) translateY(6px)}60%{opacity:1;transform:scale(1.02)}100%{transform:none}}
      .ub-lockup--intro .ub-lockup-u{stroke-dasharray:1;animation:ub-lockup-draw 400ms var(--ease-out) both}
      @keyframes ub-lockup-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
      .ub-lockup--intro .ub-lockup-w{animation:ub-lockup-word 360ms var(--ease-out) 180ms both}
      @keyframes ub-lockup-word{from{opacity:0;transform:translateX(-140px)}to{opacity:1;transform:none}}
      .ub-lockup--intro .ub-logo-c{animation:ub-logo-fill 280ms var(--ease-out) both}
      @media (prefers-reduced-motion:reduce){.ub-logo-c,.ub-logo-c--on,.ub-logo-intro,.ub-lockup--intro .ub-lockup-u,.ub-lockup--intro .ub-lockup-w,.ub-lockup--intro .ub-logo-c{animation:none;transition:none}}
    `);
  if (!withText) return /*#__PURE__*/React.createElement(React.Fragment, null, mark, css);
  // The tray-U is the U of UBite: the word follows it directly, in one drawing. `size` is the
  // lockup's height, counters included.
  if (variant === 'tray') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        ...style
      }
    }, /*#__PURE__*/React.createElement(Lockup, {
      size: size,
      filled: filled,
      counterTone: counterTone,
      colour: colour,
      wordColour: wordColour,
      intro: intro
    }), css);
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: Math.round(size * 0.28),
      ...style
    }
  }, mark, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: Math.round(size * 0.82),
      fontWeight: 'var(--weight-bold)',
      letterSpacing: '-.035em',
      color: tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-primary)',
      lineHeight: 1
    }
  }, variant === 'plate' ? 'ite' : 'UBite'), css);
}

/* The first open: the U draws itself, "Bite" slides out of it, the counters fill to the
   current level, and it is gone in a second. No logo screen, no loading bar — the home screen
   is already behind it. `pattern` lays the doodle wallpaper faintly behind the lockup. */
function LogoSplash({
  level = 'moderate',
  variant = 'tray',
  onDone,
  duration = 1000,
  pattern
}) {
  React.useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ub-splash",
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 80,
      display: 'grid',
      placeItems: 'center',
      background: 'var(--surface-page)'
    }
  }, pattern && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--accent)',
      opacity: 0.07,
      WebkitMask: `url(${pattern}) 0 0 / 375px 375px repeat`,
      mask: `url(${pattern}) 0 0 / 375px 375px repeat`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative'
    }
  }, variant === 'tray' ? /*#__PURE__*/React.createElement(Logo, {
    variant: "tray",
    size: 64,
    level: level,
    intro: true,
    withText: true
  }) : /*#__PURE__*/React.createElement(Logo, {
    variant: variant,
    size: 96,
    level: level,
    intro: true,
    withText: false
  }))), /*#__PURE__*/React.createElement("style", null, `
        .ub-splash{animation:ub-splash-out ${duration}ms var(--ease-out) forwards}
        @keyframes ub-splash-out{0%,72%{opacity:1}100%{opacity:0;visibility:hidden}}
        @media (prefers-reduced-motion:reduce){.ub-splash{animation:none;display:none}}
      `));
}
Object.assign(__ds_scope, { Logo, LogoSplash });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
/* The UBite lockup as a drop-in: the tray-U followed directly by "Bite" (logo A, chosen by the
   team on 22 Sep 2026), drawn by Logo. `mark` is the app-icon tile — the same lockup in the
   on-accent colour on a solid accent square, as on the phone's home screen.
   If the University later supplies a mandated mark, it goes beside this, not inside it. */

function Wordmark({
  size = 28,
  variant = 'full',
  tone = 'accent',
  style
}) {
  if (variant === 'mark') {
    return /*#__PURE__*/React.createElement("span", {
      "aria-label": "UBite",
      role: "img",
      style: {
        display: 'inline-grid',
        placeItems: 'center',
        flex: 'none',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: tone === 'mono' ? 'var(--text-primary)' : 'var(--accent)',
        ...style
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
      variant: "tray",
      size: Math.round(size * 0.27),
      tone: tone === 'mono' ? 'inverse' : 'on-accent',
      withText: true
    }));
  }
  if (variant === 'inline') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: Math.round(size * 0.62),
        fontWeight: 700,
        letterSpacing: '-.035em',
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: tone === 'mono' ? 'inherit' : 'var(--accent)'
      }
    }, "U"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: tone === 'inverse' ? 'var(--text-inverse)' : 'inherit'
      }
    }, "Bite"));
  }
  // `size` keeps its old meaning (the height of the type box); the lockup's cap height matches it.
  return /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    variant: "tray",
    size: Math.round(size * 0.9),
    tone: tone,
    withText: true,
    style: style
  });
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
/* Lucide 0.x outline set, copied into assets/icons/ and inlined here so a glyph inherits
   currentColor and needs no network request. 24x24 grid, 2px stroke, round caps.
   UBite uses no other icon system and no emoji. */
const GLYPHS = {
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>",
  "ban": "<path d=\"M4.929 4.929 19.07 19.071\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "bell": "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"></path> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"></path>",
  "calendar": "<path d=\"M8 2v3\"></path> <path d=\"M16 2v3\"></path> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"></rect> <path d=\"M3 9h18\"></path>",
  "camera": "<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"></path> <circle cx=\"12\" cy=\"13\" r=\"3\"></circle>",
  "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"></path> <path d=\"M18 17V9\"></path> <path d=\"M13 17V5\"></path> <path d=\"M8 17v-3\"></path>",
  "check": "<path d=\"M20 6 9 17l-5-5\"></path>",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\"></path>",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\"></path>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"></path>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"></line> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"></line>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"m16 9-5.5 5.5L8 12\"></path>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 6v6l4 2\"></path>",
  "cookie": "<path d=\"M11 17h.01\"></path> <path d=\"M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2\"></path> <path d=\"M12 12h.01\"></path> <path d=\"M16 16h.01\"></path> <path d=\"M16 3h.01\"></path> <path d=\"M21 4h.01\"></path> <path d=\"M21 8h.01\"></path> <path d=\"M7 14h.01\"></path> <path d=\"M9 8h.01\"></path>",
  "cup-soda": "<path d=\"m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8\"></path> <path d=\"M5 8h14\"></path> <path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"></path> <path d=\"m12 8 1-6h2\"></path>",
  "download": "<path d=\"M12 15V3\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path> <path d=\"m7 10 5 5 5-5\"></path>",
  "egg": "<path d=\"M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12\"></path>",
  "face-neutral": "<path d=\"M15 10V9\"></path> <path d=\"M8 16h8\"></path> <path d=\"M9 10V9\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "face-slightly-frowning": "<path d=\"M15 10V9\"></path> <path d=\"M9 10V9\"></path> <path d=\"M9 16a5 5 0 016 0\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "face-slightly-smiling": "<path d=\"M15 10V9\"></path> <path d=\"M16.472 15a6 6 0 01-8.943 0\"></path> <path d=\"M9 10V9\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "fish": "<path d=\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\"></path> <path d=\"M18 12v.5\"></path> <path d=\"M16 17.93a9.77 9.77 0 0 1 0-11.86\"></path> <path d=\"M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\"></path> <path d=\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4\"></path> <path d=\"m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\"></path>",
  "gift": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"></rect> <path d=\"M12 8v13\"></path> <path d=\"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7\"></path> <path d=\"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5\"></path>",
  "heart": "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"></path>",
  "image-plus": "<path d=\"M16 5h6\"></path> <path d=\"M19 2v6\"></path> <path d=\"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5\"></path> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"></path> <circle cx=\"9\" cy=\"9\" r=\"2\"></circle>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 16v-4\"></path> <path d=\"M12 8h.01\"></path>",
  "languages": "<path d=\"m5 8 6 6\"></path> <path d=\"m4 14 6-6 2-3\"></path> <path d=\"M2 5h12\"></path> <path d=\"M7 2h1\"></path> <path d=\"m22 22-5-10-5 10\"></path> <path d=\"M14 18h6\"></path>",
  "leaf": "<path d=\"M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20\"></path> <path d=\"M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13\"></path>",
  "loader-circle": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\"></path>",
  "log-in": "<path d=\"m10 17 5-5-5-5\"></path> <path d=\"M15 12H3\"></path> <path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"></path>",
  "log-out": "<path d=\"m16 17 5-5-5-5\"></path> <path d=\"M21 12H9\"></path> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path>",
  "mail": "<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\"></path> <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"></rect>",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"></path> <circle cx=\"12\" cy=\"10\" r=\"3\"></circle>",
  "megaphone": "<path d=\"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\"></path> <path d=\"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14\"></path> <path d=\"M8 6v8\"></path>",
  "milk": "<path d=\"M8 2h8\"></path> <path d=\"M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2\"></path> <path d=\"M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"></path>",
  "milk-off": "<path d=\"M8 2h8\"></path> <path d=\"M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3\"></path> <path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435\"></path> <line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"></line>",
  "minus": "<path d=\"M5 12h14\"></path>",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path> <path d=\"m15 5 4 4\"></path>",
  "plus": "<path d=\"M5 12h14\"></path> <path d=\"M12 5v14\"></path>",
  "qr-code": "<rect width=\"5\" height=\"5\" x=\"3\" y=\"3\" rx=\"1\"></rect> <rect width=\"5\" height=\"5\" x=\"16\" y=\"3\" rx=\"1\"></rect> <rect width=\"5\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"></rect> <path d=\"M21 16h-3a2 2 0 0 0-2 2v3\"></path> <path d=\"M21 21v.01\"></path> <path d=\"M12 7v3a2 2 0 0 1-2 2H7\"></path> <path d=\"M3 12h.01\"></path> <path d=\"M12 3h.01\"></path> <path d=\"M12 16v.01\"></path> <path d=\"M16 12h1\"></path> <path d=\"M21 12v.01\"></path> <path d=\"M12 21v-1\"></path>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"></path> <path d=\"M21 3v5h-5\"></path> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"></path> <path d=\"M8 16H3v5\"></path>",
  "salad": "<path d=\"M7 21h10\"></path> <path d=\"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z\"></path> <path d=\"M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1\"></path> <path d=\"m13 12 4-4\"></path> <path d=\"M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2\"></path>",
  "scan-line": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\"></path> <path d=\"M17 3h2a2 2 0 0 1 2 2v2\"></path> <path d=\"M21 17v2a2 2 0 0 1-2 2h-2\"></path> <path d=\"M7 21H5a2 2 0 0 1-2-2v-2\"></path> <path d=\"M7 12h10\"></path>",
  "search": "<path d=\"m21 21-4.34-4.34\"></path> <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>",
  "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"></path> <circle cx=\"12\" cy=\"12\" r=\"3\"></circle>",
  "share": "<path d=\"M12 2v13\"></path> <path d=\"m16 6-4-4-4 4\"></path> <path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"></path>",
  "sliders-horizontal": "<path d=\"M10 5H3\"></path> <path d=\"M12 19H3\"></path> <path d=\"M14 3v4\"></path> <path d=\"M16 17v4\"></path> <path d=\"M21 12h-9\"></path> <path d=\"M21 19h-5\"></path> <path d=\"M21 5h-7\"></path> <path d=\"M8 10v4\"></path> <path d=\"M8 12H3\"></path>",
  "soup": "<path d=\"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z\"></path> <path d=\"M7 21h10\"></path> <path d=\"M19.5 12 22 6\"></path> <path d=\"M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62\"></path> <path d=\"M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62\"></path> <path d=\"M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62\"></path>",
  "sprout": "<path d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3\"></path> <path d=\"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4\"></path> <path d=\"M5 21h14\"></path>",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"></path>",
  "trash": "<path d=\"M10 11v6\"></path> <path d=\"M14 11v6\"></path> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path> <path d=\"M3 6h18\"></path> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>",
  "trending-up": "<path d=\"M16 7h6v6\"></path> <path d=\"m22 7-8.5 8.5-5-5L2 17\"></path>",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"></path> <path d=\"M12 9v4\"></path> <path d=\"M12 17h.01\"></path>",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"></path> <circle cx=\"12\" cy=\"7\" r=\"4\"></circle>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"></path> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"></path> <circle cx=\"9\" cy=\"7\" r=\"4\"></circle>",
  "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"></path> <path d=\"M7 2v20\"></path> <path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"></path>",
  "wheat": "<path d=\"M2 22 16 8\"></path> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"></path> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path>",
  "wheat-off": "<path d=\"m2 22 10-10\"></path> <path d=\"m16 8-1.17 1.17\"></path> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97\"></path> <path d=\"M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62\"></path> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"></path> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98\"></path> <path d=\"M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28\"></path> <line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"></line>",
  "wifi-off": "<path d=\"M12 20h.01\"></path> <path d=\"M8.5 16.429a5 5 0 0 1 7 0\"></path> <path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\"></path> <path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\"></path> <path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\"></path> <path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\"></path> <path d=\"m2 2 20 20\"></path>",
  "x": "<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>"
};
function Icon({
  name,
  size = 20,
  stroke = 2,
  label,
  style,
  ...rest
}) {
  const d = GLYPHS[name];
  if (!d) return null;
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: label ? 'img' : undefined,
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    focusable: "false",
    style: {
      display: 'block',
      flex: 'none',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: d
    },
    ...rest
  });
}
Object.assign(__ds_scope, { GLYPHS, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const SIZES = {
  sm: {
    fontSize: 'var(--text-sm)',
    padding: '0 12px',
    height: 36,
    gap: 6
  },
  md: {
    fontSize: 'var(--text-base)',
    padding: '0 16px',
    height: 44,
    gap: 8
  },
  lg: {
    fontSize: 'var(--text-md)',
    padding: '0 22px',
    height: 52,
    gap: 10
  },
  kiosk: {
    fontSize: 'var(--text-xl)',
    padding: '0 32px',
    height: 72,
    gap: 12
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)'
  },
  secondary: {
    background: 'var(--accent-quiet)',
    color: 'var(--accent-quiet-text)'
  },
  quiet: {
    background: 'transparent',
    color: 'var(--text-secondary)'
  },
  danger: {
    background: 'var(--status-danger-fill)',
    color: '#FFFFFF'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  error = false,
  fullWidth = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: off ? undefined : onClick,
    disabled: off,
    "aria-busy": loading || undefined,
    className: `ub-btn ub-btn--${variant}`,
    style: {
      ...v,
      ...s,
      minHeight: s.height,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: fullWidth ? '100%' : undefined,
      border: 0,
      borderRadius: 'var(--radius-sm)',
      cursor: off ? 'not-allowed' : 'pointer',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '.005em',
      opacity: disabled ? 0.45 : 1,
      boxShadow: error ? 'inset 0 0 0 2px var(--status-danger-fill)' : undefined,
      transition: 'background var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out)',
      ...style
    },
    ...rest
  }, loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader-circle",
    size: size === 'sm' ? 16 : 18,
    style: {
      animation: 'ub-spin 900ms linear infinite',
      marginRight: s.gap
    }
  }) : iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: size === 'sm' ? 16 : 18,
    style: {
      marginRight: s.gap
    }
  }), /*#__PURE__*/React.createElement("span", null, children), iconRight && !loading && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: size === 'sm' ? 16 : 18,
    style: {
      marginLeft: s.gap
    }
  })), /*#__PURE__*/React.createElement("style", null, `
        @keyframes ub-spin{to{transform:rotate(360deg)}}
        .ub-btn:not(:disabled):hover.ub-btn--primary{background:var(--accent-hover)}
        .ub-btn:not(:disabled):active.ub-btn--primary{background:var(--accent-active);transform:translateY(1px)}
        .ub-btn:not(:disabled):hover.ub-btn--secondary{background:color-mix(in oklab,var(--accent-quiet) 84%,var(--text-primary))}
        .ub-btn:not(:disabled):active.ub-btn--secondary{transform:translateY(1px)}
        .ub-btn:not(:disabled):hover.ub-btn--quiet{background:var(--hover-wash);color:var(--text-primary)}
        .ub-btn:not(:disabled):active.ub-btn--quiet{background:var(--active-wash)}
        .ub-btn:not(:disabled):hover.ub-btn--danger{filter:brightness(1.08)}
        @media (prefers-reduced-motion:reduce){.ub-btn{transition:none}.ub-btn:active{transform:none}}
      `));
}
function IconButton({
  name,
  label,
  size = 'md',
  variant = 'quiet',
  onClick,
  disabled,
  style,
  ...rest
}) {
  const box = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const v = VARIANTS[variant] || VARIANTS.quiet;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    disabled: disabled,
    "aria-label": label,
    className: `ub-btn ub-btn--${variant}`,
    style: {
      ...v,
      width: box,
      height: box,
      minHeight: box,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 0,
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      padding: 0,
      transition: 'background var(--motion-fast) var(--ease-out)',
      ...style
    },
    ...rest
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: size === 'sm' ? 18 : size === 'lg' ? 26 : 20
  }));
}
Object.assign(__ds_scope, { Button, IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/* Separation is by surface VALUE, never by border or shadow.
   Exactly two elevations exist: 1 = --surface (sections, rows), 2 = --surface-raised
   (the crowding hero, sheets). Anything that needs a third level needs rethinking. */

function Card({
  children,
  elevation = 1,
  padding = 'md',
  radius = 'md',
  as = 'div',
  style,
  ...rest
}) {
  const Tag = as;
  const pad = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28
  }[padding] ?? 16;
  return /*#__PURE__*/React.createElement(Tag, {
    style: {
      background: elevation === 2 ? 'var(--surface-raised)' : 'var(--surface)',
      borderRadius: radius === 'lg' ? 'var(--radius-lg)' : radius === 'sm' ? 'var(--radius-sm)' : 'var(--radius-md)',
      padding: pad,
      ...style
    },
    ...rest
  }, children);
}
function SectionHeader({
  title,
  meta,
  icon,
  action,
  density = 'zone-2'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: `var(--density-${density})`
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-tight)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    style: {
      color: 'var(--text-muted)'
    }
  }), title), meta && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, meta), action);
}
Object.assign(__ds_scope, { Card, SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/* Chip = a filter the user can toggle. Badge = a read-only status marker.
   They look different on purpose: a chip is tappable (44px target), a badge is not. */

function Chip({
  children,
  selected = false,
  disabled = false,
  icon,
  count,
  onClick,
  size = 'md'
}) {
  const h = size === 'sm' ? 32 : 40;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    "aria-pressed": selected,
    className: "ub-chip",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: h,
      minHeight: h,
      padding: size === 'sm' ? '0 10px' : '0 14px',
      borderRadius: 'var(--radius-pill)',
      border: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      fontSize: size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)',
      fontWeight: 'var(--weight-medium)',
      opacity: disabled ? 0.45 : 1,
      background: selected ? 'var(--accent)' : 'var(--surface-raised)',
      color: selected ? 'var(--text-on-accent)' : 'var(--text-secondary)',
      boxShadow: selected ? 'none' : 'inset 0 0 0 1px var(--border-subtle)',
      transition: 'background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }), children, count != null && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-xs)',
      opacity: .75
    }
  }, count), selected && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })), /*#__PURE__*/React.createElement("style", null, `.ub-chip:not(:disabled):hover{background:var(--hover-wash)}.ub-chip[aria-pressed="true"]:hover{background:var(--accent-hover)}.ub-chip:not(:disabled):active{transform:translateY(1px)}@media (prefers-reduced-motion:reduce){.ub-chip{transition:none}.ub-chip:active{transform:none}}`));
}
const BADGE_TONES = {
  neutral: {
    bg: 'var(--surface-sunken)',
    fg: 'var(--text-secondary)'
  },
  accent: {
    bg: 'var(--accent-quiet)',
    fg: 'var(--accent-quiet-text)'
  },
  low: {
    bg: 'var(--crowd-low-quiet)',
    fg: 'var(--crowd-low-text)'
  },
  moderate: {
    bg: 'var(--crowd-moderate-quiet)',
    fg: 'var(--crowd-moderate-text)'
  },
  high: {
    bg: 'var(--crowd-high-quiet)',
    fg: 'var(--crowd-high-text)'
  },
  warning: {
    bg: 'var(--status-warning-quiet)',
    fg: 'var(--status-warning-text)'
  },
  danger: {
    bg: 'var(--status-danger-quiet)',
    fg: 'var(--status-danger-text)'
  },
  success: {
    bg: 'var(--status-success-quiet)',
    fg: 'var(--status-success-text)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  icon,
  size = 'md'
}) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius: 'var(--radius-xs)',
      background: t.bg,
      color: t.fg,
      fontSize: size === 'sm' ? 'var(--text-2xs)' : 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '.01em',
      whiteSpace: 'nowrap'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13,
    stroke: 2.25
  }), children);
}

/* Dietary information is a claim about food safety: it always carries a word,
   never a colour or a glyph alone. The first six kinds are the docs/05 `dish_diet_tags`;
   they originate from the canteen, never from the team. */
function DietaryTag({
  kind = 'vegetarian',
  lang = 'ro',
  size = 'md'
}) {
  const MAP = {
    vegetarian: {
      icon: 'leaf',
      ro: 'Vegetarian',
      en: 'Vegetarian'
    },
    vegan: {
      icon: 'salad',
      ro: 'Vegan',
      en: 'Vegan'
    },
    fasting: {
      icon: 'sprout',
      ro: 'De post',
      en: 'Fasting'
    },
    no_pork: {
      icon: 'ban',
      ro: 'Fără porc',
      en: 'No pork'
    },
    gluten_free: {
      icon: 'wheat-off',
      ro: 'Fără gluten',
      en: 'Gluten-free'
    },
    lactose_free: {
      icon: 'milk-off',
      ro: 'Fără lactoză',
      en: 'Lactose-free'
    },
    gluten: {
      icon: 'wheat',
      ro: 'Conține gluten',
      en: 'Contains gluten'
    },
    lactose: {
      icon: 'milk',
      ro: 'Conține lactoză',
      en: 'Contains lactose'
    },
    egg: {
      icon: 'egg',
      ro: 'Conține ou',
      en: 'Contains egg'
    },
    fish: {
      icon: 'fish',
      ro: 'Conține pește',
      en: 'Contains fish'
    },
    pork: {
      icon: 'utensils',
      ro: 'Conține porc',
      en: 'Contains pork'
    },
    unknown: {
      icon: 'circle-alert',
      ro: 'Informație indisponibilă',
      en: 'Information not available'
    }
  };
  const m = MAP[kind] || MAP.unknown;
  const tone = kind === 'vegetarian' || kind === 'vegan' || kind === 'fasting' ? 'success' : kind === 'unknown' ? 'warning' : 'neutral';
  return /*#__PURE__*/React.createElement(Badge, {
    tone: tone,
    icon: m.icon,
    size: size
  }, m[lang] || m.ro);
}
Object.assign(__ds_scope, { Chip, Badge, DietaryTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
/* 16px minimum font size, always — below that iOS zooms the field on focus. */

function Input({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled = false,
  loading = false,
  type = 'text',
  suffix,
  icon,
  id,
  inputMode,
  lang = 'ro',
  ...rest
}) {
  const fid = id || `ub-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "ub-field",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 48,
      padding: '0 12px',
      background: 'var(--surface-raised)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: `inset 0 0 0 ${error ? 2 : 1}px ${error ? 'var(--status-danger-fill)' : 'var(--border-subtle)'}`,
      opacity: disabled ? 0.5 : 1,
      transition: 'box-shadow var(--motion-fast) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    id: fid,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    inputMode: inputMode,
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? `${fid}-msg` : undefined,
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 'none',
      background: 'transparent',
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      height: '100%'
    },
    ...rest
  }), loading && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader-circle",
    size: 16,
    style: {
      color: 'var(--text-muted)',
      animation: 'ub-spin 900ms linear infinite'
    }
  }), suffix && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)'
    }
  }, suffix)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    id: `${fid}-msg`,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 'var(--text-sm)',
      color: error ? 'var(--status-danger-text)' : 'var(--text-muted)'
    }
  }, error && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-alert",
    size: 14,
    stroke: 2.25
  }), error || hint)), /*#__PURE__*/React.createElement("style", null, `.ub-field:focus-within{box-shadow:inset 0 0 0 2px var(--accent),0 0 0 3px var(--focus-ring)}@keyframes ub-spin{to{transform:rotate(360deg)}}`));
}
function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-xs)',
  style
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ub-skel",
    "aria-hidden": "true",
    style: {
      width,
      height,
      borderRadius: radius,
      background: 'var(--skeleton-base)',
      flex: 'none',
      ...style
    }
  }), /*#__PURE__*/React.createElement("style", null, `
        .ub-skel{position:relative;overflow:hidden}
        .ub-skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--skeleton-sheen),transparent);animation:ub-sheen var(--skeleton-cycle) var(--ease-in-out) infinite}
        @media (prefers-reduced-motion:reduce){.ub-skel::after{animation:none;display:none}}
        @keyframes ub-sheen{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}
      `));
}
Object.assign(__ds_scope, { Input, Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/crowding/CrowdingIndicator.jsx
try { (() => {
/* The signature component. Three rules it never breaks:
   1. the level is a WORD, always — colour is only ever a second carrier
   2. the estimate carries its age
   3. a quality badge appears ONLY when the estimate is degraded, so it means something

   The aura behind the card is the fourth, redundant carrier: a colour field that GROWS and
   warms as the queue grows. It is decorative reinforcement of information that is already
   spelled out in words — never the carrier itself. */

const LEVELS = ['low', 'moderate', 'high'];
const COPY = {
  ro: {
    eyebrow: 'Coada acum',
    low: 'Mică',
    moderate: 'Medie',
    high: 'Mare',
    // Romanian counts: un minut · 2–19 minute · 20 de minute and up.
    wait: m => m <= 1 ? 'Aștepți cam un minut' : m >= 20 ? `Aștepți cam ${m} de minute` : `Aștepți cam ${m} minute`,
    waitShort: m => `~${m} min`,
    updated: s => s < 60 ? `actualizat acum ${s}s` : `actualizat acum ${Math.round(s / 60)} min`,
    degraded: 'aproximativ',
    estimated: 'obișnuit la ora asta',
    closedTitle: 'Închis',
    closedNext: t => `Se deschide ${t}`,
    hours: 'L–V 11:30–17:00',
    noData: 'Nu avem date acum',
    report: 'Cât ai așteptat?'
  },
  en: {
    eyebrow: 'Queue right now',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    wait: m => m <= 1 ? "You'll wait about a minute" : `You'll wait about ${m} minutes`,
    waitShort: m => `~${m} min`,
    updated: s => s < 60 ? `updated ${s}s ago` : `updated ${Math.round(s / 60)} min ago`,
    degraded: 'approximate',
    estimated: 'usual for this time',
    closedTitle: 'Closed',
    closedNext: t => `Opens ${t}`,
    hours: 'Mon–Fri 11:30–17:00',
    noData: 'No estimate right now',
    report: 'How long did you wait?'
  }
};
const SIZES = {
  hero: {
    pad: 26,
    word: 'var(--text-display)',
    wait: 'var(--text-xl)',
    meta: 'var(--text-sm)',
    glyph: 44,
    radius: 'var(--radius-lg)'
  },
  compact: {
    pad: 14,
    word: 'var(--text-xl)',
    wait: 'var(--text-base)',
    meta: 'var(--text-xs)',
    glyph: 20,
    radius: 'var(--radius-md)'
  },
  kiosk: {
    pad: 56,
    word: 'var(--text-display-kiosk)',
    wait: 'var(--text-3xl)',
    meta: 'var(--text-xl)',
    glyph: 104,
    radius: 'var(--radius-lg)'
  }
};
const AURA = {
  low: 0.52,
  moderate: 0.82,
  high: 1.18,
  closed: 0.4
};
function tone(level) {
  const l = LEVELS.includes(level) ? level : 'closed';
  return {
    text: `var(--crowd-${l}-text)`,
    fill: `var(--crowd-${l}-fill)`,
    quiet: `var(--crowd-${l}-quiet)`
  };
}

/* The three figures stand together, overlapping, and arrive one after another. */
function PersonMeter({
  level,
  size = 28,
  lang = 'ro',
  align = 'center'
}) {
  const active = LEVELS.indexOf(level) + 1;
  const t = tone(level);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    key: level,
    className: "ub-meter",
    style: {
      display: 'flex',
      justifyContent: align,
      alignItems: 'flex-end',
      paddingLeft: Math.round(size * 0.3)
    },
    "aria-hidden": "true"
  }, [1, 2, 3].map(n => {
    const on = n <= active;
    return /*#__PURE__*/React.createElement("span", {
      key: n,
      className: `ub-meter-p${on ? ' ub-meter-p--on' : ''}`,
      style: {
        marginLeft: -Math.round(size * 0.3),
        animationDelay: `${(n - 1) * 70}ms`,
        color: on ? t.fill : 'var(--text-muted)',
        filter: on ? 'none' : 'none'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "user",
      size: size,
      stroke: on ? 2.25 : 1.75
    }));
  })), /*#__PURE__*/React.createElement("style", null, `
        .ub-meter-p{display:block;transition:color var(--motion-slow) var(--ease-out)}
        .ub-meter .ub-meter-p{animation:ub-person-in var(--motion-slow) var(--ease-out) backwards}
        @keyframes ub-person-in{from{opacity:0;transform:translateY(8px) scale(.82)}to{opacity:1;transform:none}}
        .ub-meter-p--on{animation-name:ub-person-in}
        @media (prefers-reduced-motion:reduce){.ub-meter .ub-meter-p{animation:none}.ub-meter-p{transition:none}}
      `));
}
function QualityBadge({
  quality,
  lang = 'ro'
}) {
  if (quality === 'live') return null;
  const c = COPY[lang] || COPY.ro;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 9px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--status-warning-quiet)',
      color: 'var(--status-warning-text)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '.01em',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-alert",
    size: 13,
    stroke: 2.25
  }), quality === 'estimated' ? c.estimated : c.degraded);
}
function FreshnessStamp({
  seconds = 0,
  quality = 'live',
  stale = false,
  lang = 'ro',
  size = 'var(--text-sm)'
}) {
  const c = COPY[lang] || COPY.ro;
  const live = quality === 'live' && !stale;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: size,
      color: stale ? 'var(--status-warning-text)' : 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: live ? 'ub-pulse' : undefined,
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      flex: 'none',
      background: live ? 'var(--crowd-low-fill)' : 'var(--border-strong)'
    }
  }), c.updated(seconds)), /*#__PURE__*/React.createElement("style", null, `
        .ub-pulse{position:relative}
        .ub-pulse::after{content:"";position:absolute;inset:0;border-radius:50%;background:inherit;animation:ub-ping 2.4s var(--ease-out) infinite}
        @keyframes ub-ping{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.6);opacity:0}}
        @media (prefers-reduced-motion:reduce){.ub-pulse::after{animation:none;display:none}}
      `));
}
function CrowdingIndicator({
  level = 'moderate',
  waitMinutes = 6,
  quality = 'live',
  updatedSecondsAgo = 40,
  size = 'hero',
  lang = 'ro',
  opensAtLabel = 'mâine la 11:30',
  hoursLabel,
  loading = false,
  error = false,
  onReport,
  surface = 'raised',
  underlay = null
}) {
  const s = SIZES[size] || SIZES.hero;
  const c = COPY[lang] || COPY.ro;
  // The schedule is configurable without a deploy (docs/05 canteen_schedule): the real hours
  // come in from the caller; the copy above is only the confirmed default.
  const hours = hoursLabel || c.hours;
  const closed = level === 'closed';
  const t = tone(level);
  const hero = size === 'hero' || size === 'kiosk';

  // surface="glass": the card turns translucent and the caller's underlay (a glass layer) sits
  // between the level's colour field and the words — the colour becomes part of the glass.
  const glass = surface === 'glass';
  const layer = content => glass ? /*#__PURE__*/React.createElement(React.Fragment, null, underlay, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, content)) : content;
  const shell = {
    background: glass ? 'color-mix(in srgb, var(--surface-raised) 28%, transparent)' : 'var(--surface-raised)',
    borderRadius: s.radius,
    padding: s.pad,
    // Glass must see the page through the card, so the card is not a stacking context of its own
    // (its colour field then sits behind the page's content, clipped to the card).
    position: 'relative',
    overflow: 'hidden',
    isolation: glass ? 'auto' : 'isolate'
  };
  const aura = hero && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    className: glass ? 'ub-aura ub-aura--glass' : 'ub-aura',
    style: {
      position: 'absolute',
      left: '50%',
      top: size === 'kiosk' ? '46%' : '38%',
      width: size === 'kiosk' ? 900 : 420,
      height: size === 'kiosk' ? 900 : 420,
      marginLeft: size === 'kiosk' ? -450 : -210,
      marginTop: size === 'kiosk' ? -450 : -210,
      borderRadius: '50%',
      background: t.fill,
      zIndex: -1,
      transform: `scale(${AURA[LEVELS.includes(level) ? level : 'closed']})`
    }
  });
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: shell,
      "aria-busy": "true"
    }, layer(/*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignItems: hero ? 'center' : 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: 104,
      height: 13
    }), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: hero ? 96 : 52,
      height: hero ? 44 : 20,
      radius: "var(--radius-md)"
    }), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: hero ? '52%' : '64%',
      height: hero ? 46 : 22,
      radius: "var(--radius-sm)"
    }), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: hero ? '68%' : '42%',
      height: 20
    }), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: 148,
      height: 14
    }))));
  }
  if (error) {
    return /*#__PURE__*/React.createElement("div", {
      style: shell,
      role: "status"
    }, layer(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "ub-eyebrow"
    }, c.eyebrow), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "triangle-alert",
      size: 24,
      style: {
        color: 'var(--status-warning-text)',
        marginTop: 2
      }
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-semibold)'
      }
    }, c.noData), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        marginTop: 2
      }
    }, hours))))));
  }
  if (closed) {
    return /*#__PURE__*/React.createElement("div", {
      style: shell
    }, aura, layer(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "ub-eyebrow"
    }, c.eyebrow), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "clock",
      size: 18,
      style: {
        color: 'var(--text-muted)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: hero ? 'center' : 'left',
        marginTop: hero ? 18 : 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: s.word,
        lineHeight: 'var(--leading-tight)',
        letterSpacing: 'var(--tracking-display)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--crowd-closed-text)'
      }
    }, c.closedTitle), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: s.wait,
        color: 'var(--text-primary)',
        fontWeight: 'var(--weight-medium)',
        marginTop: 6
      }
    }, c.closedNext(opensAtLabel)), /*#__PURE__*/React.createElement("div", {
      className: "ub-numeric",
      style: {
        fontSize: s.meta,
        color: 'var(--text-muted)',
        marginTop: 10
      }
    }, hours)))));
  }
  if (!hero) {
    return /*#__PURE__*/React.createElement("div", {
      style: shell
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(PersonMeter, {
      level: level,
      size: s.glyph,
      align: "flex-start"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      key: level,
      className: "ub-crowd-word",
      style: {
        fontSize: s.word,
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-tight)',
        color: t.text,
        lineHeight: 1.1
      }
    }, c[level]), /*#__PURE__*/React.createElement("div", {
      className: "ub-numeric",
      style: {
        fontSize: s.wait,
        color: 'var(--text-secondary)'
      }
    }, c.waitShort(waitMinutes))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 'auto',
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement(QualityBadge, {
      quality: quality,
      lang: lang
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement(FreshnessStamp, {
      seconds: updatedSecondsAgo,
      quality: quality,
      lang: lang,
      size: s.meta
    })))), /*#__PURE__*/React.createElement("style", null, `.ub-crowd-word{animation:ub-crowd-in var(--motion-slow) var(--ease-out)}@keyframes ub-crowd-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.ub-crowd-word{animation:none}}`));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: shell
  }, aura, layer(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-eyebrow"
  }, c.eyebrow), /*#__PURE__*/React.createElement(QualityBadge, {
    quality: quality,
    lang: lang
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: size === 'kiosk' ? 24 : 16
    }
  }, /*#__PURE__*/React.createElement(PersonMeter, {
    level: level,
    size: s.glyph
  }), /*#__PURE__*/React.createElement("div", {
    key: level,
    className: "ub-crowd-word",
    style: {
      fontSize: s.word,
      lineHeight: 'var(--leading-tight)',
      letterSpacing: 'var(--tracking-display)',
      fontWeight: 'var(--weight-bold)',
      color: t.text,
      marginTop: size === 'kiosk' ? 16 : 8
    }
  }, c[level]), /*#__PURE__*/React.createElement("div", {
    className: "ub-numeric",
    style: {
      fontSize: s.wait,
      color: 'var(--text-primary)',
      fontWeight: 'var(--weight-medium)',
      marginTop: 4
    }
  }, c.wait(waitMinutes))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: size === 'kiosk' ? 28 : 18
    }
  }, /*#__PURE__*/React.createElement(FreshnessStamp, {
    seconds: updatedSecondsAgo,
    quality: quality,
    lang: lang,
    size: s.meta
  }), onReport && size !== 'kiosk' && /*#__PURE__*/React.createElement("button", {
    onClick: onReport,
    className: "ub-crowd-report",
    style: {
      background: 'transparent',
      border: 0,
      padding: '6px 2px',
      minHeight: 'auto',
      color: 'var(--accent)',
      fontSize: s.meta,
      fontWeight: 'var(--weight-semibold)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, c.report)))), /*#__PURE__*/React.createElement("style", null, `
        .ub-aura{opacity:.16;filter:blur(46px);transition:transform var(--motion-slow) var(--ease-out),background var(--motion-slow) var(--ease-out)}
        :root[data-theme="dark"] .ub-aura{opacity:.3}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-aura{opacity:.3}}
        .ub-aura.ub-aura--glass{opacity:.42;filter:blur(34px)}
        :root[data-theme="dark"] .ub-aura.ub-aura--glass{opacity:.62}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-aura.ub-aura--glass{opacity:.62}}
        .ub-crowd-word{animation:ub-crowd-in var(--motion-slow) var(--ease-out)}
        @keyframes ub-crowd-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
        .ub-crowd-report:hover{text-decoration:underline;text-underline-offset:3px}
        @media (prefers-reduced-motion:reduce){.ub-crowd-word{animation:none}.ub-aura{transition:none}}
      `));
}
Object.assign(__ds_scope, { PersonMeter, QualityBadge, FreshnessStamp, CrowdingIndicator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/crowding/CrowdingIndicator.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/* Every screen defines loading, empty, stale, offline and error. These are those states. */

/* `art` is a line illustration (an SVG from assets/illustrations/). It is drawn through a CSS
   mask so it takes the accent colour and follows the theme; without it the icon stands in. */
function EmptyState({
  icon = 'utensils',
  art,
  title,
  body,
  action,
  onAction,
  compact = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
      padding: compact ? '20px 16px' : '32px 20px',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)'
    }
  }, art ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: compact ? 96 : 136,
      height: compact ? 96 : 136,
      marginBottom: 4,
      background: 'var(--accent)',
      WebkitMask: `url(${art}) center / contain no-repeat`,
      mask: `url(${art}) center / contain no-repeat`
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: compact ? 22 : 28,
    style: {
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: compact ? 'var(--text-base)' : 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)',
      maxWidth: '46ch'
    }
  }, body), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: onAction
  }, action)));
}
function OfflineBanner({
  lang = 'ro',
  updatedLabel,
  variant = 'offline',
  onRetry,
  queued
}) {
  const t = lang === 'ro' ? {
    offline: 'Ești offline. Arătăm ce am salvat ultima dată.',
    stale: 'Datele sunt vechi.',
    error: 'Nu am putut încărca. Încearcă din nou.',
    retry: 'Reîncarcă',
    queuedLabel: n => `${n} acțiuni trimise când revine semnalul`
  } : {
    offline: 'You are offline. Showing what we last saved.',
    stale: 'This data is old.',
    error: 'We could not load that. Try again.',
    retry: 'Reload',
    queuedLabel: n => `${n} actions will be sent when you are back online`
  };
  const tone = variant === 'error' ? {
    bg: 'var(--status-danger-quiet)',
    fg: 'var(--status-danger-text)',
    icon: 'triangle-alert'
  } : variant === 'stale' ? {
    bg: 'var(--status-warning-quiet)',
    fg: 'var(--status-warning-text)',
    icon: 'clock'
  } : {
    bg: 'var(--status-offline-fill)',
    fg: 'var(--status-offline-text)',
    icon: 'wifi-off'
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      background: tone.bg,
      color: tone.fg,
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-sm)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: tone.icon,
    size: 17,
    stroke: 2.25
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: '14ch'
    }
  }, t[variant] || t.offline, updatedLabel && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      opacity: .85
    }
  }, " ", updatedLabel), queued != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      opacity: .85
    }
  }, t.queuedLabel(queued))), onRetry && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRetry,
    style: {
      background: 'transparent',
      border: 0,
      color: 'inherit',
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      fontWeight: 'var(--weight-semibold)',
      cursor: 'pointer',
      fontSize: 'var(--text-sm)',
      minHeight: 'auto',
      padding: '4px 0'
    }
  }, t.retry));
}

/* Zone 4: one interaction, then straight back to where the user was. */
function WaitReport({
  options = [2, 5, 10, 15],
  lang = 'ro',
  onSubmit,
  state = 'idle'
}) {
  const t = lang === 'ro' ? {
    q: 'Cât ai așteptat?',
    other: 'Altă durată',
    thanks: 'Mulțumim. Estimarea s-a actualizat.',
    sending: 'Se trimite…',
    min: 'min'
  } : {
    q: 'How long did you wait?',
    other: 'Another time',
    thanks: 'Thanks. The estimate just moved.',
    sending: 'Sending…',
    min: 'min'
  };
  if (state === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px',
        background: 'var(--status-success-quiet)',
        color: 'var(--status-success-text)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-base)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "circle-check",
      size: 19,
      stroke: 2.25
    }), t.thanks);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)',
      marginBottom: 12
    }
  }, t.q), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, options.map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    type: "button",
    className: "ub-wait",
    disabled: state === 'sending',
    onClick: () => onSubmit && onSubmit(m),
    style: {
      minWidth: 64,
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 'var(--radius-sm)',
      border: 0,
      background: 'var(--surface-raised)',
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      cursor: 'pointer',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, m, " ", t.min)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ub-wait",
    onClick: () => onSubmit && onSubmit(null),
    style: {
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 'var(--radius-sm)',
      border: 0,
      background: 'transparent',
      color: 'var(--accent)',
      cursor: 'pointer',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, state === 'sending' ? t.sending : t.other))), /*#__PURE__*/React.createElement("style", null, `.ub-wait:hover:not(:disabled){background:var(--hover-wash)}.ub-wait:active:not(:disabled){transform:translateY(1px)}@media (prefers-reduced-motion:reduce){.ub-wait:active{transform:none}}`));
}

/* Zone 5: typical crowding by hour. Hidden entirely in pilot week one —
   a flat, wrong chart costs more trust than an absent section. */
function CrowdingByHour({
  data = [],
  nowIndex,
  lang = 'ro',
  height = 72,
  labelEvery
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  // A whole opening day is ten or eleven half-hours: at 400px only every other label fits. The
  // current slot always keeps its label; its neighbours give way so the two never touch.
  const every = labelEvery || (data.length > 8 ? 2 : 1);
  const showLabel = i => i === nowIndex || i % every === 0 && (nowIndex == null || Math.abs(i - nowIndex) >= every);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 4,
      height
    }
  }, data.map((d, i) => {
    const level = d.value / max;
    const tone = level > 0.66 ? 'var(--crowd-high-fill)' : level > 0.33 ? 'var(--crowd-moderate-fill)' : 'var(--crowd-low-fill)';
    return /*#__PURE__*/React.createElement("div", {
      key: d.label,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      title: `${d.label} · ${d.value} min`,
      style: {
        height: `${Math.max(8, level * 100)}%`,
        background: i === nowIndex ? tone : 'var(--border-strong)',
        opacity: i === nowIndex ? 1 : 0.55,
        borderRadius: 'var(--radius-xs)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    className: "ub-numeric",
    style: {
      display: 'flex',
      gap: 4,
      marginTop: 6
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: d.label,
    style: {
      flex: 1,
      textAlign: 'center',
      fontSize: 'var(--text-2xs)',
      color: i === nowIndex ? 'var(--text-primary)' : 'var(--text-muted)',
      fontWeight: i === nowIndex ? 'var(--weight-semibold)' : 'var(--weight-regular)',
      whiteSpace: 'nowrap',
      minWidth: 0
    }
  }, showLabel(i) ? d.label : ''))));
}
Object.assign(__ds_scope, { EmptyState, OfflineBanner, WaitReport, CrowdingByHour });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/layout/AppShell.jsx
try { (() => {
/* The app is one scrolling surface. There are no tabs over content: navigation moves you
   between the app, your account and the staff tools — never between parts of the menu. */

function AppHeader({
  title,
  onBack,
  right,
  lang = 'ro',
  sticky = true,
  brand,
  transparent = false
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: sticky ? 'sticky' : 'static',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 56,
      // transparent: over a photo (the home hall), which then shows behind the brand and buttons.
      padding: '8px 16px',
      background: transparent ? 'transparent' : 'var(--surface-page)'
    }
  }, onBack ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": lang === 'ro' ? 'Înapoi' : 'Back',
    className: "ub-hbtn",
    style: {
      width: 44,
      height: 44,
      marginLeft: -10,
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 0,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-left",
    size: 22
  })) : brand || /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 26
  }), title && /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)',
      flex: 1,
      minWidth: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 4
    }
  }, right), /*#__PURE__*/React.createElement("style", null, `.ub-hbtn:hover{background:var(--hover-wash)}`));
}

/* `links` replaces the three default labels with real destinations: { label, href, onClick }.
   `hoursLabel` carries the configured schedule; the copy below is the confirmed default. */
function AppFooter({
  lang = 'ro',
  onLang,
  links,
  hoursLabel
}) {
  const t = lang === 'ro' ? {
    hours: 'L–V 11:30–17:00',
    addr: 'Bd. Mihail Kogălniceanu 36–46, sector 5',
    links: ['Trimite feedback', 'Confidențialitate', 'Contul meu'],
    lang: 'English'
  } : {
    hours: 'Mon–Fri 11:30–17:00',
    addr: 'Bd. Mihail Kogălniceanu 36–46, sector 5',
    links: ['Send feedback', 'Privacy', 'My account'],
    lang: 'Română'
  };
  const items = links || t.links.map(label => ({
    label,
    href: '#'
  }));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: '20px 16px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, hoursLabel || t.hours)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 15,
    style: {
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("span", null, t.addr)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap',
      marginTop: 6
    }
  }, items.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href || '#',
    style: {
      fontSize: 'var(--text-sm)'
    },
    onClick: l.onClick ? e => {
      e.preventDefault();
      l.onClick();
    } : undefined
  }, l.label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onLang,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 0,
      color: 'var(--accent)',
      cursor: 'pointer',
      fontSize: 'var(--text-sm)',
      minHeight: 'auto',
      padding: 0,
      textDecoration: 'underline',
      textUnderlineOffset: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "languages",
    size: 15
  }), t.lang)));
}
function Announcement({
  title,
  body,
  date,
  tone = 'neutral'
}) {
  const bg = tone === 'warning' ? 'var(--status-warning-quiet)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--status-warning-text)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: 12,
      background: bg,
      borderRadius: 'var(--radius-sm)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: tone === 'warning' ? 'triangle-alert' : 'info',
    size: 17,
    style: {
      color: fg,
      marginTop: 2,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)',
      color: fg
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, body), date && /*#__PURE__*/React.createElement("div", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, date)));
}

/* `fixed` pins the sheet to the viewport instead of a positioned parent — the production app
   scrolls the document, the UI kits scroll a phone frame. It stays phone-width on a desktop. */
function Sheet({
  open = true,
  title,
  children,
  onClose,
  lang = 'ro',
  fixed = false
}) {
  if (!open) return null;
  const pos = fixed ? 'fixed' : 'absolute';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ub-sheet-scrim",
    style: {
      position: pos,
      inset: 0,
      background: 'var(--surface-overlay)',
      zIndex: 40
    },
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    className: "ub-sheet",
    style: {
      position: pos,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 41,
      margin: fixed ? '0 auto' : undefined,
      maxWidth: fixed ? 'var(--max-phone)' : undefined,
      background: 'var(--surface-raised)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      padding: 20,
      boxShadow: 'var(--shadow-overlay)',
      maxHeight: '86%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-semibold)',
      flex: 1
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": lang === 'ro' ? 'Închide' : 'Close',
    className: "ub-hbtn",
    style: {
      width: 44,
      height: 44,
      marginRight: -8,
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 0,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 20
  }))), children), /*#__PURE__*/React.createElement("style", null, `
        .ub-sheet{animation:ub-sheet-up var(--motion-slow) var(--ease-out)}
        .ub-sheet-scrim{animation:ub-fade var(--motion-base) var(--ease-out)}
        @keyframes ub-sheet-up{from{transform:translateY(16px);opacity:.6}to{transform:none;opacity:1}}
        @keyframes ub-fade{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion:reduce){.ub-sheet,.ub-sheet-scrim{animation:none}}
      `));
}
function Toast({
  message,
  tone = 'neutral',
  icon,
  action,
  onAction
}) {
  const bg = tone === 'success' ? 'var(--status-success-quiet)' : tone === 'danger' ? 'var(--status-danger-quiet)' : 'var(--surface-inverse)';
  const fg = tone === 'success' ? 'var(--status-success-text)' : tone === 'danger' ? 'var(--status-danger-text)' : 'var(--text-inverse)';
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-base)',
      boxShadow: 'var(--shadow-overlay)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    stroke: 2.25
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, message), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      background: 'transparent',
      border: 0,
      color: 'inherit',
      fontWeight: 'var(--weight-semibold)',
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      cursor: 'pointer',
      minHeight: 'auto',
      padding: 0
    }
  }, action));
}

/* The page wrapper every screen sits in: one scrolling surface, phone-width, themed. */
function AppShell({
  children,
  header,
  footer,
  maxWidth = 'var(--max-phone)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      color: 'var(--text-primary)',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, header, /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      width: '100%',
      maxWidth,
      margin: '0 auto'
    }
  }, children), footer);
}
Object.assign(__ds_scope, { AppHeader, AppFooter, Announcement, Sheet, Toast, AppShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/AppShell.jsx", error: String((e && e.message) || e) }); }

// components/menu/DishRow.jsx
try { (() => {
/* Dish photography does not exist yet. Until the canteen supplies it, every photo position
   is a real drop-in slot (assets/image-slot.js) rather than a fake image: a designer or the
   canteen drags a photo in and it stays. Without the slot script it degrades to a tinted
   plate with the category glyph — which is also the correct empty state in production. */

function DishPhoto({
  src,
  alt = '',
  size = 64,
  radius = 'var(--radius-md)',
  slotId,
  glyph = 'utensils',
  style
}) {
  const box = {
    width: size,
    height: size,
    borderRadius: radius,
    flex: 'none',
    overflow: 'hidden',
    ...style
  };
  // Below the fold on a weak canteen connection: lazy, sized for its box (docs/04 "Images").
  if (src) return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    loading: "lazy",
    decoding: "async",
    width: typeof size === 'number' ? size : undefined,
    height: typeof size === 'number' ? size : undefined,
    style: {
      ...box,
      objectFit: 'cover'
    }
  });
  if (slotId) {
    return /*#__PURE__*/React.createElement("div", {
      style: box
    }, /*#__PURE__*/React.createElement("image-slot", {
      id: slotId,
      shape: "rounded",
      radius: "10",
      placeholder: alt || 'Fotografie fel de mâncare',
      style: {
        width: '100%',
        height: '100%'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...box,
      background: 'var(--surface-sunken)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-muted)'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: glyph,
    size: Math.max(16, Math.round(size * 0.32))
  }));
}

/* `onFavourite` adds the heart ("a heart on any dish, anywhere it appears", docs/03 F10). The row
   and the heart are then two sibling buttons — a button never nests inside another. */
function DishRow({
  name,
  price,
  currency = 'lei',
  tags = [],
  photo,
  slotId,
  glyph,
  portions,
  unavailable = false,
  loading = false,
  onClick,
  lang = 'ro',
  dense = false,
  favourite = false,
  onFavourite
}) {
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: `${dense ? 10 : 12}px 0`
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: dense ? 52 : 64,
      height: dense ? 52 : 64,
      radius: "var(--radius-md)"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: "62%",
      height: 18,
      radius: "var(--radius-xs)"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8
      }
    }), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: "34%",
      height: 14,
      radius: "var(--radius-xs)"
    })), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
      width: 48,
      height: 18,
      radius: "var(--radius-xs)"
    }));
  }
  const withFav = typeof onFavourite === 'function';
  const favLabel = lang === 'ro' ? `${favourite ? 'Scoate de la favorite' : 'Adaugă la favorite'}: ${name}` : `${favourite ? 'Remove from favourites' : 'Add to favourites'}: ${name}`;
  const row = /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    className: "ub-dish",
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      width: withFav ? 'auto' : '100%',
      flex: withFav ? 1 : undefined,
      minWidth: 0,
      textAlign: 'left',
      padding: `${dense ? 10 : 12}px 8px`,
      margin: withFav ? 0 : '0 -8px',
      background: 'transparent',
      border: 0,
      borderRadius: 'var(--radius-md)',
      cursor: onClick ? 'pointer' : 'default',
      opacity: unavailable ? 0.55 : 1,
      minHeight: 'var(--min-target)',
      transition: 'background var(--motion-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(DishPhoto, {
    size: dense ? 52 : 64,
    slotId: slotId,
    src: photo,
    alt: "",
    glyph: glyph
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)',
      lineHeight: 1.25
    }
  }, name), (tags.length > 0 || portions != null) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.DietaryTag, {
    key: t,
    kind: t,
    lang: lang,
    size: "sm"
  })), portions != null && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      alignSelf: 'center'
    }
  }, portions, " ", lang === 'ro' ? 'porții' : 'portions')), unavailable && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, lang === 'ro' ? 'S-a terminat' : 'Sold out')), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-bold)',
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, price, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-muted)'
    }
  }, currency)), onClick && !withFav && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 18,
    style: {
      color: 'var(--text-muted)'
    }
  }));
  return /*#__PURE__*/React.createElement(React.Fragment, null, withFav ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      margin: '0 -8px'
    }
  }, row, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onFavourite,
    "aria-pressed": favourite,
    "aria-label": favLabel,
    className: "ub-dish-fav",
    style: {
      width: 44,
      height: 44,
      minHeight: 44,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 0,
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      color: favourite ? 'var(--status-danger-fill)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 20,
    style: {
      fill: favourite ? 'var(--status-danger-fill)' : 'transparent'
    }
  }))) : row, /*#__PURE__*/React.createElement("style", null, `.ub-dish:hover{background:var(--hover-wash)}.ub-dish:active{background:var(--active-wash)}.ub-dish-fav:hover{background:var(--hover-wash)}.ub-dish-fav:active{transform:scale(.96)}@media (prefers-reduced-motion:reduce){.ub-dish-fav:active{transform:none}}`));
}
function CategoryHeader({
  title,
  icon = 'utensils',
  count,
  lang = 'ro'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '18px 0 8px',
      position: 'sticky',
      top: 0,
      background: 'var(--surface)',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17,
    style: {
      color: 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--text-sm)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-secondary)'
    }
  }, title), count != null && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginLeft: 'auto'
    }
  }, count, " ", lang === 'ro' ? count === 1 ? 'fel' : count >= 20 ? 'de feluri' : 'feluri' : count === 1 ? 'dish' : 'dishes'));
}
Object.assign(__ds_scope, { DishPhoto, DishRow, CategoryHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/DishRow.jsx", error: String((e && e.message) || e) }); }

// components/menu/RatingStars.jsx
try { (() => {
/* A rating is an opinion, so it is always accompanied by its sample size.
   Stars are never the only carrier: the numeric average sits beside them. */

function RatingStars({
  value = 0,
  count,
  size = 20,
  interactive = false,
  onRate,
  lang = 'ro',
  disabled = false,
  pending = false
}) {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  const label = lang === 'ro' ? 'Notează felul' : 'Rate this dish';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: interactive ? 'radiogroup' : 'img',
    "aria-label": interactive ? label : `${value} / 5`,
    style: {
      display: 'flex',
      gap: interactive ? 2 : 3,
      opacity: disabled ? 0.45 : 1
    },
    onMouseLeave: () => setHover(0)
  }, [1, 2, 3, 4, 5].map(n => {
    const on = n <= Math.round(shown);
    const glyph = /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "star",
      size: size,
      stroke: 2,
      style: {
        color: on ? 'var(--crowd-moderate-fill)' : 'var(--border-strong)',
        fill: on ? 'var(--crowd-moderate-fill)' : 'transparent',
        transition: 'color var(--motion-fast) var(--ease-out)'
      }
    });
    if (!interactive) return /*#__PURE__*/React.createElement("span", {
      key: n
    }, glyph);
    return /*#__PURE__*/React.createElement("button", {
      key: n,
      type: "button",
      role: "radio",
      "aria-checked": n === Math.round(value),
      "aria-label": `${n}`,
      disabled: disabled || pending,
      onMouseEnter: () => setHover(n),
      onClick: () => onRate && onRate(n),
      className: "ub-star",
      style: {
        background: 'transparent',
        border: 0,
        padding: 6,
        margin: -2,
        minHeight: 44,
        minWidth: 44,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)'
      }
    }, glyph);
  })), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, pending ? lang === 'ro' ? 'Se trimite…' : 'Sending…' : count != null ? `${Number(value).toFixed(1)} · ${count} ${lang === 'ro' ? 'note' : 'ratings'}` : Number(value).toFixed(1))), /*#__PURE__*/React.createElement("style", null, `.ub-star:hover{background:var(--hover-wash)}`));
}

/* Five dots, filling. One of only two places in the system where motion earns its keep. */
/* Signed out it is one quiet line; `onSignIn` turns its last words into the sign-in link. */
function LoyaltyDots({
  filled = 0,
  total = 5,
  size = 16,
  lang = 'ro',
  signedIn = true,
  onAdd,
  onSignIn
}) {
  if (!signedIn) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)'
      }
    }, lang === 'ro' ? 'A șasea masă e gratuită.' : 'Every sixth meal is free.', ' ', onSignIn ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onSignIn,
      className: "ub-loyalty-add",
      style: {
        background: 'transparent',
        border: 0,
        padding: 0,
        minHeight: 44,
        color: 'var(--accent)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--weight-semibold)',
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, lang === 'ro' ? 'Intră în cont ca să ținem socoteala.' : 'Sign in and we will keep count.') : lang === 'ro' ? 'Intră în cont ca să ținem socoteala.' : 'Sign in and we will keep count.'), /*#__PURE__*/React.createElement("style", null, `.ub-loyalty-add:hover{text-decoration:underline;text-underline-offset:3px}`));
  }
  const left = total - filled;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: size * 0.45
    },
    role: "img",
    "aria-label": `${filled} ${lang === 'ro' ? 'din' : 'of'} ${total}`
  }, Array.from({
    length: total
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: i < filled ? 'ub-dot ub-dot--on' : 'ub-dot',
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: i < filled ? 'var(--accent)' : 'transparent',
      boxShadow: i < filled ? 'none' : 'inset 0 0 0 2px var(--border-strong)',
      animationDelay: `${i * 40}ms`
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)'
    }
  }, left === 0 ? lang === 'ro' ? 'Ai o masă gratuită.' : 'You have a free meal.' : `${filled} ${lang === 'ro' ? 'din' : 'of'} ${total} — ${left === 1 ? lang === 'ro' ? 'încă una și masa e gratuită' : 'one more for a free meal' : lang === 'ro' ? `încă ${left} până la masa gratuită` : `${left} more to a free meal`}`), onAdd && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAdd,
    className: "ub-loyalty-add",
    style: {
      marginLeft: 'auto',
      background: 'transparent',
      border: 0,
      color: 'var(--accent)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "camera",
    size: 16
  }), lang === 'ro' ? 'Adaugă bon' : 'Add receipt')), /*#__PURE__*/React.createElement("style", null, `
        .ub-dot{transition:background var(--motion-slow) var(--ease-out),box-shadow var(--motion-slow) var(--ease-out)}
        .ub-dot--on{animation:ub-dot-fill var(--motion-slow) var(--ease-out)}
        @keyframes ub-dot-fill{from{transform:scale(.6);opacity:.4}to{transform:none;opacity:1}}
        .ub-loyalty-add:hover{text-decoration:underline;text-underline-offset:3px}
        @media (prefers-reduced-motion:reduce){.ub-dot,.ub-dot--on{animation:none;transition:none}}
      `));
}
Object.assign(__ds_scope, { RatingStars, LoyaltyDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/RatingStars.jsx", error: String((e && e.message) || e) }); }

// components/menu/DishDetailHeader.jsx
try { (() => {
/* The dish detail header. Allergen information is a safety claim: where the canteen has
   not supplied it, the screen says so in words and names who the authority is. Silence
   would read as "no allergens", which is the one thing it must never mean. */

function DishDetailHeader({
  name,
  price,
  currency = 'lei',
  weight,
  tags = [],
  allergens,
  allergenSource,
  rating,
  ratingCount,
  favourite = false,
  onFavourite,
  onRate,
  slotId,
  photo,
  photoNote,
  lang = 'ro'
}) {
  const t = lang === 'ro' ? {
    allergens: 'Alergeni',
    unknown: 'Informație indisponibilă',
    source: s => `Sursă: ${s}`,
    noSource: 'Cantina nu a furnizat lista de alergeni pentru acest fel.',
    fav: 'Adaugă la favorite',
    unfav: 'Scoate de la favorite'
  } : {
    allergens: 'Allergens',
    unknown: 'Information not available',
    source: s => `Source: ${s}`,
    noSource: 'The canteen has not supplied an allergen list for this dish.',
    fav: 'Add to favourites',
    unfav: 'Remove from favourites'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 240,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.DishPhoto, {
    slotId: slotId,
    src: photo,
    alt: name,
    size: "100%",
    radius: "var(--radius-lg)",
    style: {
      width: '100%',
      height: '100%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onFavourite,
    "aria-pressed": favourite,
    "aria-label": favourite ? t.unfav : t.fav,
    className: "ub-fav",
    style: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-pill)',
      border: 0,
      display: 'grid',
      placeItems: 'center',
      cursor: 'pointer',
      background: 'var(--surface-raised)',
      color: favourite ? 'var(--status-danger-fill)' : 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 20,
    style: {
      fill: favourite ? 'var(--status-danger-fill)' : 'transparent'
    }
  }))), photoNote && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 8
    }
  }, photoNote), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: photoNote ? 10 : 18,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-tight)',
      flex: 1
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--weight-bold)',
      whiteSpace: 'nowrap'
    }
  }, price, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-muted)',
      fontWeight: 'var(--weight-medium)'
    }
  }, currency))), weight && /*#__PURE__*/React.createElement("div", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, weight), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 14
    }
  }, tags.map(k => /*#__PURE__*/React.createElement(__ds_scope.DietaryTag, {
    key: k,
    kind: k,
    lang: lang
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.RatingStars, {
    value: rating ?? 0,
    count: ratingCount,
    interactive: !!onRate,
    onRate: onRate,
    lang: lang
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 16,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 8
    }
  }, t.allergens), allergens && allergens.length > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)'
    }
  }, allergens.join(' · ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, t.source(allergenSource || 'Cantina UB'))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-alert",
    size: 18,
    style: {
      color: 'var(--status-warning-text)',
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--status-warning-text)'
    }
  }, t.unknown), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, t.noSource))))), /*#__PURE__*/React.createElement("style", null, `.ub-fav:hover{background:var(--surface)}.ub-fav:active{transform:scale(.96)}@media (prefers-reduced-motion:reduce){.ub-fav:active{transform:none}}`));
}
Object.assign(__ds_scope, { DishDetailHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/DishDetailHeader.jsx", error: String((e && e.message) || e) }); }


// components/brand/Illustration.jsx
try { (() => {
/* The brand illustration layer — what makes UBite look like itself and not like a template.
   Every file is an SVG (or a mask PNG) in the repo's assets/, recorded in assets/manifest.json:

   - spot   characters in one brush ink (assets/illustrations/spots/). Drawn through a CSS mask,
            so they take any token colour: ink on a surface, on-accent inside a Spotlight.
   - line   the empty-state line drawings — same treatment as a spot.
   - scene  flat onboarding scenes whose shapes are filled with the colour tokens themselves
            (var(--accent), var(--accent-quiet)…). Inlined, so they recolour with the theme.
   - picto  menu category pictograms: an outline in currentColor over a fill in --accent.

   `boil` gives a drawing the wobble of a hand-animated line: three displacement filters swapped
   seven times a second. It is decoration, so reduced motion switches it off. */

const TONES = {
  ink: 'var(--text-primary)',
  accent: 'var(--accent)',
  'on-accent': 'var(--text-on-accent)',
  muted: 'var(--text-muted)',
  inverse: 'var(--text-inverse)',
  current: 'currentColor'
};
const svgCache = new Map();
function useInlineSvg(src) {
  const [text, setText] = React.useState(() => src && svgCache.get(src) || '');
  React.useEffect(() => {
    if (!src) return undefined;
    if (svgCache.has(src)) {
      setText(svgCache.get(src));
      return undefined;
    }
    let live = true;
    fetch(src).then(r => r.ok ? r.text() : '').then(t => {
      // A single <svg> root from our own assets folder; anything else is dropped.
      const ok = /^\s*<svg[\s>]/.test(t) && !/<script|\son\w+=/i.test(t);
      const clean = ok ? t.replace('<svg ', '<svg width="100%" height="100%" ') : '';
      svgCache.set(src, clean);
      if (live) setText(clean);
    }).catch(() => {});
    return () => {
      live = false;
    };
  }, [src]);
  return text;
}
function useReducedMotion() {
  const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [reduce, setReduce] = React.useState(query ? query.matches : false);
  React.useEffect(() => {
    if (!query) return undefined;
    const on = () => setReduce(query.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  return reduce;
}

/* Three frozen noise fields, and a timer that swaps between them. Neither animating the seed
   inside the SVG nor a CSS animation of filter:url() repaints the element in Chromium. */
function BoilFilter({
  id
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: "0",
    height: "0",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      position: 'absolute'
    }
  }, [1, 2, 3].map(seed => /*#__PURE__*/React.createElement("filter", {
    key: seed,
    id: `${id}-${seed}`,
    x: "-4%",
    y: "-4%",
    width: "108%",
    height: "108%"
  }, /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.03",
    numOctaves: "2",
    seed: seed,
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "n",
    scale: "3.5",
    xChannelSelector: "R",
    yChannelSelector: "G"
  }))));
}
function useBoil(ref, id, on) {
  React.useEffect(() => {
    const el = ref.current;
    if (!on || !el) return undefined;
    let frame = 0;
    const t = setInterval(() => {
      frame = (frame + 1) % 3;
      el.style.filter = `url(#${id}-${frame + 1})`;
    }, 140);
    el.style.filter = `url(#${id}-1)`;
    return () => {
      clearInterval(t);
      el.style.filter = '';
    };
  }, [on, id]);
}
function Illustration({
  src,
  kind = 'spot',
  tone = 'ink',
  width,
  height,
  ratio = 1,
  boil = false,
  label,
  style
}) {
  const reduce = useReducedMotion();
  const fid = `ub-boil-${React.useId().replace(/:/g, '')}`;
  const inline = kind === 'scene' || kind === 'picto';
  const svg = useInlineSvg(inline ? src : null);
  const wobble = boil && !reduce;
  const ref = React.useRef(null);
  useBoil(ref, fid, wobble);
  const colour = TONES[tone] || tone;
  const a11y = label ? {
    role: 'img',
    'aria-label': label
  } : {
    'aria-hidden': true
  };
  // The filter sits on a wrapper: CSS filters run before masks, so on the masked element itself
  // it would only shake a solid rectangle.
  const outer = {
    display: 'block',
    flex: 'none',
    width: width ?? '100%',
    height: height ?? 'auto',
    aspectRatio: height ? undefined : String(ratio),
    ...style
  };
  if (!src) return null;
  if (inline) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, wobble && /*#__PURE__*/React.createElement(BoilFilter, {
      id: fid
    }), /*#__PURE__*/React.createElement("span", {
      ref: ref,
      ...a11y,
      style: {
        ...outer,
        color: colour
      },
      dangerouslySetInnerHTML: {
        __html: svg
      }
    }));
  }
  const mask = `url("${src}") center / contain no-repeat`;
  return /*#__PURE__*/React.createElement(React.Fragment, null, wobble && /*#__PURE__*/React.createElement(BoilFilter, {
    id: fid
  }), /*#__PURE__*/React.createElement("span", {
    ref: ref,
    ...a11y,
    style: outer
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      background: colour,
      WebkitMask: mask,
      mask
    }
  })));
}

/* The doodle wallpaper (assets/patterns/canteen.svg): a seamless tile, masked over a token
   colour at low opacity. The parent needs `position: relative`. `drift` slides it one tile a
   minute, for the splash and the kiosk; reduced motion keeps it still. */
function Pattern({
  src,
  tone = 'accent',
  opacity = 0.08,
  size = 320,
  drift = false,
  style
}) {
  const reduce = useReducedMotion();
  if (!src) return null;
  const mask = `url("${src}") 0 0 / ${size}px ${size}px repeat`;
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      opacity,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -size,
      left: -size,
      right: 0,
      bottom: 0,
      background: TONES[tone] || tone,
      WebkitMask: mask,
      mask,
      animation: drift && !reduce ? 'ub-pattern-drift 60s linear infinite' : undefined,
      '--ub-tile': `${size}px`
    }
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes ub-pattern-drift{to{transform:translate(var(--ub-tile),var(--ub-tile))}}'));
}
Object.assign(__ds_scope, { useReducedMotion, Illustration, Pattern });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Illustration.jsx", error: String((e && e.message) || e) }); }

// components/core/Spotlight.jsx
try { (() => {
/* A feature card with a character — the "special offers" slot of the reference apps, used only
   for things UBite really does: the quiet hour, the wait report, the menu alert. Never for an
   offer the canteen has not made. The drawing takes the card's text colour and bleeds off the
   bottom-right corner; the text keeps the left 58%, so it never sits on the drawing.
   `video` (a path without extension, e.g. assets/motion/spot-run) is the same character
   animated: white lines on black, blended into the card so it takes the card's text colour in
   both themes. It replaces the still drawing once it plays; reduced motion keeps the still. */
function Spotlight({
  eyebrow,
  title,
  action,
  onAction,
  art,
  video,
  boil = true,
  tone = 'accent',
  style
}) {
  const reduce = __ds_scope.useReducedMotion();
  const [playing, setPlaying] = React.useState(false);
  const moving = video && tone === 'accent' && !reduce;
  const bg = tone === 'inverse' ? 'var(--surface-inverse)' : tone === 'quiet' ? 'var(--accent-quiet)' : 'var(--accent)';
  const fg = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'quiet' ? 'var(--accent-quiet-text)' : 'var(--text-on-accent)';
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-spotlight",
    style: {
      position: 'relative',
      overflow: 'hidden',
      minHeight: 172,
      display: 'flex',
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-lg)',
      padding: '18px 18px 16px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      width: '58%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 6
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      opacity: 0.88
    }
  }, eyebrow), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1.3
    }
  }, title), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    className: "ub-spotlight-btn",
    style: {
      marginTop: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
      padding: '0 6px 0 16px',
      border: 0,
      borderRadius: 'var(--radius-pill)',
      background: fg,
      color: bg,
      font: 'inherit',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, action, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: bg,
      color: fg
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 16
  })))), art && !(moving && playing) && /*#__PURE__*/React.createElement(__ds_scope.Illustration, {
    src: art,
    tone: fg,
    boil: boil,
    width: "48%",
    style: {
      position: 'absolute',
      right: -24,
      bottom: -20,
      maxWidth: 176
    }
  }), moving && /*#__PURE__*/React.createElement("video", {
    className: "ub-spotlight-video",
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    "aria-hidden": "true",
    onPlaying: () => setPlaying(true),
    style: {
      position: 'absolute',
      right: -24,
      bottom: -20,
      width: '48%',
      maxWidth: 176,
      aspectRatio: '1',
      opacity: playing ? 1 : 0
    }
  }, /*#__PURE__*/React.createElement("source", {
    src: `${video}.webm`,
    type: "video/webm"
  }), /*#__PURE__*/React.createElement("source", {
    src: `${video}.mp4`,
    type: "video/mp4"
  })), /*#__PURE__*/React.createElement("style", null, `
        .ub-spotlight-btn{transition:transform var(--motion-fast) var(--ease-out)}
        .ub-spotlight-btn:hover{transform:translateX(2px)}
        .ub-spotlight-btn:focus-visible{outline:3px solid var(--focus-ring);outline-offset:2px;box-shadow:0 0 0 6px var(--focus-ring-contrast)}
        @media (prefers-reduced-motion:reduce){.ub-spotlight-btn{transition:none}}
        .ub-spotlight-video{mix-blend-mode:screen;pointer-events:none}
        :root[data-theme="dark"] .ub-spotlight-video{filter:invert(1);mix-blend-mode:multiply}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-spotlight-video{filter:invert(1);mix-blend-mode:multiply}}
      `));
}
Object.assign(__ds_scope, { Spotlight });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Spotlight.jsx", error: String((e && e.message) || e) }); }
// scripts/check-assets.cjs
try { (() => {
/* CI guard: every image under assets/ must have a manifest row with a real licence.
   Run: node scripts/check-assets.cjs   (exit 1 = something is unrecorded) */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'assets', 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {
  assets: []
};
const known = new Map(manifest.assets.map(a => [a.file, a]));

// The Lucide icon set and the logo files are recorded once, as a set, not file by file.
const EXEMPT = [/^assets\/icons\//, /^assets\/image-slot\.js$/];
const IMAGE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);else out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
};
const files = walk(path.join(root, 'assets')).filter(f => IMAGE.test(f) && !EXEMPT.some(r => r.test(f)));
const problems = [];
for (const f of files) {
  const row = known.get(f);
  if (!row) {
    problems.push(`${f} — no manifest row (run scripts/manifest-add.cjs)`);
    continue;
  }
  if (!row.licence || row.licence === 'UNKNOWN') problems.push(`${f} — licence not recorded`);
  if (row.source === 'generated' && !row.prompt) problems.push(`${f} — generated, but the prompt was not saved`);
}
for (const [f] of known) {
  if (!fs.existsSync(path.join(root, f))) problems.push(`${f} — in the manifest but missing on disk`);
}
if (problems.length) {
  console.error('Asset check failed:\n' + problems.map(p => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`Asset check passed — ${files.length} file(s), all recorded.`);
})(); } catch (e) { __ds_ns.__errors.push({ path: "scripts/check-assets.cjs", error: String((e && e.message) || e) }); }

// scripts/manifest-add.cjs
try { (() => {
/* Appends one row to assets/manifest.json. Called by asset.sh and photo.sh — you can also
   call it by hand for a file you added yourself:
     node scripts/manifest-add.cjs assets/photos/hall.jpg "site visit" "Andra" "canteen hall" "own work" */
const fs = require('fs');
const path = require('path');
const [file, source, author, prompt, licence, url] = process.argv.slice(2);
if (!file) {
  console.error('usage: manifest-add.cjs <file> <source> <author|model> <prompt|query> <licence> [url]');
  process.exit(1);
}
const p = path.join(__dirname, '..', 'assets', 'manifest.json');
const manifest = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {
  assets: []
};
manifest.assets = manifest.assets.filter(a => a.file !== file);
manifest.assets.push({
  file,
  source: source || 'unknown',
  author: author || '',
  prompt: prompt || '',
  licence: licence || 'UNKNOWN',
  url: url || '',
  added: new Date().toISOString().slice(0, 10)
});
manifest.assets.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
})(); } catch (e) { __ds_ns.__errors.push({ path: "scripts/manifest-add.cjs", error: String((e && e.message) || e) }); }

// ui_kits/dccas-dashboard/app.jsx
try { (() => {
const UB = window.UBiteDesignSystem_40c8c2;
const DAYS = [['Lu', 780], ['Ma', 812], ['Mi', 690], ['Jo', 744], ['Vi', 520]];
const HOURS = [['11:30', 2], ['12:00', 4], ['12:30', 7], ['13:00', 12], ['13:30', 9], ['14:00', 5], ['14:30', 3], ['15:00', 2]];
const BEST = [['Papanași cu smântână', 4.8, 103], ['Sarmale cu mămăligă', 4.6, 84], ['Ciorbă de perișoare', 4.4, 62]];
const WORST = [['Tocăniță de cartofi', 2.9, 41], ['Murături asortate', 3.1, 18], ['Supă cremă de legume', 3.4, 27]];
const WASTE = [['Pui la cuptor cu cartofi', 120, 112], ['Musaca de legume', 90, 61], ['File de pește', 60, 33]];
function Metric({
  label,
  value,
  unit,
  note,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-metric"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-eyebrow"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "ub-numeric ub-metric-v",
    style: {
      color: tone || 'var(--text-primary)'
    }
  }, value, /*#__PURE__*/React.createElement("span", {
    className: "ub-metric-u"
  }, unit)), note && /*#__PURE__*/React.createElement("span", {
    className: "ub-metric-n"
  }, note));
}
function Bars({
  data,
  unit = '',
  max
}) {
  const top = max || Math.max(...data.map(d => d[1]));
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-bars"
  }, data.map(([label, v]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    className: "ub-bar-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-bar-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "ub-bar-track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-bar-fill",
    style: {
      width: `${v / top * 100}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric ub-bar-v"
  }, v, unit))));
}
function Dashboard() {
  const {
    Wordmark,
    Button,
    Badge,
    Chip,
    RatingStars,
    Icon
  } = UB;
  const [theme, setTheme] = React.useState('light');
  const [range, setRange] = React.useState('Ultimele 30 de zile');
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-dash"
  }, /*#__PURE__*/React.createElement("header", {
    className: "ub-dash-head"
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 26
  }), /*#__PURE__*/React.createElement("span", {
    className: "ub-eyebrow"
  }, "Raport DCCAS \xB7 doar citire"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, ['Ultimele 7 zile', 'Ultimele 30 de zile', 'Tot pilotul'].map(r => /*#__PURE__*/React.createElement(Chip, {
    key: r,
    size: "sm",
    selected: range === r,
    onClick: () => setRange(r)
  }, r)), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: theme === 'dark',
    onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark')
  }, "Noapte"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: "download"
  }, "Export\u0103 tabel"))), /*#__PURE__*/React.createElement("p", {
    className: "ub-dash-lede"
  }, "Cantina a servit ", /*#__PURE__*/React.createElement("strong", null, "3 546 de mese"), " \xEEn perioada selectat\u0103. V\xE2rful e constant la 13:00, iar vinerea e cea mai lini\u0219tit\u0103 zi. Mai jos, ce spun studen\u021Bii \u0219i c\xE2t a costat fidelitatea."), /*#__PURE__*/React.createElement("div", {
    className: "ub-dash-metrics"
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Mese servite",
    value: "3 546",
    note: "+8% fa\u021B\u0103 de luna trecut\u0103"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Timp mediu de a\u0219teptare",
    value: "6,4",
    unit: " min",
    note: "din 1 204 raport\u0103ri"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Studen\u021Bi care spun c\u0103 aplica\u021Bia i-a adus",
    value: "41",
    unit: "%",
    note: "din 312 r\u0103spunsuri",
    tone: "var(--crowd-low-text)"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Mese gratuite acordate",
    value: "68",
    note: "cost estimat 1 088 lei",
    tone: "var(--crowd-moderate-text)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ub-dash-grid"
  }, /*#__PURE__*/React.createElement("section", {
    className: "ub-panel"
  }, /*#__PURE__*/React.createElement("h2", null, "Trafic pe zi"), /*#__PURE__*/React.createElement(Bars, {
    data: DAYS
  })), /*#__PURE__*/React.createElement("section", {
    className: "ub-panel"
  }, /*#__PURE__*/React.createElement("h2", null, "A\u0219teptare medie pe or\u0103"), /*#__PURE__*/React.createElement(Bars, {
    data: HOURS,
    unit: " min"
  }), /*#__PURE__*/React.createElement("p", {
    className: "ub-note"
  }, "V\xE2rful de la 13:00 coincide cu finalul cursurilor de la Drept \u0219i Litere.")), /*#__PURE__*/React.createElement("section", {
    className: "ub-panel"
  }, /*#__PURE__*/React.createElement("h2", null, "Cele mai bine notate"), BEST.map(([n, r, c]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "ub-dish-line"
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement(RatingStars, {
    value: r,
    count: c,
    size: 16
  })))), /*#__PURE__*/React.createElement("section", {
    className: "ub-panel"
  }, /*#__PURE__*/React.createElement("h2", null, "Cele mai slab notate"), WORST.map(([n, r, c]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "ub-dish-line"
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement(RatingStars, {
    value: r,
    count: c,
    size: 16
  }))), /*#__PURE__*/React.createElement("p", {
    className: "ub-note"
  }, "Notele sub 3,5 apar aici. Nu e o sanc\u021Biune \u2014 e o list\u0103 de discu\u021Bie cu buc\u0103t\u0103ria.")), /*#__PURE__*/React.createElement("section", {
    className: "ub-panel ub-panel--wide"
  }, /*#__PURE__*/React.createElement("h2", null, "Por\u021Bii preg\u0103tite fa\u021B\u0103 de por\u021Bii v\xE2ndute"), /*#__PURE__*/React.createElement("table", {
    className: "ub-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Fel"), /*#__PURE__*/React.createElement("th", null, "Preg\u0103tite"), /*#__PURE__*/React.createElement("th", null, "V\xE2ndute"), /*#__PURE__*/React.createElement("th", null, "R\u0103mase"))), /*#__PURE__*/React.createElement("tbody", null, WASTE.map(([n, prep, sold]) => /*#__PURE__*/React.createElement("tr", {
    key: n
  }, /*#__PURE__*/React.createElement("td", null, n), /*#__PURE__*/React.createElement("td", {
    className: "ub-numeric"
  }, prep), /*#__PURE__*/React.createElement("td", {
    className: "ub-numeric"
  }, sold), /*#__PURE__*/React.createElement("td", {
    className: "ub-numeric"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: prep - sold > 20 ? 'warning' : 'neutral'
  }, prep - sold)))))), /*#__PURE__*/React.createElement("p", {
    className: "ub-note"
  }, "Apare doar pentru felurile la care s-a completat c\xE2mpul \u201Epor\u021Bii preg\u0103tite\u201D. Unde lipse\u0219te, r\xE2ndul lipse\u0219te \u2014 nu estim\u0103m."))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Dashboard, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dccas-dashboard/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kiosk/app.jsx
try { (() => {
const UB = window.UBiteDesignSystem_40c8c2;
const PANELS = ['menu', 'crowding', 'download'];
const DURATION = {
  menu: 12000,
  crowding: 8000,
  download: 8000
};
const KIOSK_MENU = [['Ciorbă', [['Ciorbă de perișoare', 9], ['Supă cremă de legume', 8]]], ['Fel principal', [['Pui la cuptor cu cartofi', 17], ['Musaca de legume', 14], ['File de pește la cuptor', 19]]], ['Desert și salată', [['Salată de varză', 4], ['Papanași cu smântână', 12]]], ['Băuturi și extra', [['Compot de mere', 3], ['Pâine', 1]]]];
function Kiosk() {
  const {
    CrowdingIndicator,
    Wordmark,
    Icon,
    Badge,
    Button
  } = UB;
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [vote, setVote] = React.useState(null);
  const panel = PANELS[i % PANELS.length];
  React.useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setI(n => n + 1), DURATION[panel]);
    return () => clearTimeout(t);
  }, [i, paused, panel]);
  React.useEffect(() => {
    if (!paused) return undefined;
    const t = setTimeout(() => {
      setPaused(false);
      setVote(null);
    }, 45000);
    return () => clearTimeout(t);
  }, [paused]);
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk",
    onClick: () => setPaused(true)
  }, /*#__PURE__*/React.createElement("header", {
    className: "ub-kiosk-head"
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 54
  }), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric ub-kiosk-clock"
  }, "12:41"), /*#__PURE__*/React.createElement("span", {
    className: "ub-kiosk-place"
  }, "Cantina Mihail Kog\u0103lniceanu \xB7 L\u2013V 11:30\u201317:00")), paused ? /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-body ub-kiosk-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-menu"
  }, KIOSK_MENU.map(([cat, items]) => /*#__PURE__*/React.createElement("div", {
    key: cat
  }, /*#__PURE__*/React.createElement("h2", {
    className: "ub-kiosk-cat"
  }, cat), items.map(([n, p]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "ub-kiosk-row"
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, p, " lei")))))), /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-vote"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-kiosk-voteq"
  }, "Cum a fost azi?"), /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-faces"
  }, [['face-slightly-smiling', 'bine'], ['face-neutral', 'acceptabil'], ['face-slightly-frowning', 'slab']].map(([g, l]) => /*#__PURE__*/React.createElement("button", {
    key: g,
    type: "button",
    className: "ub-face",
    "data-on": vote === g,
    onClick: e => {
      e.stopPropagation();
      setVote(g);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: g,
    size: 56,
    stroke: 2.25
  }), /*#__PURE__*/React.createElement("span", null, l)))), vote && /*#__PURE__*/React.createElement("span", {
    className: "ub-kiosk-thanks"
  }, "Mul\u021Bumim."))) : /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-body",
    key: panel
  }, panel === 'menu' && /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-menu ub-fadein"
  }, KIOSK_MENU.map(([cat, items]) => /*#__PURE__*/React.createElement("div", {
    key: cat
  }, /*#__PURE__*/React.createElement("h2", {
    className: "ub-kiosk-cat"
  }, cat), items.map(([n, p]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "ub-kiosk-row"
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, p, " lei")))))), panel === 'crowding' && /*#__PURE__*/React.createElement("div", {
    className: "ub-fadein",
    style: {
      display: 'grid',
      placeItems: 'center',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 880
    }
  }, /*#__PURE__*/React.createElement(CrowdingIndicator, {
    size: "kiosk",
    level: "moderate",
    waitMinutes: 6,
    quality: "live",
    updatedSecondsAgo: 40
  }))), panel === 'download' && /*#__PURE__*/React.createElement("div", {
    className: "ub-fadein ub-kiosk-qr"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "ub-kiosk-qr-title"
  }, "Vezi coada \xEEnainte s\u0103 vii"), /*#__PURE__*/React.createElement("p", {
    className: "ub-kiosk-qr-body"
  }, "Scaneaz\u0103 \u0219i pui UBite pe telefon. Nu trebuie cont."), /*#__PURE__*/React.createElement("p", {
    className: "ub-kiosk-qr-url ub-numeric"
  }, "ubite.unibuc.ro")), /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-qr-box"
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "kiosk-qr",
    shape: "rounded",
    radius: "12",
    placeholder: "Cod QR c\u0103tre ubite.unibuc.ro",
    style: {
      width: 300,
      height: 300
    }
  })))), /*#__PURE__*/React.createElement("footer", {
    className: "ub-kiosk-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-kiosk-dots"
  }, PANELS.map((p, n) => /*#__PURE__*/React.createElement("span", {
    key: p,
    "data-on": !paused && n === i % PANELS.length
  }))), /*#__PURE__*/React.createElement("span", null, paused ? 'Revine la rotație în 45 de secunde' : 'Atinge ecranul pentru meniul complet')));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Kiosk, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kiosk/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/staff-editor/app.jsx
try { (() => {
const UB = window.UBiteDesignSystem_40c8c2;
const CATALOG = [{
  id: 'ciorba-perisoare',
  name: 'Ciorbă de perișoare',
  cat: 'Ciorbă',
  price: 9
}, {
  id: 'ciorba-burta',
  name: 'Ciorbă de burtă',
  cat: 'Ciorbă',
  price: 12
}, {
  id: 'supa-legume',
  name: 'Supă cremă de legume',
  cat: 'Ciorbă',
  price: 8
}, {
  id: 'pui-cartofi',
  name: 'Pui la cuptor cu cartofi',
  cat: 'Fel principal',
  price: 17
}, {
  id: 'musaca',
  name: 'Musaca de legume',
  cat: 'Fel principal',
  price: 14
}, {
  id: 'sarmale',
  name: 'Sarmale cu mămăligă',
  cat: 'Fel principal',
  price: 16
}, {
  id: 'peste',
  name: 'File de pește la cuptor',
  cat: 'Fel principal',
  price: 19
}, {
  id: 'tocanita',
  name: 'Tocăniță de cartofi',
  cat: 'Fel principal',
  price: 13
}, {
  id: 'salata-varza',
  name: 'Salată de varză',
  cat: 'Desert și salată',
  price: 4
}, {
  id: 'salata-muraturi',
  name: 'Murături asortate',
  cat: 'Desert și salată',
  price: 4
}, {
  id: 'papanasi',
  name: 'Papanași cu smântână',
  cat: 'Desert și salată',
  price: 12
}, {
  id: 'prajitura',
  name: 'Prăjitură de casă',
  cat: 'Desert și salată',
  price: 7
}, {
  id: 'compot',
  name: 'Compot de mere',
  cat: 'Băuturi și extra',
  price: 3
}, {
  id: 'apa',
  name: 'Apă plată 0,5 l',
  cat: 'Băuturi și extra',
  price: 3
}, {
  id: 'paine',
  name: 'Pâine',
  cat: 'Băuturi și extra',
  price: 1
}];
const YESTERDAY = ['ciorba-perisoare', 'pui-cartofi', 'musaca', 'salata-varza', 'papanasi', 'compot', 'paine'];
const CATS = ['Ciorbă', 'Fel principal', 'Desert și salată', 'Băuturi și extra'];
function StaffEditor() {
  const {
    Button,
    Input,
    Chip,
    Badge,
    Icon,
    Toast,
    AppHeader,
    Wordmark,
    IconButton,
    EmptyState
  } = UB;
  const [sel, setSel] = React.useState(() => Object.fromEntries(YESTERDAY.map(id => [id, {
    on: true,
    price: CATALOG.find(c => c.id === id).price,
    portions: ''
  }])));
  const [published, setPublished] = React.useState(false);
  const [theme, setTheme] = React.useState('light');
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggle = item => setSel(s => ({
    ...s,
    [item.id]: s[item.id]?.on ? {
      ...s[item.id],
      on: false
    } : {
      on: true,
      price: item.price,
      portions: ''
    }
  }));
  const patch = (id, p) => setSel(s => ({
    ...s,
    [id]: {
      ...s[id],
      ...p
    }
  }));
  const chosen = CATALOG.filter(c => sel[c.id]?.on);
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-staff"
  }, /*#__PURE__*/React.createElement("header", {
    className: "ub-staff-head"
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 26
  }), /*#__PURE__*/React.createElement("span", {
    className: "ub-eyebrow",
    style: {
      marginLeft: 4
    }
  }, "Editor meniu \xB7 cont cantin\u0103"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: theme === 'dark',
    onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark')
  }, "Noapte"), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "mar\u021Bi, 21 octombrie"))), /*#__PURE__*/React.createElement("div", {
    className: "ub-staff-grid"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "ub-staff-section-title"
  }, /*#__PURE__*/React.createElement("h2", null, "Meniul de azi"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    icon: "refresh-cw"
  }, "preluat din meniul de ieri")), chosen.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "utensils",
    title: "Niciun fel selectat",
    body: "Bifeaz\u0103 din catalogul de jos. \xCEncepe cu meniul de ieri dac\u0103 se repet\u0103."
  }) : CATS.map(cat => {
    const rows = chosen.filter(c => c.cat === cat);
    if (!rows.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: cat,
      style: {
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ub-eyebrow",
      style: {
        marginBottom: 8
      }
    }, cat), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, rows.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: "ub-staff-row"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-semibold)'
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 112
      }
    }, /*#__PURE__*/React.createElement(Input, {
      value: sel[c.id].price,
      suffix: "lei",
      inputMode: "decimal",
      onChange: e => patch(c.id, {
        price: e.target.value
      })
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 132
      }
    }, /*#__PURE__*/React.createElement(Input, {
      value: sel[c.id].portions,
      placeholder: "por\u021Bii",
      suffix: "op\u021B.",
      inputMode: "numeric",
      onChange: e => patch(c.id, {
        portions: e.target.value
      })
    })), /*#__PURE__*/React.createElement(IconButton, {
      name: "x",
      label: `Scoate ${c.name}`,
      onClick: () => toggle(c)
    })))));
  }), /*#__PURE__*/React.createElement("div", {
    className: "ub-staff-publish"
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconLeft: "check",
    onClick: () => {
      setPublished(true);
      setTimeout(() => setPublished(false), 3000);
    }
  }, "Public\u0103 meniul (", chosen.length, " feluri)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "Studen\u021Bii v\u0103d meniul imediat. Po\u021Bi reveni oric\xE2nd."))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "ub-staff-section-title"
  }, /*#__PURE__*/React.createElement("h2", null, "Catalog"), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, CATALOG.length, " feluri")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginBottom: 12
    }
  }, "Bifeaz\u0103 ce se g\u0103te\u0219te azi. Pre\u021Bul vine din catalog \u0219i poate fi schimbat."), /*#__PURE__*/React.createElement("div", {
    className: "ub-catalog"
  }, CATS.map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      margin: '10px 0 6px'
    }
  }, cat), CATALOG.filter(c => c.cat === cat).map(c => {
    const on = !!sel[c.id]?.on;
    return /*#__PURE__*/React.createElement("label", {
      key: c.id,
      className: "ub-check"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ub-box",
      "data-on": on
    }, on && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15,
      stroke: 3
    })), /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: on,
      onChange: () => toggle(c),
      className: "ub-visually-hidden"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 'var(--text-base)'
      }
    }, c.name), /*#__PURE__*/React.createElement("span", {
      className: "ub-numeric",
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)'
      }
    }, c.price, " lei"));
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ub-addnew"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 17
  }), "Adaug\u0103 un fel nou")))), published && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 24,
      zIndex: 60,
      minWidth: 320
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    message: "Meniul de azi e publicat. 312 studen\u021Bi primesc o notificare.",
    tone: "success",
    icon: "circle-check"
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(StaffEditor, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/staff-editor/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/student-app/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const UB = window.UBiteDesignSystem_40c8c2;
const MENU = [{
  cat: 'Ciorbă',
  icon: 'soup',
  items: [{
    id: 'ciorba-perisoare',
    name: 'Ciorbă de perișoare',
    price: 9,
    tags: ['gluten'],
    glyph: 'soup',
    weight: '400 ml',
    rating: 4.4,
    ratingCount: 62
  }, {
    id: 'supa-legume',
    name: 'Supă cremă de legume',
    price: 8,
    tags: ['vegetarian'],
    glyph: 'soup',
    weight: '400 ml',
    rating: 4.0,
    ratingCount: 21
  }]
}, {
  cat: 'Fel principal',
  icon: 'utensils',
  items: [{
    id: 'pui-cartofi',
    name: 'Pui la cuptor cu cartofi',
    price: 17,
    tags: ['lactose'],
    portions: 120,
    weight: '320 g',
    rating: 4.2,
    ratingCount: 38,
    allergens: ['Lactoză', 'Muștar']
  }, {
    id: 'musaca',
    name: 'Musaca de legume',
    price: 14,
    tags: ['vegetarian'],
    glyph: 'salad',
    weight: '300 g',
    rating: 3.9,
    ratingCount: 17
  }, {
    id: 'sarmale',
    name: 'Sarmale cu mămăligă',
    price: 16,
    tags: ['pork'],
    weight: '350 g',
    rating: 4.6,
    ratingCount: 84,
    unavailable: true
  }, {
    id: 'peste',
    name: 'File de pește la cuptor',
    price: 19,
    tags: ['fish'],
    glyph: 'fish',
    weight: '280 g',
    rating: 4.1,
    ratingCount: 12
  }]
}, {
  cat: 'Desert și salată',
  icon: 'cookie',
  items: [{
    id: 'salata-varza',
    name: 'Salată de varză',
    price: 4,
    tags: ['vegan'],
    glyph: 'salad',
    weight: '150 g',
    rating: 4.3,
    ratingCount: 9
  }, {
    id: 'papanasi',
    name: 'Papanași cu smântână',
    price: 12,
    tags: ['gluten', 'lactose'],
    glyph: 'cookie',
    weight: '220 g',
    rating: 4.8,
    ratingCount: 103
  }]
}, {
  cat: 'Băuturi și extra',
  icon: 'cup-soda',
  items: [{
    id: 'compot',
    name: 'Compot de mere',
    price: 3,
    tags: ['vegan'],
    glyph: 'cup-soda',
    weight: '250 ml',
    rating: 4.0,
    ratingCount: 6
  }, {
    id: 'paine',
    name: 'Pâine',
    price: 1,
    tags: ['gluten'],
    glyph: 'wheat',
    weight: '80 g'
  }]
}];
const FILTERS = [{
  key: 'vegetarian',
  label: 'Vegetarian',
  icon: 'leaf'
}, {
  key: 'vegan',
  label: 'Vegan',
  icon: 'salad'
}, {
  key: 'gluten',
  label: 'Fără gluten',
  icon: 'wheat'
}, {
  key: 'lactose',
  label: 'Fără lactoză',
  icon: 'milk'
}];
const HOURS = [{
  label: '11:30',
  value: 2
}, {
  label: '12:00',
  value: 4
}, {
  label: '12:30',
  value: 7
}, {
  label: '13:00',
  value: 12
}, {
  label: '13:30',
  value: 9
}, {
  label: '14:00',
  value: 5
}, {
  label: '14:30',
  value: 3
}, {
  label: '15:00',
  value: 2
}];
const PICKS = ['papanasi', 'pui-cartofi', 'ciorba-perisoare', 'musaca'];
const ALL = MENU.flatMap(g => g.items);
function matches(item, active) {
  if (!active.length) return true;
  return active.every(f => {
    if (f === 'vegetarian') return item.tags.includes('vegetarian') || item.tags.includes('vegan');
    if (f === 'vegan') return item.tags.includes('vegan');
    if (f === 'gluten') return !item.tags.includes('gluten');
    if (f === 'lactose') return !item.tags.includes('lactose');
    return true;
  });
}

/* The "picks" rail borrows the horizontal card carousel from the inspiration screens —
   a photo, a price pill and a rating, scrollable with the thumb. */
function PickCard({
  item,
  onClick
}) {
  const {
    Icon
  } = UB;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ub-pick",
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-pick-photo"
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: `pick-${item.id}`,
    shape: "rounded",
    radius: "12",
    placeholder: item.name,
    style: {
      width: '100%',
      height: '100%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ub-pick-price ub-numeric"
  }, item.price, " lei")), /*#__PURE__*/React.createElement("span", {
    className: "ub-pick-name"
  }, item.name), item.rating && /*#__PURE__*/React.createElement("span", {
    className: "ub-pick-rating ub-numeric"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 13,
    style: {
      fill: 'var(--crowd-moderate-fill)',
      color: 'var(--crowd-moderate-fill)'
    }
  }), item.rating.toFixed(1)));
}
function CategoryPills({
  onJump,
  activeCat
}) {
  const {
    Icon
  } = UB;
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-pillrow"
  }, MENU.map(g => /*#__PURE__*/React.createElement("button", {
    key: g.cat,
    type: "button",
    className: "ub-pill",
    "data-on": activeCat === g.cat,
    onClick: () => onJump(g.cat)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-pill-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: g.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("span", null, g.cat))));
}
function HomeScreen({
  state,
  set,
  openDish,
  openSheet
}) {
  const {
    CrowdingIndicator,
    Chip,
    DishRow,
    CategoryHeader,
    LoyaltyDots,
    WaitReport,
    CrowdingByHour,
    Announcement,
    OfflineBanner,
    EmptyState,
    AppHeader,
    AppFooter,
    IconButton,
    Icon,
    Logo
  } = UB;
  const [scrollY, setScrollY] = React.useState(0);
  const [activeCat, setActiveCat] = React.useState(null);
  const scroller = React.useRef(null);
  const catRefs = React.useRef({});
  const active = state.filters;
  const toggle = k => set({
    filters: active.includes(k) ? active.filter(x => x !== k) : [...active, k]
  });
  const visible = MENU.map(g => ({
    ...g,
    items: g.items.filter(i => matches(i, active))
  })).filter(g => g.items.length);
  const jump = cat => {
    const el = catRefs.current[cat];
    const box = scroller.current;
    if (el && box) box.scrollTo({
      top: el.offsetTop - 104,
      behavior: 'smooth'
    });
    setActiveCat(cat);
  };
  const miniOut = scrollY > 300;
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-scroll",
    ref: scroller,
    onScroll: e => setScrollY(e.currentTarget.scrollTop)
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-mini",
    "data-in": miniOut
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-mini-dot",
    "data-level": state.level
  }), /*#__PURE__*/React.createElement("strong", null, {
    low: 'Coadă mică',
    moderate: 'Coadă medie',
    high: 'Coadă mare',
    closed: 'Închis'
  }[state.level]), state.level !== 'closed' && /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, "~", state.wait, " min"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => scroller.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    }),
    "aria-label": "Sus"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      transform: 'rotate(180deg)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 208,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '-40px 0 0',
      transform: `translateY(${scrollY * 0.4}px) scale(${1 + Math.min(scrollY, 300) * 0.0006})`,
      transformOrigin: 'center top',
      willChange: 'transform'
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "canteen-hall",
    shape: "rect",
    placeholder: "Fotografie: sala cantinei Mihail Kog\u0103lniceanu",
    style: {
      width: '100%',
      height: 260
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      pointerEvents: 'auto',
      opacity: miniOut ? 0 : 1,
      transition: 'opacity var(--motion-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    brand: Logo ? /*#__PURE__*/React.createElement(Logo, {
      variant: state.logo || 'tray',
      size: 30,
      level: state.level,
      withText: true
    }) : undefined,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      name: "languages",
      label: "Schimb\u0103 limba",
      onClick: () => set({
        lang: state.lang === 'ro' ? 'en' : 'ro'
      })
    }), /*#__PURE__*/React.createElement(IconButton, {
      name: "bell",
      label: "Notific\u0103ri"
    }), /*#__PURE__*/React.createElement(IconButton, {
      name: "settings",
      label: "Contul meu",
      onClick: () => set({
        screen: 'account'
      })
    })),
    sticky: false
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ub-rise",
    style: {
      padding: '0 var(--gutter) 0',
      marginTop: -64,
      position: 'relative',
      zIndex: 5
    }
  }, state.offline && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(OfflineBanner, {
    variant: "offline",
    updatedLabel: "Actualizat la 12:04",
    queued: state.queued || undefined,
    lang: state.lang
  })), /*#__PURE__*/React.createElement(CrowdingIndicator, {
    level: state.level,
    waitMinutes: state.wait,
    quality: state.quality,
    updatedSecondsAgo: state.age,
    lang: state.lang,
    loading: state.loading,
    onReport: () => openSheet('report')
  })), /*#__PURE__*/React.createElement("section", {
    className: "ub-rise",
    style: {
      padding: 'var(--density-zone-1) 0 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
      padding: '0 var(--gutter) 10px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-semibold)',
      minWidth: 0
    }
  }, state.lang === 'ro' ? 'Ce mănâncă lumea azi' : 'What people are eating today'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, state.lang === 'ro' ? 'după note' : 'by rating')), /*#__PURE__*/React.createElement("div", {
    className: "ub-rail"
  }, PICKS.map(id => {
    const item = ALL.find(i => i.id === id);
    return /*#__PURE__*/React.createElement(PickCard, {
      key: id,
      item: item,
      onClick: () => openDish(item)
    });
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--density-zone-2) var(--gutter) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, state.lang === 'ro' ? 'Meniul de azi' : "Today's menu"), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "mar\u021Bi, 21 oct")), /*#__PURE__*/React.createElement(CategoryPills, {
    onJump: jump,
    activeCat: activeCat
  }), /*#__PURE__*/React.createElement("div", {
    className: "ub-chiprow",
    style: {
      marginTop: 10
    }
  }, FILTERS.map(f => /*#__PURE__*/React.createElement(Chip, {
    key: f.key,
    icon: f.icon,
    selected: active.includes(f.key),
    onClick: () => toggle(f.key)
  }, f.label))), state.menuState === 'stale' && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0'
    }
  }, /*#__PURE__*/React.createElement(OfflineBanner, {
    variant: "stale",
    updatedLabel: "Meniul de ieri, luni 20 oct",
    lang: state.lang
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '4px 14px 10px',
      marginTop: 14
    }
  }, state.loading ? [0, 1, 2].map(i => /*#__PURE__*/React.createElement(DishRow, {
    key: i,
    loading: true,
    name: "",
    price: ""
  })) : visible.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    compact: true,
    icon: "sliders-horizontal",
    title: "Niciun fel nu se potrive\u0219te cu filtrele",
    body: "Scoate un filtru ca s\u0103 vezi tot meniul de azi.",
    action: "\u0218terge filtrele",
    onAction: () => set({
      filters: []
    })
  })) : visible.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.cat,
    ref: el => {
      catRefs.current[g.cat] = el;
    }
  }, /*#__PURE__*/React.createElement(CategoryHeader, {
    title: g.cat,
    icon: g.icon,
    count: g.items.length,
    lang: state.lang
  }), g.items.map(i => /*#__PURE__*/React.createElement(DishRow, _extends({
    key: i.id
  }, i, {
    slotId: `dish-${i.id}`,
    lang: state.lang,
    onClick: () => openDish(i)
  }))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--density-zone-2) var(--gutter) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(LoyaltyDots, {
    filled: state.loyalty,
    total: 5,
    signedIn: state.signedIn,
    lang: state.lang,
    onAdd: () => set({
      screen: 'visit'
    })
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--density-zone-3) var(--gutter) 0'
    }
  }, /*#__PURE__*/React.createElement(WaitReport, {
    state: state.reportState,
    lang: state.lang,
    onSubmit: () => set({
      reportState: 'done',
      wait: 5,
      level: 'moderate',
      age: 3
    })
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--density-zone-4) var(--gutter) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, state.lang === 'ro' ? 'De obicei marțea' : 'Usually on Tuesdays'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, state.lang === 'ro' ? 'aglomerat la 13:00' : 'busy at 13:00')), /*#__PURE__*/React.createElement(CrowdingByHour, {
    data: HOURS,
    nowIndex: 3,
    lang: state.lang
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--density-zone-5) var(--gutter) 0'
    }
  }, /*#__PURE__*/React.createElement(Announcement, {
    title: "Vineri cantina se \xEEnchide la 15:00",
    body: "Buc\u0103t\u0103ria are revizie tehnic\u0103.",
    date: "18 octombrie",
    tone: "warning"
  })), /*#__PURE__*/React.createElement(AppFooter, {
    lang: state.lang,
    onLang: () => set({
      lang: state.lang === 'ro' ? 'en' : 'ro'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 76
    }
  }));
}
function BottomNav({
  screen,
  go
}) {
  const {
    Icon
  } = UB;
  const items = [['home', 'utensils', 'Meniu'], ['account', 'star', 'Fidelitate'], ['visit', 'camera', 'Bon'], ['settings', 'settings', 'Cont']];
  return /*#__PURE__*/React.createElement("nav", {
    className: "ub-nav"
  }, items.map(([key, icon, label]) => /*#__PURE__*/React.createElement("button", {
    key: key,
    type: "button",
    "data-on": screen === key,
    onClick: () => go(key === 'settings' ? 'account' : key)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 19
  }), /*#__PURE__*/React.createElement("span", null, label))));
}
Object.assign(window, {
  HomeScreen,
  BottomNav,
  MENU,
  HOURS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/student-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/student-app/Screens.jsx
try { (() => {
const UB = window.UBiteDesignSystem_40c8c2;
function DishDetailScreen({
  dish,
  state,
  set,
  back
}) {
  const {
    AppHeader,
    DishDetailHeader,
    Button,
    IconButton,
    Toast
  } = UB;
  const [rated, setRated] = React.useState(0);
  const [fav, setFav] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-scroll"
  }, /*#__PURE__*/React.createElement(AppHeader, {
    title: dish.name,
    onBack: back,
    lang: state.lang,
    right: /*#__PURE__*/React.createElement(IconButton, {
      name: "download",
      label: "Salveaz\u0103"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter) 24px'
    }
  }, /*#__PURE__*/React.createElement(DishDetailHeader, {
    name: dish.name,
    price: dish.price,
    weight: dish.weight,
    tags: dish.tags || [],
    allergens: dish.allergens,
    allergenSource: dish.allergens ? 'Cantina Mihail Kogălniceanu' : undefined,
    rating: rated || dish.rating,
    ratingCount: dish.ratingCount,
    favourite: fav,
    onFavourite: () => setFav(v => !v),
    onRate: n => setRated(n),
    slotId: `dish-${dish.id}-hero`,
    lang: state.lang
  }), dish.unavailable && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    message: "S-a terminat azi. \xCE\u021Bi d\u0103m de \u0219tire c\xE2nd revine \xEEn meniu.",
    icon: "circle-alert"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: "bell",
    fullWidth: true
  }, "Anun\u021B\u0103-m\u0103 c\xE2nd e \xEEn meniu")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "Pre\u021Burile \u0219i alergenii sunt cele comunicate de cantin\u0103. Dac\u0103 ceva nu corespunde, spune-ne din", /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      marginLeft: 4
    }
  }, "trimite feedback"), ".")));
}
function AccountScreen({
  state,
  set,
  back
}) {
  const {
    AppHeader,
    LoyaltyDots,
    Button,
    Chip,
    Badge,
    Card
  } = UB;
  const rows = [['Mese luna asta', '14'], ['Cheltuit', '186 lei'], ['Economisit prin fidelitate', '17 lei'], ['Felul preferat', 'Papanași cu smântână']];
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-scroll"
  }, /*#__PURE__*/React.createElement(AppHeader, {
    title: "Contul meu",
    onBack: back,
    lang: state.lang
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-raised)',
      borderRadius: 'var(--radius-lg)',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 12
    }
  }, "Fidelitate"), /*#__PURE__*/React.createElement(LoyaltyDots, {
    filled: state.loyalty,
    total: 5,
    lang: state.lang,
    onAdd: () => set({
      screen: 'visit'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: "qr-code"
  }, "Vezi codul de recompens\u0103"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Istoricul t\u0103u"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, rows.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-base)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontWeight: 'var(--weight-semibold)'
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Preferin\u021B\u0103 alimentar\u0103"), /*#__PURE__*/React.createElement("div", {
    className: "ub-chiprow",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    selected: true,
    icon: "leaf"
  }, "Vegetarian"), /*#__PURE__*/React.createElement(Chip, {
    icon: "salad"
  }, "Vegan"), /*#__PURE__*/React.createElement(Chip, {
    icon: "wheat"
  }, "F\u0103r\u0103 gluten")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      marginTop: 10
    }
  }, "Filtr\u0103m meniul automat. Po\u021Bi vedea oric\xE2nd tot meniul dintr-un tap.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Notific\u0103ri"), [['Meniul e publicat', true], ['Felul tău preferat e azi', true], ['E liber acum', false], ['Mai ai o masă până la cea gratuită', true]].map(([label, on]) => /*#__PURE__*/React.createElement("label", {
    key: label,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      fontSize: 'var(--text-base)'
    }
  }, label, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 28,
      borderRadius: 999,
      background: on ? 'var(--accent)' : 'var(--border-strong)',
      position: 'relative',
      flex: 'none',
      transition: 'background var(--motion-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: 'var(--surface-raised)',
      transition: 'left var(--motion-fast) var(--ease-out)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u201EE liber acum\" te caut\u0103 doar \xEEntre 11:30 \u0219i 14:00. ", /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Schimb\u0103 intervalul"))), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    size: "sm"
  }, "\u0218terge contul")));
}
function AddVisitScreen({
  state,
  set,
  back
}) {
  const {
    AppHeader,
    Button,
    Toast,
    Skeleton
  } = UB;
  const [step, setStep] = React.useState('camera');
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-scroll"
  }, /*#__PURE__*/React.createElement(AppHeader, {
    title: "Adaug\u0103 o vizit\u0103",
    onBack: back,
    lang: state.lang
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter) 24px'
    }
  }, step === 'camera' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--surface-inverse)',
      height: 320,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 24,
      border: '2px dashed rgba(255,255,255,.45)',
      borderRadius: 'var(--radius-md)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-inverse)',
      fontSize: 'var(--text-base)',
      textAlign: 'center',
      padding: '0 32px'
    }
  }, "\xCEncadreaz\u0103 bonul fiscal \xEEn chenar. Nu e nevoie s\u0103 fie perfect.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    iconLeft: "camera",
    onClick: () => setStep('confirm')
  }, "Fotografiaz\u0103 bonul")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "P\u0103str\u0103m doar data, suma \u0219i num\u0103rul bonului. Fotografia nu se salveaz\u0103.")), step === 'confirm' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Am citit"), [['Data', '21 octombrie 2026, 12:48'], ['Sumă', '26 lei'], ['Bon', '#0421']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      minHeight: 36,
      fontSize: 'var(--text-base)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric",
    style: {
      fontWeight: 'var(--weight-semibold)'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    onClick: () => setStep('camera')
  }, "F\u0103 alt\u0103 poz\u0103"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => {
      set({
        loyalty: Math.min(5, state.loyalty + 1),
        screen: 'home'
      });
    }
  }, "Adaug\u0103 vizita"))), step === 'error' && /*#__PURE__*/React.createElement(Toast, {
    tone: "danger",
    icon: "triangle-alert",
    message: "Nu am putut citi bonul. \xCEncearc\u0103 o poz\u0103 mai apropiat\u0103.",
    action: "Re\xEEncearc\u0103",
    onAction: () => setStep('camera')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setStep('error'),
    style: {
      background: 'none',
      border: 0,
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      textDecoration: 'underline',
      cursor: 'pointer',
      padding: 0,
      minHeight: 'auto'
    }
  }, "Vezi starea de eroare"))));
}
Object.assign(window, {
  DishDetailScreen,
  AccountScreen,
  AddVisitScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/student-app/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/student-app/app.jsx
try { (() => {
const UB = window.UBiteDesignSystem_40c8c2;
const DEFAULTS = {
  screen: 'home',
  lang: 'ro',
  theme: 'dark',
  level: 'moderate',
  wait: 6,
  quality: 'live',
  age: 40,
  loading: false,
  offline: false,
  queued: 0,
  menuState: 'fresh',
  filters: [],
  loyalty: 4,
  signedIn: true,
  reportState: 'idle',
  install: false,
  logo: 'tray'
};
function Toolbar({
  state,
  set
}) {
  const {
    Chip,
    Button
  } = UB;
  const Group = ({
    label,
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-eyebrow"
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, children));
  return /*#__PURE__*/React.createElement("aside", {
    className: "ub-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Group, {
    label: "Tem\u0103"
  }, ['light', 'dark'].map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    size: "sm",
    selected: state.theme === t,
    onClick: () => set({
      theme: t
    })
  }, t === 'light' ? 'Zi' : 'Noapte'))), /*#__PURE__*/React.createElement(Group, {
    label: "Nivel coad\u0103"
  }, [['low', 'Mică', 2], ['moderate', 'Medie', 6], ['high', 'Mare', 13], ['closed', 'Închis', 0]].map(([l, n, w]) => /*#__PURE__*/React.createElement(Chip, {
    key: l,
    size: "sm",
    selected: state.level === l,
    onClick: () => set({
      level: l,
      wait: w,
      age: 12
    })
  }, n))), /*#__PURE__*/React.createElement(Group, {
    label: "Calitatea estim\u0103rii"
  }, [['live', 'live'], ['degraded', 'aproximativ'], ['estimated', 'istoric']].map(([q, n]) => /*#__PURE__*/React.createElement(Chip, {
    key: q,
    size: "sm",
    selected: state.quality === q,
    onClick: () => set({
      quality: q,
      age: q === 'live' ? 20 : 240
    })
  }, n))), /*#__PURE__*/React.createElement(Group, {
    label: "St\u0103ri de sistem"
  }, /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: state.loading,
    onClick: () => set({
      loading: !state.loading
    })
  }, "Se \xEEncarc\u0103"), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: state.offline,
    onClick: () => set({
      offline: !state.offline,
      queued: state.offline ? 0 : 1
    })
  }, "Offline"), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: state.menuState === 'stale',
    onClick: () => set({
      menuState: state.menuState === 'stale' ? 'fresh' : 'stale'
    })
  }, "Meniu vechi"), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: !state.signedIn,
    onClick: () => set({
      signedIn: !state.signedIn
    })
  }, "Deconectat"), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    selected: state.install,
    onClick: () => set({
      install: !state.install
    })
  }, "Invita\u021Bie instalare")), /*#__PURE__*/React.createElement(Group, {
    label: "Marca"
  }, [['tray', 'A tavă'], ['signal', 'B semnal'], ['bite', 'C mușcătură'], ['plate', 'F placă']].map(([v, n]) => /*#__PURE__*/React.createElement(Chip, {
    key: v,
    size: "sm",
    selected: state.logo === v,
    onClick: () => set({
      logo: v
    })
  }, n))), /*#__PURE__*/React.createElement(Group, {
    label: "Limb\u0103"
  }, ['ro', 'en'].map(l => /*#__PURE__*/React.createElement(Chip, {
    key: l,
    size: "sm",
    selected: state.lang === l,
    onClick: () => set({
      lang: l
    })
  }, l.toUpperCase()))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "quiet",
    onClick: () => set({
      ...DEFAULTS,
      theme: state.theme,
      logo: state.logo
    })
  }, "Reseteaz\u0103")));
}
function InstallPrompt({
  onClose
}) {
  const {
    Button,
    Wordmark
  } = UB;
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-install",
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 84,
      zIndex: 30,
      background: 'var(--surface-raised)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      boxShadow: 'var(--shadow-overlay)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 34,
    variant: "mark"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, "Pune UBite pe ecranul principal"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, "Ca s\u0103 prime\u0219ti o notificare c\xE2nd e liber. Dureaz\u0103 cinci secunde."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "quiet",
    onClick: onClose
  }, "Mai t\xE2rziu"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    fullWidth: true,
    onClick: onClose
  }, "Adaug\u0103")));
}
function App() {
  const {
    Sheet,
    WaitReport,
    Toast,
    LogoSplash
  } = UB;
  const [state, setState] = React.useState(DEFAULTS);
  const [splash, setSplash] = React.useState(true);
  const [dish, setDish] = React.useState(null);
  const [sheet, setSheet] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const set = patch => setState(s => ({
    ...s,
    ...patch
  }));
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);
  const back = () => set({
    screen: 'home'
  });
  const openDish = d => {
    setDish(d);
    set({
      screen: 'dish'
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ub-stage"
  }, /*#__PURE__*/React.createElement(Toolbar, {
    state: state,
    set: set
  }), /*#__PURE__*/React.createElement("div", {
    className: "ub-phone-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-phone"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ub-statusbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, "12:41"), /*#__PURE__*/React.createElement("span", {
    className: "ub-numeric"
  }, "Cantina Kog\u0103lniceanu")), splash && LogoSplash && /*#__PURE__*/React.createElement(LogoSplash, {
    level: state.level,
    variant: state.logo,
    onDone: () => setSplash(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "ub-screen",
    key: state.screen,
    style: {
      position: 'absolute',
      inset: 0
    }
  }, state.screen === 'home' && /*#__PURE__*/React.createElement(HomeScreen, {
    state: state,
    set: set,
    openDish: openDish,
    openSheet: setSheet
  }), state.screen === 'dish' && dish && /*#__PURE__*/React.createElement(DishDetailScreen, {
    dish: dish,
    state: state,
    set: set,
    back: back
  }), state.screen === 'account' && /*#__PURE__*/React.createElement(AccountScreen, {
    state: state,
    set: set,
    back: back
  }), state.screen === 'visit' && /*#__PURE__*/React.createElement(AddVisitScreen, {
    state: state,
    set: set,
    back: back
  })), /*#__PURE__*/React.createElement(BottomNav, {
    screen: state.screen,
    go: s => set({
      screen: s
    })
  }), state.install && /*#__PURE__*/React.createElement(InstallPrompt, {
    onClose: () => set({
      install: false
    })
  }), sheet === 'report' && /*#__PURE__*/React.createElement(Sheet, {
    open: true,
    title: "C\xE2t ai a\u0219teptat?",
    onClose: () => setSheet(null),
    lang: state.lang
  }, /*#__PURE__*/React.createElement(WaitReport, {
    lang: state.lang,
    onSubmit: m => {
      setSheet(null);
      set({
        reportState: 'done',
        wait: m || 5,
        level: (m || 5) < 3 ? 'low' : (m || 5) < 9 ? 'moderate' : 'high',
        age: 2,
        quality: 'live'
      });
      setToast('Mulțumim. Estimarea s-a actualizat.');
      setTimeout(() => setToast(null), 2600);
    }
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 84,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    message: toast,
    tone: "success",
    icon: "circle-check"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "ub-caption"
  }, "400 px \xB7 zoom 200% f\u0103r\u0103 scroll orizontal \xB7 tem\u0103 ", state.theme === 'dark' ? 'întunecată' : 'luminoasă')));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/student-app/app.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.LogoSplash = __ds_scope.LogoSplash;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.DietaryTag = __ds_scope.DietaryTag;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.PersonMeter = __ds_scope.PersonMeter;

__ds_ns.QualityBadge = __ds_scope.QualityBadge;

__ds_ns.FreshnessStamp = __ds_scope.FreshnessStamp;

__ds_ns.CrowdingIndicator = __ds_scope.CrowdingIndicator;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.OfflineBanner = __ds_scope.OfflineBanner;

__ds_ns.WaitReport = __ds_scope.WaitReport;

__ds_ns.CrowdingByHour = __ds_scope.CrowdingByHour;

__ds_ns.GLYPHS = __ds_scope.GLYPHS;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.AppFooter = __ds_scope.AppFooter;

__ds_ns.Announcement = __ds_scope.Announcement;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.DishDetailHeader = __ds_scope.DishDetailHeader;

__ds_ns.DishPhoto = __ds_scope.DishPhoto;

__ds_ns.DishRow = __ds_scope.DishRow;

__ds_ns.CategoryHeader = __ds_scope.CategoryHeader;

__ds_ns.RatingStars = __ds_scope.RatingStars;

__ds_ns.LoyaltyDots = __ds_scope.LoyaltyDots;

__ds_ns.useReducedMotion = __ds_scope.useReducedMotion;

__ds_ns.Illustration = __ds_scope.Illustration;

__ds_ns.Pattern = __ds_scope.Pattern;

__ds_ns.Spotlight = __ds_scope.Spotlight;

})();
