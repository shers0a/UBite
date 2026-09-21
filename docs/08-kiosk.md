# Kiosk

A tablet mounted in the canteen. Budgeted at 900 RON for the device plus 350 RON for an
anti-theft mount. Required by the application form: *"un punct digital de interacțiune tip
kiosk, prin intermediul unei tablete, pentru înregistrarea la intrarea în cantină"* and by
result **R3**.

## What it is for

The form's wording is vague, so the team defined it. Three purposes, in priority order:

1. **A download point.** A QR code that installs the app. This is the single best acquisition
   channel available — it reaches people at the exact moment they care, and it feeds the 300
   unique users R9 requires.
2. **A public display.** Today's menu and current crowding, useful to everyone, including those
   who will never install anything.
3. **A feedback collector.** Three emoji, one tap. Contributes to the 100 responses in R11
   without requiring an account.

Explicitly **not** a loyalty scanner. At the entrance, a scan proves someone walked in, not that
they bought anything — and loyalty is handled by receipt photographs instead. See
[09-loyalty.md](09-loyalty.md).

## Placement

**At the entrance, wall-mounted, beside the door.**

Everyone entering and leaving sees it, which maximises both downloads and feedback, and it
matches the form's phrasing about the entrance. It needs a power socket within reach.

> **ASSUMPTION** — Placement is unverified; nobody has seen the room. Confirm on the site visit
> that a wall near the entrance has a socket and is visible from the door. Fallback positions,
> in order: beside the queue, then near the exit.

## Behaviour

The kiosk is a route in the same web application, in kiosk mode. Not a separate build.

### Idle rotation

Nobody touches it for minutes at a time, so it must be useful untouched. It rotates between
three panels:

| Panel | Duration | Content |
|---|---|---|
| Menu | ~12s | Today's dishes by category with prices, large type |
| Crowding | ~8s | Level, estimated wait, freshness |
| Download | ~8s | Large QR code and one line of explanation |

Readable from **three metres**: minimum 24px effective body text at viewing distance, high
contrast, no thin weights.

The QR panel is not a filler slide. It is the reason the device earns its budget line.

### Interaction

A single tap pauses the rotation and reveals the full menu plus a three-emoji feedback row.
After 45 seconds of inactivity, it returns to rotating.

There is no other interaction. No account, no keyboard, no forms — a public tablet in a canteen
is not a place for typing.

## Device configuration

- Android tablet, ~900 RON class
- Locked into kiosk mode so only the browser, on one URL, is reachable
- Screen always on while powered; auto-launch on boot after a power cut
- Automatic daily reboot outside opening hours
- Device account separate from anyone's personal account
- Automatic updates disabled during the pilot

### Offline behaviour

The canteen's Wi-Fi is weak. The kiosk caches the menu and the last crowding estimate and keeps
displaying them with a visible timestamp. The QR code is static and works regardless.

It must never display a browser error page. That is what people will photograph.

## Physical and operational

| Item | Status |
|---|---|
| Anti-theft mount | Budgeted, 350 RON |
| Power socket nearby | **Unverified** — site visit |
| Wi-Fi coverage at that wall | **Unverified** — reported weak overall |
| Who mounts it | The team, with canteen permission |
| Who switches it on | **Open** — nobody assigned |
| Ownership after 31 October | **Open** — it stays in the canteen, in whose inventory? |

> **RISK** — The team elected to mount the hardware themselves. That means accepting
> responsibility for drilling into a public institution's wall and for the device's safety.
> Get explicit permission from DCCAS in writing first, and agree who owns the tablet after the
> pilot. It is the most stealable item in the project.

## Success measures

- QR scans converting to first app opens — the primary number
- Feedback submissions from `source = kiosk`
- Uptime during opening hours

If the QR conversion is low after the first week, enlarge the code and shorten the text. If it
stays low, the placement is wrong — move it.

## Open items

- [ ] Confirm a wall position with power and signal
- [ ] Confirm permission to mount
- [ ] Assign a person to switch it on and check it daily
- [ ] Agree post-pilot ownership
- [ ] Decide whether a cheap always-on display would serve better than an interactive tablet —
      the budget is already committed to a tablet, but the question is worth answering before
      purchase
