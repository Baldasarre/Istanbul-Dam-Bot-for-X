import { TwitterApi } from 'twitter-api-v2';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

export async function publishPost(text: string): Promise<void> {
  const client = new TwitterApi({
    appKey: getRequiredEnv('X_API_KEY'),
    appSecret: getRequiredEnv('X_API_SECRET'),
    accessToken: getRequiredEnv('X_ACCESS_TOKEN'),
    accessSecret: getRequiredEnv('X_ACCESS_TOKEN_SECRET')
  });

  await client.v2.tweet(text);
}
