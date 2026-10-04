# Camera Research

What we could put in the canteen to count the queue, what each option costs, and where the
counting runs. Written 25 Sep 2026, after the meeting with UB, which set two next steps:
**research the camera options**, and **test the application and inference on a VM**.

Prices are from Romanian shops where one was found, otherwise converted at ~5,0 RON/EUR and
~4,4 RON/USD and marked *est.* Check every price again before ordering.

> **Decision, later on 25 Sep 2026:** counting runs **on the UB servers**. The camera only
> delivers a high-quality image at low frame rate (RTSP or JPEG snapshots) over a cable; in-camera
> counting (option A) is no longer needed. The shortlist of cameras sold in Romania for that setup
> — prices, links, bandwidth, cost scenarios and the questions for IT UB and DCCAS — is in
> [camere-romania-2026-09.xlsx](camere-romania-2026-09.xlsx), rebuilt by
> `python scripts/camera-sheet.py`.

---

## What the camera has to do

From [07](07-crowding-module.md) and [11](11-privacy-gdpr-accessibility.md):

- Count **people standing in the queue zone** (a polygon), every ~5 seconds. Not the whole hall,
  not entries and exits.
- Send out only `{timestamp, zone, person_count, confidence}`. No image is stored, no tracking,
  no faces.
- Work indoors under canteen lighting, mounted high on a wall or the ceiling, looking down the
  queue.
- Give us the count or the stream over the network: **RTSP/ONVIF** for the video, or an
  **HTTP API** for a count the camera computes itself.
- Run off one cable if possible (**PoE**), since there may be no socket at the camera position (D4).

## Where the counting can run

This decides the hardware more than the camera model does.

| Where | How | Needs | Privacy |
|---|---|---|---|
| **In the camera** | The camera's firmware counts people in a zone; we read the number over its HTTP API | A camera with people counting / queue management | Best: video never leaves the camera |
| **Edge box beside the camera** | Our `services/vision` reads RTSP on the local network, sends counts out | A Raspberry Pi, mini PC or Jetson, plus power | Very good: video never leaves the room |
| **UB VM (HCI)** | The camera streams RTSP to the VM, which counts | A stable network path camera → ACC; VM has **no GPU** | Weaker: video crosses the UB network |
| **UB HPC GPU (H100)** | SLURM job | Not usable: jobs are time-limited, not a 24/7 service | — |

The ACC guide confirms the HCI VMs are CPU only, and that the H100 node is reserved for SLURM
batch jobs. The benchmark below answers whether CPU is enough. It is: one frame every 5 seconds is
trivial even on a small CPU.

---

## The options

### A · Camera that counts in firmware *(recommended if DCCAS buys)*

The camera runs a people-detection model on its own chip and reports "N people in region X".
We only read a number. This is the option [12](12-infrastructure-and-deployment.md) already
recommends.

| Model | Relevant function | Price | Notes |
|---|---|---|---|
| **Dahua WizMind 5** — IPC-HDW5442TM-ASE (4 MP eyeball) | Queue management, "in area" people count, several regions | ~224 USD → ~1.000–1.200 RON *est.* | Most counting per leu; HTTP API; PoE |
| **Hikvision DeepinView** — iDS-2CD7A46G0/P-IZHS(Y) | Queue management across 8 zones | ~2.500–4.000 RON *est.* | Top range, varifocal; ISAPI; can push events over HTTP |
| **Axis** M3086-V with AXIS Object Analytics | Occupancy in area, deep learning on the edge | ~1.500 RON *est.* | Cleanest API and documentation; Swedish, no procurement restrictions |
| Hikvision DS-2CD6825G0/C-IVS (dual lens) | Counts **entries and exits** at a door | ~610 EUR with VAT → ~3.000 RON | Wrong tool: counts a doorway, not a queue |

**For:** no computer to buy or maintain, lowest network load, strongest GDPR argument.
**Against:** we depend on the vendor's accuracy and API; the zone and thresholds are set in the
camera's web interface; the models are more expensive than a plain camera.

> Hikvision and Dahua are restricted for public procurement in some countries (US, UK public
> sector). Not the case in Romania today, but DCCAS may have its own rules. Ask.

### B · Plain IP camera + our own model

Any camera with RTSP; our `services/vision` does the counting on an edge box or on the VM.

| Model | Price | Notes |
|---|---|---|
| **Reolink RLC-520A** (5 MP dome, PoE) | ~300–330 RON (Vexio) | RTSP/ONVIF, no subscription, indoor dome, good value |
| Reolink RLC-510A / 810A | ~300–500 RON | Bullet; same stack |
| TP-Link VIGI / Tapo | ~150–350 RON *est.* | Tapo is Wi-Fi and RTSP, cheapest; check it holds RTSP up for days |
| Hikvision / Dahua entry range | ~250–500 RON *est.* | RTSP, ONVIF |

**For:** cheapest camera; we control the model, the zone and the accuracy measurement (R8).
**Against:** needs somewhere to run the model (edge box or VM) and someone to keep it running.

### C · The edge box (only with B)

| Box | Price | Speed for our model |
|---|---|---|
| **Mini PC Intel N100, 16 GB** | from ~1.200 RON (eMAG) | CPU is enough at 1 frame / 5 s; x86, runs our Docker image unchanged |
| Raspberry Pi 5 8 GB + AI HAT+ 13 TOPS (Hailo-8L) | 976 + 382 RON (Optimus Digital) + PSU/case/card ~150 → ~1.500 RON | Real-time with the Hailo; CPU alone also works at our rate |
| Raspberry Pi 5 alone (4–8 GB) | ~600–976 RON | Enough for 1 frame / 5 s on CPU; cheapest real box |
| NVIDIA Jetson Orin Nano Super | 399 USD since the July 2026 price rise → ~1.800–2.400 RON | Overkill for this; price volatile |

The "~600 RON edge compute" line in [14](14-budget-and-procurement.md) was written before the
2026 memory price rise. It now buys a Raspberry Pi 5 alone, not a mini PC.

### D · Time-of-flight people counter (not a camera)

**Milesight VS133-P** (PoE): a 3D depth sensor that counts people and supports queue management
**without recording any image**. ~598 USD → ~2.600 RON *est.*

**For:** no image exists at all, so the DPO question nearly disappears; 99%+ counting accuracy.
**Against:** made for doorways and short corridors; coverage from ceiling height is a few
metres, which may not cover a long queue. Most expensive per unit.

### E · No new hardware

- **The canteen's existing CCTV.** If the canteen already has cameras, one may already see the
  queue. We would only need its RTSP stream. Ask DCCAS.
- **Till counts per time slot** (B6 in [17](17-open-questions.md)): exact throughput for free.
  Not a live count, but the best calibration there is.
- **A phone as a camera** for testing: an old Android phone with an IP camera app gives an RTSP
  stream today, at zero cost. Good enough to test the whole pipeline in the canteen before
  anything is bought. Not for production.

---

## Recommendation

1. **Ask DCCAS for a camera that counts in firmware** (option A, Dahua WizMind 5 class, ~1.100 RON).
   Nothing else to buy, video never leaves the camera, and the budget question for edge compute
   goes away.
2. **If DCCAS buys a plain camera** (option B), add a **Raspberry Pi 5** or an **N100 mini PC**
   beside it, running our Docker image. Counting on CPU is enough (see the benchmark).
3. **Counting on the UB VM** is possible on CPU, but only if the camera can reach the ACC network
   reliably. It is the weakest option for privacy and depends on the canteen's network. Keep it as
   the fallback, not the plan.
4. **Test now with a phone** in the canteen at lunch, pointed at the queue, to measure accuracy
   and choose the camera position before anything is bought.

## What to ask DCCAS

1. Does the canteen already have CCTV? Could we use one stream?
2. Can you buy a camera with people counting / queue management (Dahua WizMind, Hikvision
   DeepinView, Axis)? Do you have a preferred brand or supplier?
3. Are any brands excluded from your procurement?
4. Is there PoE or a socket and a network cable where the camera would go?
5. Does the camera sit on the canteen network or on the UB network, and can it reach the internet
   or the ACC?

## Model licence

The benchmark uses **Ultralytics YOLO11**, which is **AGPL-3.0**: a service that uses it over a
network must publish its source. Our repository becomes public at launch, so this is acceptable,
but it is a decision, not a default. Permissive alternatives if needed: **RF-DETR** (Apache-2.0),
**YOLOX** (Apache-2.0), **SSD-MobileNet** (Apache-2.0). `services/vision` loads any ONNX
detector with the same output shape, so swapping is a file change.

---

## Inference benchmark

Run on 25 Sep 2026 with `services/vision` (onnxruntime 1.30, CPU only, person class only), on
Marius's laptop (Intel 14th-gen, 28 threads) natively and in Docker with the CPU capped to
imitate a small VM. Milliseconds per frame, median:

| Model | Input | Laptop, all cores | Docker, 2 CPUs | Docker, 1 CPU |
|---|---|---|---|---|
| **YOLO11n** | 640 | 22 ms | **40 ms** | 61 ms |
| YOLO11n | 320 | 8 ms | 10 ms | — |
| YOLO11s | 640 | 46 ms | 110 ms | — |

**Conclusion: counting does not need a GPU.** We need one frame every 5 seconds. At 40–110 ms a
frame on 2 CPUs, that is under 2% of the VM, and a Raspberry Pi 5 (roughly 5–10× slower than
this laptop) still finishes well inside 5 seconds. An EPYC core on the UB VM is slower than a
laptop core, so expect up to about double these numbers there. Still far inside the budget.

Two things we found:

- **Set `VISION_THREADS` to the number of vCPUs.** onnxruntime sees every host core, not the
  container's quota. With 28 threads on 2 CPUs, inference went from 40 ms to 205 ms. The Docker
  image now defaults to 2.
- **Accuracy is limited by the camera angle, not the model.** On a side-on photo of a 16-person
  street queue, YOLO11s found 13–14 people; the ones it missed were hidden behind others. A camera
  high up, looking down the queue, removes most of that occlusion. This is what D2 on the site
  visit decides.

Detected people on public test photos (Wikimedia Commons, not the canteen):

| Photo | YOLO11n | YOLO11s |
|---|---|---|
| Street queue, 16 people, side-on | 14 | 13 |
| Food queue | 7 | 7 |
| 1952 cafeteria, queue + seated hall | 8 | 11 |

The canteen accuracy numbers R8 needs come from the phone test and the three manual counts in
[07](07-crowding-module.md), not from these photos.

### How to repeat it on the UB VM

```bash
cd services/vision
python -m venv .venv && .venv/bin/pip install -r requirements-export.txt
.venv/bin/python export_model.py yolo11n yolo11s          # once; produces models/*.onnx
docker build -t ubite-vision .
docker run --rm --cpus=2 ubite-vision speed --imgsz 640 320
docker run --rm -e VISION_THREADS=2 ubite-vision watch --source "rtsp://…" --every 5 \
  --zone "[[0.1,0.3],[0.9,0.3],[0.9,1],[0.1,1]]"          # one JSON line per observation
```

Without Docker: `pip install -r requirements.txt` is enough to run `bench.py` (no torch).

---

## Placement and counter, tested on the digital twin (3–4 Oct 2026)

The twin is the canteen scanned on 30 Sep, rebuilt in Unity with calibrated light and simulated students. Its
pipeline lives in the private `UBite-twin` folder: the renders show avatars only, but the scan shows staff. Every
number below is from simulated people, so treat it as an upper bound that ranks the options. The real accuracy
comes from the three manual counting sessions ([07-crowding-module.md](07-crowding-module.md)).

### Where the cameras go

We scored 499 mounts (ceiling at 3.12 m, walls, columns), 168 aims and 5 lenses on a 4 MP sensor. Each
candidate was ray-cast through the scanned hall at a peak hour: the line full, 30 more in the aisle, every seat
taken and a third of the floor walking. A person counts as seen when their head and shoulders are in sight and
the head covers at least 12–24 px.

The main plan is bought in steps: start with 2 cameras, add one at a time, and never move a mounted one. At
each size it scores within 0.02 of the best set chosen on its own.

| Set | Cameras (4 MP) | Queue (line / long tail) | Seated | Standing |
|---|---|---|---|---|
| P2 | C1 north wall behind the line, 2.8 mm; C2 on the column at x 26.5, 6 mm, down the aisle | 100% / 81% | 37% | 48% |
| P3 | + C3 ceiling by the east windows, 3.6 mm | 100% / 100% | 63% | 67% |
| P4 | + C4 ceiling by the entrance, 2.8 mm | 100% / 100% | 80% | 88% |
| P5 | + C5 ceiling by the east windows, 3.6 mm | 100% / 100% | 86% | 91% |
| V2 | queue only: C1 + a 6 mm camera on the same column | 100% / 81% | 31% | 48% |
| V3 | no ceiling work: C1, a column, the entrance wall | 100% / 77% | 61% | 95% |

Each set was rendered as 2 minutes of 4 MP video at 25 fps, 12:45 at peak, through a real-camera look: lens
distortion, WDR, noise, 3D noise reduction, an on-screen clock and H.264 at 6 Mbit/s.

### Off-the-shelf detectors on those feeds

Error in people, with each detection given its true position so that only the detector is measured:

| Model | Queue error (truth ~31) | Hall error (truth 48–91) |
|---|---|---|
| YOLO11n at 640 (the first counter) | 8–14 | 5–16 |
| YOLO11/26 n–x, RT-DETR, RF-DETR at 1280, even at full 2560 | 10–12 | 2.5–5 |
| The same with 640 px tiles at full resolution (SAHI) | **2–3** | 3–5 |

Far people need full-resolution tiles. Placing people on the floor plan from the image added more error than the
choice of model did.

### The counter now in `services/vision`

- **Detection.** `ubite-n.onnx` is YOLO26n trained on the twin, with three classes: person, standing head and
  seated head. It ran 40 epochs on about 12,000 tiles: 14 lunches × 12 cameras × 14 stills, randomised camera
  look, labels that know what is hidden. Validation on an unseen lunch: mAP50 0.925, mAP50-95 0.664.
- **Resolution.** The whole frame is counted at 1280 px, then 640 px tiles of each camera's far band at full
  resolution.
- **Placement.** Each head goes on the floor plan at the height of its posture: 1.67 m standing, 1.30 m seated.
- **Fusion.** Heads from different cameras closer than 0.45 m + 0.045 m per metre of distance are one person.
- **Zones.** They come from the placement study and say queue or hall.
- **Scaling.** The hall count is divided by the share of places the cameras see well and by the completeness
  measured on the twin. Under half seen, the hall is not reported.

On the second minute of the test feeds (the completeness was fitted on the first):

| Set | Queue error (truth 31.4) | Hall error (truth 97.7) | CPU per 5 s round, laptop, 2 threads |
|---|---|---|---|
| P2 | 2.2 | 4.9 | 0.41 s |
| P3 | 2.2 | 2.9 | 0.59 s |
| P4 | 2.3 | 2.8 | — |
| P5 | 1.8 | 2.6 | 0.70 s |
| V2 | 2.0 | not reported (48% seen) | — |
| V3 | 1.5 | 4.7 | — |

The same pipeline with the COCO model counted the queue as well (2–4) but missed 24–48 of the ~99 in the hall.
The UB HPC node runs YOLO11n about 2.3 times slower than the laptop, so expect 1–1.6 s per round on the 2-vCPU
VM, a fifth to a third of it.

### What it does not settle

- **The queue zone also holds people walking along the aisle with trays.** Against the people actually waiting,
  the count is 6–7 high at peak. The reports' calibration absorbs a steady offset, not a varying one. Counting
  only heads that stay put between two rounds would fix it, using positions only.
- **Synthetic people are not real people.** On frames of the real canteen from the 30 Sep visit, the model found
  the staff's and students' heads about as well as the COCO model found their bodies. The far ones it found
  better. How accurate it is there, and how often it gets posture right, is for the manual counts to say.
  Fine-tuning on a few hundred real frames needs the DPIA exception.
- **Licence.** The weights are Ultralytics, AGPL-3.0. They are trained on synthetic renders only, so publishing
  them carries no privacy risk. The open choice is in [22-decision-log.md](22-decision-log.md).
- **A real install needs its own calibration.** Each camera's pose and lens must be fitted from four or more
  points of known position in the hall. Then the site file is rebuilt from the twin with the real poses.

---

## Sources

- [ACC-UB user guide: HPC](https://unibuc-dtd.github.io/advanced-computing-center-user-guide/hpc/), [HCI](https://unibuc-dtd.github.io/advanced-computing-center-user-guide/hci/)
- [Dahua WizMind IPC-HDW5442TM-ASE](https://dahuasecurity.com/products/All-Products/Network-Cameras/WizMind-5-Series/S-Series/4MP/IPC-HDW5442TM-ASE=S3), [price (cctv-mall)](https://www.cctv-mall.com/products/dahua-ipc-hdw5442tm-ase-s3-4mp-ir-fixed-focal-eyeball-wizmind-network-camera), [queue management](https://www.dahuasecurity.com/products/keytechnologies/947/132)
- [Hikvision DeepinView iDS-2CD7A46G0/P-IZHS](https://www.hikvision.com/en/products/IP-Products/Network-Cameras/DeepinView-Series/ids-2cd7a46g0-p-izhs-y-/), [DS-2CD6825G0/C-IVS price](https://www.megateh.eu/products/hikvision-ip-network-cameras-special-series/hikvision-ds-2cd6825g0-c-ivsb-2mp-dual-lens-people-counting-ip-camera-2mm-1045-outdoor)
- [AXIS M3086-V](https://www.axis.com/products/axis-m3086-v), [AXIS Object Analytics](https://www.axis.com/products/axis-object-analytics)
- [Reolink RLC-520A (Vexio)](https://www.vexio.ro/camere-de-supraveghere/reolink/763275-reolink-rlc-520a-poe/)
- [Raspberry Pi 5 8 GB](https://www.optimusdigital.ro/en/raspberry-pi-boards/12929-raspberry-pi-5-8gb.html), [AI HAT+ 13 TOPS](https://www.optimusdigital.ro/en/raspberry-pi-hats/13323-raspberry-pi-ai-hat-13-tops-pentru-raspberry-pi-5.html), [AI HAT+ 2 review](https://www.tomshardware.com/raspberry-pi/raspberry-pi-ai-hat-plus-2-review)
- [Jetson price rise, July 2026](https://www.cnx-software.com/2026/07/22/nvidia-increases-the-price-of-jetson-modules-and-devkits-by-up-to-101/)
- [Mini PC N100 (eMAG)](https://www.emag.ro/search/mini+pc+intel+n100)
- [Milesight VS133-P](https://store.mcci.com/products/ai-tof-people-counting-sensor-vs133-p)
