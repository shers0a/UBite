# Risk Register

Ordered by expected damage. Review weekly — this document is worthless if it is written once
and never reopened.

**P** = probability, **I** = impact, both Low / Medium / High.

---

## R-01 · No DPO approval for the camera · P: Medium · I: High

Nobody knows who the UB Data Protection Officer is. Nobody has contacted them. A camera
recording people in a canteen is a data-protection matter regardless of intent, and approval
can arrive late or not at all.

**Worse:** the team's initial position was to retain images for training — which contradicts the
signed application form's promise of *"fără identificarea persoanelor"*.

**Mitigation** — Andra identifies the DPO this week; the team drafts a DPIA and privacy policy;
no images are stored at all, so the request becomes "we count people and keep only a number".
**Fallback:** reports plus history deliver R5–R8 with no camera. See
[11](11-privacy-gdpr-accessibility.md).

---

## R-02 · Cameras never arrive · P: Medium · I: Medium

Not in the budget. Based on one verbal statement relayed through Andra: Cîrciumaru "will buy
them". No written commitment, no date, no specification.

**Mitigation** — Get it in writing with a delivery date. Specify cameras that count on-device
if possible. **Fallback:** as R-01 — the feature ships without them. Decision point: **10
October.** If there is no hardware by then, stop waiting and ship the fallback.

---

## R-03 · Canteen staff never enter the menu · P: High · I: High

The one remaining staff dependency, and the one Marius identified on day one: *"the hardest
part will be convincing the canteen staff."* Estimated willingness: 1–2 minutes a day, one
person. The team chose to have the canteen enter menus **from the first day**, and chose that
when they do not, the app simply shows no menu.

That combination means the pilot can appear empty during the exact weeks users are being
counted — and the menu is the content that brings people back daily.

**Mitigation** — Make the editor trivial: yesterday's menu preloaded, under 40 dishes, one
action. Find one ally in the canteen. An alert fires if no menu is published by 10:00 —
**decide now who acts on that alert**, because an alert nobody acts on changes nothing.
**Fallback:** a team member enters the menu in under two minutes for the pilot's duration.

---

## R-04 · Scope exceeds the time available · P: High · I: High

Nineteen features, full documented WCAG AA, broad test coverage, launch 13 October, ~2,5 weeks
of pilot, three part-time students, no fixed hours commitment, and "done" defined as everything
confirmed.

**Mitigation** — R2's five features are the floor and are protected. Order of sacrifice if
needed: broad test coverage first (keep tests on fusion and loyalty), then F9–F17, never
F1–F5. Set a feature freeze one week before 31 October.

---

## R-05 · Video over weak Wi-Fi to a GPU-less server · P: High · I: High

Three confirmed decisions collide: Wi-Fi is weak, inference runs on the UB server, and the
server is assumed to have no GPU. Streaming two camera feeds over a weak network to a CPU-only
machine does not work.

**Mitigation** — Move inference to the edge; only a number crosses the network. Costs ~600 RON,
unbudgeted. Or specify cameras that count in firmware. Confirm actual Wi-Fi strength on the
site visit before ordering anything. See [06](06-architecture.md).

---

## R-06 · No written agreement on loyalty · P: Medium · I: Medium

Who pays for the free meal is unresolved. Blocks R13, R14, R15.

**Mitigation** — Go to Cîrciumaru with numbers, not concepts: ~10 RON per 50 RON spent, a few
hundred RON of total exposure, fully reported in his dashboard. **Fallback:** the soft variant —
the app counts, DCCAS honours rewards manually. Delivers all three results.

---

## R-07 · UB infrastructure arrives late · P: High · I: Medium

Server, SSO and the `unibuc.ro` subdomain are all verbal promises with no access, no
specification and no date.

**Mitigation** — Already decided: free hosting from day one, migrate later. PostgreSQL
everywhere makes migration a connection-string change. Email codes instead of SSO. Request the
subdomain now; launch on a working URL regardless. This risk is essentially neutralised.

---

## R-08 · The vision module has no named owner · P: Medium · I: High

The team chose "everyone on everything" with no hours commitment. The vision module is the only
item with a genuinely long critical path, and the natural owner — Radu — is in first year, on a
practice placement, and has had family commitments.

**Mitigation** — Name one owner and one backup for this module specifically, even if everything
else stays shared. Its fallback path is already designed, which caps the damage.

---

## R-09 · Zero budget contingency · P: High · I: Medium

The 350 RON contingency became posters, flyers and stickers. Cameras, edge compute, domain and
SSL are all unbudgeted. Money flow, invoicing and who purchases are all unresolved.

**Mitigation** — Andra to confirm advance versus reimbursement before any commitment. Hosting,
domain and analytics all have free options. Andra noted that extra funds could be requested —
test that now rather than in late October.

---

## R-10 · Receipt OCR is unreliable · P: Medium · I: Low

Thermal receipts scan poorly. Loyalty, monthly spend and "what I ate" all depend on parsing.

**Mitigation** — Fall back to manual entry of receipt number and total. The ledger needs no
schema change, loyalty still works, and only the itemised part of history degrades.

---

## R-11 · Two cameras contradict the signed form · P: Medium · I: Low

The form specifies one camera; the team planned two. Field evidence says the dining-hall camera
adds little, since tables are rarely all occupied.

**Mitigation** — Start with one on the queue. Confirm with Andra before any deviation.

---

## R-12 · Single-owner repository · P: Low · I: Medium

The repository sits on Radu's personal account. GitHub does not permit shared ownership of
personal repositories. If access is lost, so is the project.

**Mitigation** — A GitHub Organisation costs nothing and solves it. Until then: ensure all three
have push access and that everyone holds a local clone.

---

## R-13 · Nobody owns R17 · P: High · I: Low

The business-partnership proposal is an assumed result in a signed document that has never been
discussed by anyone.

**Mitigation** — It is a document, not software. Assign it to Andra or Lemnaru with a date.
Same for R16.

---

## R-14 · Wall-mounting liability · P: Low · I: Medium

The team chose to mount the camera and tablet themselves, in a public institution, taking on
responsibility for drilling and for a stealable device.

**Mitigation** — Written permission from DCCAS before touching a wall. Agree post-pilot
ownership of the tablet in the same message.

---

## R-15 · Allergen data accuracy · P: Low · I: High

Gluten-free and lactose-free flags were selected for display. Incorrect information here has
medical consequences.

**Mitigation** — Canteen is the sole source; never infer. Unknown displays as "information not
available", never as absence. Disclaimer on every dish detail screen.

---

## Weekly review

Five minutes, once a week, three questions:

1. Did any probability change?
2. Did any decision point arrive? (R-02's 10 October is the first)
3. Is any fallback now the main plan, and does everyone know?
