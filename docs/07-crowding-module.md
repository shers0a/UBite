# Crowding Estimation Module

The "innovative element" of the funded project, and its largest technical risk. This document
specifies the estimation pipeline, the fusion algorithm, and — most importantly — how the
feature ships even if no camera ever arrives.

## What we are actually measuring

**The queue, not the room.**

The signed form says "number of persons present". The better measurement is the queue, for
three reasons grounded in the field facts:

1. Reviews report that tables are *"almost never all occupied"* — seating is not the
   bottleneck.
2. Reviews repeatedly mention the queue, and describe service as fast *"depending on the crowd
   of students and when they finish their courses."*
3. Only the queue converts naturally into **minutes**, which is what a student with a
   twenty-minute break actually needs.

The team's stated plan is two cameras, queue and hall. The hall camera is specified here as
optional and second priority; the evidence says it will add little.

> **CONFLICT** — Two cameras contradicts the signed application form, which describes
> *"o cameră amplasată în spațiul cantinei"* (one camera). Before ordering two, confirm with
> Andra that the deviation is acceptable, or keep the second as an unfunded future extension.

## Three independent sources

The architecture treats crowding as a fused estimate from three sources, each of which works
alone. This is deliberate insurance: **the camera depends on DCCAS procurement and DPO approval,
neither of which is secured.**

| Source | Produces | Available |
|---|---|---|
| **Camera** | People in the queue zone, every ~5s | Only once hardware and approval exist |
| **Student reports** | Actual waited minutes | From day one |
| **History** | Expected wait for this weekday and time slot | From week two |

## The core idea: reports calibrate the camera

A camera counts **people**. A student needs **minutes**. The conversion between them —
throughput — is unknown and varies with staffing and dish complexity.

Rather than guessing it, we learn it. Every student report is a labelled example: at a moment
when the camera saw *N* people, a real person waited *W* minutes.

This is the mechanism that turns the 30% report stream from a second opinion into a **ruler**,
and it produces the accuracy evidence R8 requires as a by-product.

### Calibration

For each accepted report with waited time `W` at time `t`, pair it with the camera count at the
moment that student joined the queue, approximately `t − W`:

```
pairs = [(count_at(t_i − W_i), W_i) for each accepted report i]
```

Fit a robust line using **Theil–Sen** (median of pairwise slopes) rather than least squares —
it tolerates the outliers a public reporting feature will inevitably contain and works with
very few points:

```
W ≈ slope · N + intercept
```

Blend with a prior so early estimates are stable:

```
slope_effective = (n · slope_fitted + k · slope_prior) / (n + k)      k = 10
```

**Priors**, to be replaced by a real measurement on the site visit — time ten people through
the till:

```
slope_prior     = 0.10 min/person    (≈10 people/minute across 2 tills, self-service)
intercept_prior = 0.5 min            (fixed overhead: tray, tap water, paying)
```

Refit nightly. Persist to `calibration_params` with `sample_size` and `mae_minutes`.

## Live fusion

Runs every 30 seconds, writes one row to `crowd_estimates`.

### 1 · Camera estimate

Aggregate raw detections into 1-minute medians (a median, not a mean — a single bad frame must
not move the published number).

```
W_cam = slope_effective · N_now + intercept_effective
```

Confidence decays with staleness:

```
conf_cam = 1.0                      if last observation < 2 min old
         = linear 1.0 → 0.0         between 2 and 10 min
         = 0.0                      if older than 10 min, or camera absent
```

### 2 · Report estimate

Take reports from the last 45 minutes. Weight each by exponential decay:

```
w_i = 0.5 ^ (age_minutes / 20)
```

A **20-minute half-life** — the team asked for decay that is not too fast. A report from five
minutes ago keeps ~84% of its weight; from forty minutes ago, ~25%.

Combine with a **weighted median**, not a mean, for robustness:

```
W_rep = weighted_median(waited_minutes, w_i)
conf_rep = min(1.0, Σw_i / 2.0)
```

Two fresh reports give full confidence; one gives half.

### 3 · Historical baseline

```
W_hist = median wait for (weekday, 15-minute slot), over all prior data
```

### 4 · Combination

The requested 70/30 split is the **nominal** weighting. Each nominal weight is scaled by its
source's confidence, then renormalised:

```
λ_cam  = 0.70 · conf_cam
λ_rep  = 0.30 · conf_rep

if λ_cam + λ_rep > 0:
    W = (λ_cam · W_cam + λ_rep · W_rep) / (λ_cam + λ_rep)
else:
    W = W_hist
```

This single expression produces exactly the behaviour needed:

| Situation | Result |
|---|---|
| Camera fresh, reports fresh | **70 / 30**, as specified |
| Camera fresh, no reports | 100% camera |
| Camera down or not installed | 100% reports |
| Neither available | Historical baseline, flagged as an estimate |

No special cases, no branching logic to maintain, and the launch does not wait for hardware.

Store the realised `camera_weight`, `report_weight` and `history_weight` on every row — this is
what makes the estimate auditable for R8.

### 5 · Quality flag

| `quality` | Condition | Shown to user as |
|---|---|---|
| `live` | `conf_cam ≥ 0.8` or `conf_rep ≥ 0.8` | "updated Ns ago" |
| `degraded` | some signal, low confidence | "approximate" |
| `estimated` | history only | "usual for this time" |

## Rejecting bad reports

Four defences, three of which were chosen explicitly by the team:

1. **Opening hours only.** Reports outside Monday–Friday 11:30–17:00 are rejected outright.
2. **One report per user per hour.** Enforced by a database index, not application code.
3. **Weighted median**, so a single absurd value cannot move the result.
4. **Camera arbitration.** When `conf_cam ≥ 0.8`, reject reports where
   `|W_i − W_cam| > max(5 min, 2.5 · MAD)`. Store them with `accepted = false` and a reason —
   never delete, because rejection patterns are themselves useful data.

Anonymous reports are permitted but carry half weight, since the per-user rate limit cannot be
enforced against them.

## Mapping minutes to the three levels

The application form requires **low / moderate / high**. Derive them from percentiles of the
observed distribution rather than from invented constants, recalibrated weekly:

```
low       W < p33
moderate  p33 ≤ W < p66
high      W ≥ p66
```

Bootstrap values for week one, replaced as soon as real data exists:

```
low       < 3 min
moderate  3 – 8 min
high      > 8 min
```

**Hysteresis:** a level change requires the threshold to be crossed by at least 1 minute and
held for two consecutive computation cycles. Without this, the badge flickers between levels at
the boundary and the app looks broken.

## Cold start

| Week | Camera | Reports | History | What the user sees |
|---|---|---|---|---|
| 1 | probably absent | few | none | Current estimate where possible; the "typical by hour" section is hidden |
| 2 | maybe | building | usable | Full experience, `degraded` common |
| 3+ | if procured | steady | solid | `live` most of the time |

Hiding the hourly prediction in week one is deliberate: a flat, wrong chart damages trust more
than an absent one.

## Model and runtime

- **Pre-trained detection, `person` class only.** No training is required to count people; a
  standard pre-trained detector does this out of the box. The form asks for *estimation*, not
  for a bespoke model.
- Small model variant, CPU inference, one frame every 3–5 seconds. That is ample for a value
  that is published as one of three levels.
- The team elected to fine-tune on a few dozen canteen images for calibration. This is
  permitted but **not on the critical path** — ship with the pre-trained model, fine-tune later
  only if measured accuracy demands it. Image handling rules are mandatory and are specified in
  [11-privacy-gdpr-accessibility.md](11-privacy-gdpr-accessibility.md).
- A zone polygon, configured once, restricts counting to the queue area. This both improves
  accuracy and narrows the privacy footprint.

## Privacy constraints — non-negotiable

- Frames are processed in memory and discarded. **No image is ever written to the database.**
- Only `{timestamp, zone, person_count, confidence}` leaves the vision service.
- No tracking, no re-identification, no faces, no attributes. A person is an anonymous
  increment to a counter.
- Running inference at the edge — so that video never traverses the network — is the strongest
  argument available when the DPO asks. See the architecture conflict in
  [06-architecture.md](06-architecture.md).

## Proving accuracy for R8

The form requires testing across at least ten time slots plus an accuracy analysis. Two
measurements, reported separately:

**Conversion accuracy** — mean absolute error between predicted wait and subsequently reported
wait, on held-out reports. Free, continuous, and naturally covers far more than ten time slots.

**Counting accuracy** — three manual counting sessions at different times of day, comparing a
human count against the camera's. This isolates detection error from conversion error.

Reporting both, with `mae_minutes` and `sample_size` from `calibration_params`, is a
substantially stronger result than ten manual counts alone.

## If the camera never arrives

The feature still ships and still satisfies the objective. Reports plus history produce a
crowding level and a wait estimate from day one; the UI marks them as approximate. The
application form commits to *estimating* crowding, not to a specific sensor — so this is a
legitimate delivery of O.2, not a failure.

This is the single most important property of this design.
