const MONTHS: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

function monthYearToIso(value: string) {
  const [mon, year] = value.trim().split(/\s+/);
  const mm = mon ? MONTHS[mon] : undefined;
  if (!mm || !year) return value.trim();
  return `${year}-${mm}`;
}

export function dateRangeToIso(dates: string): { start: string; end?: string } {
  const [rawStart = '', rawEnd = ''] = dates.split('–').map((p) => p.trim());
  const start = monthYearToIso(rawStart);
  if (!rawEnd || /present/i.test(rawEnd)) return { start };
  return { start, end: monthYearToIso(rawEnd) };
}
