/* Uploaded photos (receipts, dish photos): the format comes from the bytes, never from the MIME
   type; a pixel bomb is refused from its header; at most two decode at once. */
import zlib from 'node:zlib';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { checkImage, MAX_INPUT_PIXELS, prepareReceipt, sniffImage } from '../src/services/receipt-image';
import { JobLimiter } from '../src/services/pool';
import { appFor, lastCode, testContext, tinyJpeg, type TestCtx } from './helpers';

const H = { 'X-UBite': '1' };
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16000" height="16000"><rect width="100%" height="100%" fill="#fff"/></svg>');

/** A valid PNG whose header claims width x height: sharp reads the header, never the pixels. */
async function pngClaiming(width: number, height: number): Promise<Buffer> {
  const png = Buffer.from(await sharp({ create: { width: 1, height: 1, channels: 3, background: '#000' } }).png().toBuffer());
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  png.writeUInt32BE(zlib.crc32(png.subarray(12, 29)), 29);
  return png;
}

describe('the format, from the bytes', () => {
  it('knows JPEG, PNG and WebP, and nothing else', async () => {
    const base = sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } });
    expect(sniffImage(await base.clone().jpeg().toBuffer())).toBe('jpeg');
    expect(sniffImage(await base.clone().png().toBuffer())).toBe('png');
    expect(sniffImage(await base.clone().webp().toBuffer())).toBe('webp');
    expect(sniffImage(await base.clone().gif().toBuffer())).toBeNull();
    expect(sniffImage(await base.clone().tiff().toBuffer())).toBeNull();
    expect(sniffImage(SVG)).toBeNull();
    expect(sniffImage(Buffer.from('%PDF-1.7'))).toBeNull();
    // HEIC is an ISO-BMFF "ftyp" box. The app sends JPEG; sharp's libvips cannot decode HEVC anyway.
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.alloc(4), Buffer.from('mif1heic')]);
    expect(sniffImage(heic)).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });

  it('refuses an SVG at once, whatever it calls itself', async () => {
    await expect(checkImage(sharp, SVG)).rejects.toMatchObject({ status: 415, code: 'unsupported_image' });
  });

  it('refuses a pixel bomb from its header, before decoding a pixel', async () => {
    const t = Date.now();
    await expect(checkImage(sharp, await pngClaiming(16000, 16000))).rejects.toMatchObject({ status: 413, code: 'image_too_large' });
    expect(Date.now() - t).toBeLessThan(500);
    await expect(checkImage(sharp, await pngClaiming(6000, 6000))).resolves.toMatchObject({ format: 'png', width: 6000 });
    expect(6000 * 6000).toBeLessThan(MAX_INPUT_PIXELS);
  });

  it('keeps out a JPEG whose bytes and header disagree', async () => {
    const broken = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('not really a jpeg')]);
    await expect(checkImage(sharp, broken)).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('the OCR preparation refuses both bombs itself, fast', async () => {
    const t = Date.now();
    await expect(prepareReceipt(sharp, SVG)).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(prepareReceipt(sharp, await pngClaiming(16000, 16000))).rejects.toThrow(/pixel limit/i);
    expect(Date.now() - t).toBeLessThan(1000);
  });
});

describe('at most two photos at once', () => {
  it('runs two, queues the next ones in order, and refuses past the queue', async () => {
    const limiter = new JobLimiter(2, 2);
    const gates: Array<() => void> = [];
    let running = 0;
    let peak = 0;
    const order: number[] = [];
    const job = (n: number) => limiter.run(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise<void>((r) => gates.push(r));
      running--;
      order.push(n);
      return n;
    });
    const jobs = [job(1), job(2), job(3), job(4)];
    await expect(job(5)).rejects.toMatchObject({ status: 503, code: 'busy', extra: { retryAfterSeconds: 5 } });
    expect([limiter.active, limiter.queued]).toEqual([2, 2]);
    while (order.length < 4) {
      await new Promise((r) => setTimeout(r, 5));
      gates.shift()?.();
    }
    expect(await Promise.all(jobs)).toEqual([1, 2, 3, 4]);
    expect(order).toEqual([1, 2, 3, 4]);
    expect(peak).toBe(2);
    expect([limiter.active, limiter.queued]).toEqual([0, 0]);
  });

  it('frees the slot when a job fails', async () => {
    const limiter = new JobLimiter(1, 0);
    await expect(limiter.run(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    await expect(limiter.run(async () => 'ok')).resolves.toBe('ok');
  });
});

describe('the upload routes', () => {
  let ctx: TestCtx;
  afterEach(async () => { await ctx.db.close(); });

  async function signedIn(email: string) {
    const agent = request.agent(appFor(ctx));
    await agent.post('/api/auth/request-code').set(H).send({ email }).expect(200);
    await agent.post('/api/auth/verify').set(H).send({ email, code: lastCode(ctx, email) }).expect(200);
    return agent;
  }

  it('a receipt scan refuses an SVG sent as image/jpeg, and a pixel bomb', async () => {
    ctx = await testContext();
    let read = 0;
    ctx.receipts = { async read() { read++; return ''; } };
    const ana = await signedIn('ana.pop@s.unibuc.ro');
    const svg = await ana.post('/api/me/visits/scan').set(H).attach('receipt', SVG, { filename: 'receipt.jpg', contentType: 'image/jpeg' });
    expect(svg.status).toBe(415);
    expect(svg.body.error).toBe('unsupported_image');
    const bomb = await ana.post('/api/me/visits/scan').set(H).attach('receipt', await pngClaiming(16000, 16000), 'receipt.png');
    expect(bomb.status).toBe(413);
    expect(bomb.body.error).toBe('image_too_large');
    expect(read).toBe(0);
  });

  it('a scan past the queue is told to try again, while the one in progress finishes', async () => {
    ctx = await testContext();
    ctx.images = new JobLimiter(1, 0);
    const reading: Array<() => void> = [];
    ctx.receipts = { read: () => new Promise<string>((r) => { reading.push(() => r('')); }) };
    const ana = await signedIn('ana.pop@s.unibuc.ro');
    const jpeg = await tinyJpeg();
    const first = ana.post('/api/me/visits/scan').set(H).attach('receipt', jpeg, 'receipt.jpg').then((r) => r);
    while (!reading.length) await new Promise((r) => setTimeout(r, 5));
    const second = await ana.post('/api/me/visits/scan').set(H).attach('receipt', jpeg, 'receipt.jpg');
    expect(second.status).toBe(503);
    expect(second.body.error).toBe('busy');
    expect(second.headers['retry-after']).toBe('5');
    reading[0]();
    expect((await first).body.error).toBe('unreadable');
  });

  it('a dish photo is checked the same way', async () => {
    ctx = await testContext();
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('cantina@unibuc.ro', 'canteen_staff')");
    const id = (await ctx.db.query<{ id: string }>(
      "INSERT INTO dishes (name_ro, name_en, category, default_price_bani) VALUES ('Papanași', 'Papanași', 'dessert', 1200) RETURNING id",
    )).rows[0].id;
    const staff = await signedIn('cantina@unibuc.ro');
    const svg = await staff.put(`/api/staff/dishes/${id}/photo`).set(H).attach('photo', SVG, { filename: 'p.jpg', contentType: 'image/jpeg' });
    expect(svg.status).toBe(415);
    await staff.put(`/api/staff/dishes/${id}/photo`).set(H).attach('photo', await tinyJpeg(), 'p.jpg').expect(200);
    const stored = await ctx.db.query<{ mime: string }>('SELECT mime FROM dish_photos WHERE dish_id = $1', [id]);
    expect(stored.rows[0].mime).toBe('image/webp');
  });
});
