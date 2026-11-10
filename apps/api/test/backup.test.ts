/* deploy/backup.sh, run against a stand-in for `docker compose exec db pg_dump`: a dump that fails,
   comes out truncated or shrinks suddenly never replaces a good one and never prunes the old
   ones, and the script says so with a non-zero exit. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.resolve(__dirname, '../../../deploy/backup.sh');
// On Windows `bash` on the PATH is usually WSL's; Git's bash runs the script as the VM would.
const BASH = process.platform === 'win32'
  ? ['C:/Program Files/Git/bin/bash.exe', 'C:/Program Files (x86)/Git/bin/bash.exe'].find((p) => fs.existsSync(p))
  : '/bin/bash';
const DAY = 86_400_000;

/* `docker compose … exec -T db pg_dump …` → a dump whose shape FAKE_DUMP picks. */
const FAKE_DOCKER = `#!/bin/sh
body() { head -c "\${FAKE_BYTES:-14000}" /dev/urandom | od -An -tx1; }
case "$FAKE_DUMP" in
  ok)        echo '-- PostgreSQL database dump'; body; printf -- '--\\n-- PostgreSQL database dump complete\\n--\\n\\n' ;;
  fail)      echo '-- PostgreSQL database dump'; body; echo 'pg_dump: error: connection lost' >&2; exit 1 ;;
  truncated) echo '-- PostgreSQL database dump'; body ;;
esac
`;

let dir: string | undefined;
afterEach(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); dir = undefined; });

function setup(oldDumps: number) {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ubite-backup-'));
  fs.mkdirSync(path.join(dir, 'deploy'));
  fs.copyFileSync(SCRIPT, path.join(dir, 'deploy/backup.sh'));
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin/docker'), FAKE_DOCKER, { mode: 0o755 });
  fs.mkdirSync(path.join(dir, 'backups'));
  // Old dumps, one a day from 20 days ago backwards, each the size a normal dump has.
  for (let i = 0; i < oldDumps; i++) {
    const f = path.join(dir, 'backups', `ubite-2026-01-${String(i + 1).padStart(2, '0')}.sql.gz`);
    fs.writeFileSync(f, Buffer.alloc(30000, 1));
    const t = new Date(Date.now() - (20 + i) * DAY);
    fs.utimesSync(f, t, t);
  }
  return dir;
}

function run(root: string, fake: string, env: Record<string, string> = {}) {
  const r = spawnSync(BASH!, [path.join(root, 'deploy/backup.sh')], {
    env: { ...process.env, PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}`, FAKE_DUMP: fake, ...env },
    encoding: 'utf8',
  });
  return { status: r.status, stderr: r.stderr, files: fs.readdirSync(path.join(root, 'backups')).sort() };
}

const today = (files: string[]) => files.filter((f) => !f.startsWith('ubite-2026-01-'));

describe.skipIf(!BASH)('deploy/backup.sh', () => {
  it('a good dump goes into place, and pruning keeps the 14 newest', async () => {
    const root = setup(16);
    const r = run(root, 'ok');
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(today(r.files)).toEqual([expect.stringMatching(/^ubite-\d{4}-\d{2}-\d{2}\.sql\.gz$/)]);
    // 17 dumps, all but the new one over 14 days old: the 14 newest stay.
    expect(r.files).toHaveLength(14);
    expect(r.files).not.toContain('ubite-2026-01-16.sql.gz');
    if (process.platform !== 'win32') {
      expect(fs.statSync(path.join(root, 'backups', today(r.files)[0])).mode & 0o777).toBe(0o600);
      expect(fs.statSync(path.join(root, 'backups')).mode & 0o777).toBe(0o700);
    }
  });

  it('a pg_dump that fails halfway leaves nothing behind and prunes nothing', () => {
    const root = setup(16);
    const r = run(root, 'fail');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/pg_dump failed; nothing was pruned/);
    expect(today(r.files)).toEqual([]);
    expect(r.files).toHaveLength(16);
  });

  it('a dump without pg_dump\'s closing line is refused', () => {
    const root = setup(16);
    const r = run(root, 'truncated');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/incomplete/);
    expect(r.files).toHaveLength(16);
  });

  it('a tiny dump, or one under half the last, is kept aside and prunes nothing', () => {
    const root = setup(16);
    const tiny = run(root, 'ok', { FAKE_BYTES: '10' });
    expect(tiny.status).not.toBe(0);
    expect(tiny.stderr).toMatch(/under BACKUP_MIN_BYTES/);
    expect(tiny.files).toHaveLength(16);

    const small = run(root, 'ok', { FAKE_BYTES: '3000' });
    expect(small.status).not.toBe(0);
    expect(small.stderr).toMatch(/under half of/);
    expect(today(small.files)).toEqual([expect.stringMatching(/\.small\.sql\.gz$/)]);
    expect(small.files).toHaveLength(17);
  });
});
