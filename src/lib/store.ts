import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { StoredState } from '../types.js';

const STATE_PATH = '.data/state.json';

export async function readState(): Promise<StoredState> {
  try {
    const content = await readFile(STATE_PATH, 'utf8');
    return JSON.parse(content) as StoredState;
  } catch {
    return {};
  }
}

export async function writeState(state: StoredState): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}
