import type { IskiSnapshot, ReservoirItem } from '../types.js';

const SOURCE_URL = 'https://iski.istanbul/baraj-doluluk/';
const API_BASE_URL = 'https://iskiapi.iski.istanbul/api/iski/baraj';
const GENERAL_ENDPOINT = `${API_BASE_URL}/genelOran/v2`;
const RESERVOIRS_ENDPOINT = `${API_BASE_URL}/mevcutSuMiktarlarininBarajlaraGoreDagilimi/v2`;
const MONTHLY_ENDPOINT = `${API_BASE_URL}/sonBirYildakiAySonlariDoluluk/v2`;

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

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
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

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      authorization: `Bearer ${token}`,
      origin: 'https://iski.istanbul',
      referer: 'https://iski.istanbul/',
      'user-agent': 'Mozilla/5.0 (compatible; IstanbulBarajBot/0.1)'
    }
  });

  if (!response.ok) {
    throw new Error(`İSKİ API yanıtı başarısız. URL: ${url}, HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchIskiSnapshot(): Promise<IskiSnapshot> {
  const token = getRequiredEnv('ISKI_API_TOKEN');
  const generalRes = await fetchJson<GeneralApiResponse>(GENERAL_ENDPOINT, token);
  const reservoirsRes = await fetchJson<ReservoirApiResponse>(RESERVOIRS_ENDPOINT, token);
  const monthlyRes = await fetchJson<MonthlyApiResponse>(MONTHLY_ENDPOINT, token);

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
        hasLastYearSameMonth: typeof lastYearSameMonthPercent === 'number'
      },
      null,
      0
    )
  };
}
