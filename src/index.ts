import 'dotenv/config';
import { buildPostText } from './lib/format.js';
import { sha256 } from './lib/hash.js';
import { fetchIskiSnapshot } from './lib/iski.js';
import { readState, writeState } from './lib/store.js';
import { publishPost } from './lib/x.js';

const SENSITIVE_ENV_KEYS = [
  'ISKI_API_TOKEN',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
  'X_BEARER_TOKEN'
] as const;

function redactSensitive(value: string): string {
  let output = value;

  for (const key of SENSITIVE_ENV_KEYS) {
    const secret = process.env[key];
    if (!secret) continue;
    output = output.split(secret).join(`[REDACTED:${key}]`);
  }

  return output;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run') || process.env.POST_ENABLED !== 'true';
  const state = await readState();

  const snapshot = await fetchIskiSnapshot();
  const postText = buildPostText(snapshot, state.lastSuccessfulPost?.snapshot);
  const textHash = sha256(postText);

  await writeState({
    ...state,
    latestFetchedSnapshot: snapshot
  });

  if (state.lastSuccessfulPost?.textHash === textHash) {
    console.log('Aynı içerik tespit edildi, paylaşım atlandı.');
    console.log(postText);
    return;
  }

  if (dryRun) {
    console.log('DRY RUN - paylaşım yapılmadı.');
    console.log('---');
    console.log(postText);
    return;
  }

  await publishPost(postText);

  await writeState({
    ...state,
    latestFetchedSnapshot: snapshot,
    lastSuccessfulPost: {
      textHash,
      snapshot,
      postedAtIso: new Date().toISOString()
    }
  });

  console.log('Paylaşım başarılı.');
}

main().catch((error) => {
  console.error('Bot çalışırken hata oluştu:');
  const message = error instanceof Error ? error.message : String(error);
  console.error(redactSensitive(message));
  process.exit(1);
});
