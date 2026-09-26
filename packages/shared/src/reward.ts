/* Reward codes (docs/09): single-use, short-lived, and shown at the till — the worst Wi-Fi spot
   in the building. So the phone computes the code itself, offline, from a per-reward secret it
   saved while online; the server computes the same thing to check it.

   A code reads "K7P2 4839": four letters naming the reward, four digits that change every minute.
   A screenshot forwarded to a group chat is dead within minutes, and a reward redeems once. */

export const REWARD_ID_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY3479'; // no 0/O, 1/I, 2/Z, 5/S, 6/G, 8/B
export const REWARD_ID_LENGTH = 4;
export const REWARD_STEP_SECONDS = 60;
export const REWARD_DIGITS = 4;
/** How many steps either side of now a code stays valid: ±3 minutes. */
export const REWARD_WINDOW = 3;

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** The four-digit part for one time step. WebCrypto exists in every browser and in Node 20+. */
export async function rewardDigits(secretHex: string, step: number): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', hexToBytes(secretHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(step / 2 ** 32));
  view.setUint32(4, step >>> 0);
  const mac = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, msg));
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** REWARD_DIGITS).padStart(REWARD_DIGITS, '0');
}

export function rewardStep(timeMs: number): number {
  return Math.floor(timeMs / 1000 / REWARD_STEP_SECONDS);
}

export async function rewardCodeAt(rewardId: string, secretHex: string, timeMs: number): Promise<string> {
  return `${rewardId} ${await rewardDigits(secretHex, rewardStep(timeMs))}`;
}

/** Accepts what staff type or scan: "k7p2 4839", "K7P2-4839", "UBITE:R:K7P24839". */
export function parseRewardInput(input: string): { rewardId: string; digits: string } | null {
  const clean = input.toUpperCase().replace(/^UBITE:R:/, '').replace(/[\s-]/g, '');
  const re = new RegExp(`^([${REWARD_ID_ALPHABET}]{${REWARD_ID_LENGTH}})(\\d{${REWARD_DIGITS}})$`);
  const m = clean.match(re);
  return m ? { rewardId: m[1], digits: m[2] } : null;
}

/** The loyalty card's QR payloads. Both are generated on the phone from saved account data. */
export const qrPayload = {
  reward: (code: string) => `UBITE:R:${code.replace(/\s/g, '')}`,
  card: (userId: string) => `UBITE:C:${userId}`,
};

export function parseCardInput(input: string): string | null {
  const m = input.trim().match(/^UBITE:C:([0-9a-f-]{36})$/i);
  return m ? m[1].toLowerCase() : null;
}
