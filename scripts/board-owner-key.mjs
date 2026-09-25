import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../.env.local', import.meta.url);
let existing = '';
try { existing = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (/^BOARD_ADMIN_TOKEN=.+/m.test(existing)) {
  console.log('Owner key already configured in .env.local. Left it unchanged.');
} else {
  const line = `BOARD_ADMIN_TOKEN=${randomBytes(32).toString('hex')}`;
  const next = /^BOARD_ADMIN_TOKEN=.*$/m.test(existing) ? existing.replace(/^BOARD_ADMIN_TOKEN=.*$/m, line) : `${existing}${existing.endsWith('\n') || !existing ? '' : '\n'}${line}\n`;
  await writeFile(path, next, { mode: 0o600 });
  console.log('Created a local owner key in .env.local. Use its BOARD_ADMIN_TOKEN value in the board’s Owner access dialog.');
}
