/* The camera live view (docs/11, "The live-view exception"): a tech admin opens it in the admin screen to
   see what the counter sees — the frame it just counted, its boxes and the queue zone.

   Frames live only in this process's memory: the latest one per camera, for at most FRAME_TTL_MS, and only
   while a view is open. They never reach the database, the disk or a log line. The vision service sends a
   frame only after the API has told it that someone is watching (the answer to each observation), so while
   nobody watches no image leaves the service at all. A view closes itself after VIEW_MS, or when its page
   stops asking for WATCHING_MS. Each opening is recorded (who, when) in camera_live_views; what was seen is
   not. */
import type { LiveDetection, LiveFrame } from '@ubite/shared';
import type { Ctx } from '../context';

export const VIEW_MS = 5 * 60_000;
export const FRAME_TTL_MS = 15_000;
export const WATCHING_MS = 20_000;

interface View { openedAt: number; seenAt: number }
interface Held extends LiveFrame { receivedAt: number }

export interface IncomingFrame {
  camera: string;
  observedAt: string;
  width: number;
  height: number;
  zone: Array<[number, number]> | null;
  personCount: number | null;
  detections: LiveDetection[];
  jpeg: string;
}

export class LiveView {
  private views = new Map<string, View>();
  private frames = new Map<string, Held>();

  constructor(private now: () => number) {}

  /** Opens (or restarts) this admin's view; when it closes itself. */
  open(userId: string): number {
    const t = this.now();
    this.views.set(userId, { openedAt: t, seenAt: t });
    return t + VIEW_MS;
  }

  close(userId: string): void {
    this.views.delete(userId);
    this.prune();
  }

  /** The view's latest frames, or null once it has closed. Asking keeps it open, up to VIEW_MS. */
  poll(userId: string): { closesAt: number; frames: LiveFrame[] } | null {
    this.prune();
    const v = this.views.get(userId);
    if (!v) return null;
    v.seenAt = this.now();
    const frames = [...this.frames.values()]
      .sort((a, b) => a.camera.localeCompare(b.camera))
      .map(({ receivedAt: _r, ...f }) => f);
    return { closesAt: v.openedAt + VIEW_MS, frames };
  }

  /** Whether any view is open: what the API tells the vision service with every observation. */
  watching(): boolean {
    this.prune();
    return this.views.size > 0;
  }

  /** Keeps a frame the vision service sent, only while someone watches; false when it was dropped. */
  put(f: IncomingFrame): boolean {
    if (!this.watching()) return false;
    const { jpeg, ...rest } = f;
    this.frames.set(f.camera, { ...rest, image: `data:image/jpeg;base64,${jpeg}`, receivedAt: this.now() });
    return true;
  }

  private prune(): void {
    const t = this.now();
    for (const [id, v] of this.views) {
      if (t - v.openedAt >= VIEW_MS || t - v.seenAt >= WATCHING_MS) this.views.delete(id);
    }
    if (this.views.size === 0) this.frames.clear();
    for (const [cam, f] of this.frames) if (t - f.receivedAt > FRAME_TTL_MS) this.frames.delete(cam);
  }
}

// One live view per running app (the VM runs one API process). On serverless hosting each instance would
// hold its own, which only means the view stays empty there: that host has no camera.
const views = new WeakMap<Ctx, LiveView>();

export function liveView(ctx: Ctx): LiveView {
  let v = views.get(ctx);
  if (!v) views.set(ctx, (v = new LiveView(() => ctx.now().getTime())));
  return v;
}
