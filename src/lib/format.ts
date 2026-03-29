import type { IskiSnapshot } from '../types.js';

function formatPercent(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

function formatDateTR(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

export function buildPostText(snapshot: IskiSnapshot, previous?: IskiSnapshot): string {
  void previous;
  const lines: string[] = [];

  lines.push(`💧 İstanbul Baraj Doluluk Oranı: %${formatPercent(snapshot.generalOccupancyPercent)}`);

  if (typeof snapshot.lastYearSameDayPercent === 'number') {
    const delta = snapshot.generalOccupancyPercent - snapshot.lastYearSameDayPercent;
    const absDelta = Math.abs(delta);

    if (delta > 0) {
      lines.push(`📈 Geçen yıl aynı güne göre %${formatPercent(absDelta)} yükseliş.`);
    } else if (delta < 0) {
      lines.push(`📉 Geçen yıl aynı güne göre %${formatPercent(absDelta)} düşüş.`);
    } else {
      lines.push('➖ Geçen yıl aynı güne göre değişim yok.');
    }
  }

  if (snapshot.reservoirs.length > 0) {
    const reservoirLine = snapshot.reservoirs
      .map((reservoir) => `${reservoir.name} %${formatPercent(reservoir.occupancyPercent)}`)
      .join(' | ');
    lines.push(`🏞️ ${reservoirLine}`);
  }

  lines.push(`🗓️ ${formatDateTR(snapshot.fetchedAtIso)} | Kaynak: İSKİ`);

  return lines.join('\n');
}
