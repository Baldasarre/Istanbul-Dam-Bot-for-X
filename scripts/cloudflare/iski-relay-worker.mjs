const ALLOWED_PATHS = new Set([
  '/genelOran/v2',
  '/mevcutSuMiktarlarininBarajlaraGoreDagilimi/v2',
  '/sonBirYildakiAySonlariDoluluk/v2'
]);

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return jsonResponse(405, { error: 'Method Not Allowed' });
    }

    const relayKey = request.headers.get('x-relay-key');
    if (!env.RELAY_KEY || relayKey !== env.RELAY_KEY) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    if (!env.ISKI_API_TOKEN) {
      return jsonResponse(500, { error: 'Server misconfigured: ISKI_API_TOKEN missing' });
    }

    const baseUrl = (env.ISKI_API_BASE_URL || 'https://iskiapi.iski.istanbul/api/iski/baraj').replace(/\/+$/, '');
    const url = new URL(request.url);

    if (!ALLOWED_PATHS.has(url.pathname)) {
      return jsonResponse(404, { error: 'Not Found' });
    }

    const upstreamUrl = `${baseUrl}${url.pathname}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${env.ISKI_API_TOKEN}`,
        origin: 'https://iski.istanbul',
        referer: 'https://iski.istanbul/',
        'user-agent': 'Mozilla/5.0 (compatible; IstanbulBarajBotRelay/0.1)'
      }
    });

    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }
};
