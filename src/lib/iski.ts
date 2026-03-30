import type { IskiSnapshot, ReservoirItem } from '../types.js';

const SOURCE_URL = 'https://iski.istanbul/baraj-doluluk/';
const DEFAULT_API_BASE_URL = 'https://iskiapi.iski.istanbul/api/iski/baraj';
const GENERAL_PATH = 'genelOran/v2';
const RESERVOIRS_PATH = 'mevcutSuMiktarlarininBarajlaraGoreDagilimi/v2';
const MONTHLY_PATH = 'sonBirYildakiAySonlariDoluluk/v2';
const FETCH_TIMEOUT_MS = 20_000;
const MAX_FETCH_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1_500;

interface GeneralApiResponse {
  data: {
    oran: number;
  } | null;
  sonGuncellemeZamani?: string;
}

interface ReservoirApiItem {
  kaynakAdi: string;
  oran: number;
  tarih?: string;
}

interface ReservoirApiResponse {
  data: ReservoirApiItem[] | null;
}

interface MonthlyApiItem {
  oran: number;
  tarih: string;
}

interface MonthlyApiResponse {
  data: MonthlyApiItem[] | null;
}

function normalizeBaseUrl(input: string): string {
  return input.replace(/\/+$/, '');
}

function buildEndpoint(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`;
}

function getApiToken(): string {
  const token = process.env.ISKI_API_TOKEN?.trim();
  if (!token) {
    throw new Error('Eksik ortam değişkeni: ISKI_API_TOKEN');
  }
  return token;
}

function isPercent(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function parseSonGuncellemeToIso(input?: string): string {
  if (!input) return new Date().toISOString();

  const match = input.match(
    /^(?<day>\d{2})\/(?<month>\d{2})\/(?<year>\d{4})\s+(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})$/
  );
  if (!match?.groups) return new Date().toISOString();

  const { day, month, year, hour, minute, second } = match.groups;
  const localIso = `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`;
  const parsed = new Date(localIso);

  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function parseTrDate(input: string): { day: number; month: number; year: number } | null {
  const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  return { day, month, year };
}

function findLastYearSameMonthPercent(items: MonthlyApiItem[] | null | undefined, fetchedAtIso: string): number | undefined {
  const valid = (items ?? []).filter((item) => isPercent(item?.oran) && typeof item?.tarih === 'string');
  if (valid.length === 0) return undefined;

  const fetched = new Date(fetchedAtIso);
  if (Number.isNaN(fetched.getTime())) return undefined;

  const targetMonth = fetched.getUTCMonth() + 1;
  const targetYear = fetched.getUTCFullYear() - 1;

  const sameMonthLastYear = valid
    .map((item) => ({
      date: parseTrDate(item.tarih),
      percent: item.oran
    }))
    .filter((item): item is { date: { day: number; month: number; year: number }; percent: number } => item.date !== null)
    .find((item) => item.date.year === targetYear && item.date.month === targetMonth);

  return sameMonthLastYear?.percent;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error && cause.message) {
      return `${error.message} | cause: ${cause.message}`;
    }

    if (typeof cause === 'object' && cause !== null) {
      const code = (cause as { code?: unknown }).code;
      if (typeof code === 'string') {
        return `${error.message} | cause.code: ${code}`;
      }
    }

    return error.message;
  }

  return String(error);
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;

  const message = error.message.toLowerCase();
  if (message.includes('fetch failed') || message.includes('timed out')) return true;

  const cause = (error as Error & { cause?: unknown }).cause;
  if (typeof cause === 'object' && cause !== null) {
    const code = (cause as { code?: unknown }).code;
    return typeof code === 'string' && ['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH', 'EAI_AGAIN'].includes(code);
  }

  return false;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0 (compatible; IstanbulBarajBot/0.1)',
    authorization: `Bearer ${token}`,
    origin: 'https://iski.istanbul',
    referer: 'https://iski.istanbul/'
  };

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(`İSKİ API yanıtı başarısız. URL: ${url}, HTTP ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      const canRetry = isRetryableNetworkError(error) && attempt < MAX_FETCH_ATTEMPTS;
      if (canRetry) {
        await sleep(BASE_RETRY_DELAY_MS * attempt);
        continue;
      }

      throw new Error(
        `İSKİ API isteği başarısız. URL: ${url}, deneme: ${attempt}/${MAX_FETCH_ATTEMPTS}, hata: ${describeError(error)}`
      );
    }
  }

  throw new Error(`İSKİ API isteği başarısız. URL: ${url}`);
}

export async function fetchIskiSnapshot(): Promise<IskiSnapshot> {
  const apiBaseUrl = DEFAULT_API_BASE_URL;
  const token = getApiToken();

  const generalRes = await fetchJson<GeneralApiResponse>(buildEndpoint(apiBaseUrl, GENERAL_PATH), token);
  const reservoirsRes = await fetchJson<ReservoirApiResponse>(buildEndpoint(apiBaseUrl, RESERVOIRS_PATH), token);
  const monthlyRes = await fetchJson<MonthlyApiResponse>(buildEndpoint(apiBaseUrl, MONTHLY_PATH), token);

  const generalOccupancyPercent = generalRes.data?.oran;
  if (!isPercent(generalOccupancyPercent)) {
    throw new Error('Genel doluluk oranı API yanıtından güvenle parse edilemedi.');
  }

  const reservoirs: ReservoirItem[] = (reservoirsRes.data ?? [])
    .filter((item) => typeof item?.kaynakAdi === 'string' && isPercent(item?.oran))
    .map((item) => ({
      name: item.kaynakAdi.trim(),
      occupancyPercent: item.oran
    }));

  const fetchedAtIso = parseSonGuncellemeToIso(generalRes.sonGuncellemeZamani);
  const lastYearSameMonthPercent = findLastYearSameMonthPercent(monthlyRes.data, fetchedAtIso);

  return {
    fetchedAtIso,
    sourceUrl: SOURCE_URL,
    generalOccupancyPercent,
    lastYearSameMonthPercent,
    reservoirs,
    rawTextSample: JSON.stringify(
      {
        sonGuncellemeZamani: generalRes.sonGuncellemeZamani,
        reservoirCount: reservoirs.length,
        hasLastYearSameMonth: typeof lastYearSameMonthPercent === 'number',
        apiBaseUrl
      },
      null,
      0
    )
  };
}
