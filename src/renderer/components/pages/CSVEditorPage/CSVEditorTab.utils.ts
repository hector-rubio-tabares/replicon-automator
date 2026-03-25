import type { CSVRow } from '@shared/types';
import { pad2, isSpecialAccountCode } from '@shared/utils';
import type { ExtDraftEntry, DayInfo } from './CSVEditorTab.types';
import { DOW_ES } from './CSVEditorTab.constants';

// Re-export para compatibilidad con código existente
export { isSpecialAccountCode };

export function isValidMilitary(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const hh = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}
export function parseExtString(
  extras: string,
): { entries: ExtDraftEntry[]; error: string | null } {
  const trimmed = (extras ?? '').trim();
  if (!trimmed) return { entries: [], error: null };
  const parts = trimmed
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const entries: ExtDraftEntry[] = [];
  for (const part of parts) {
    const components = part.split('-').map((c) => c.trim());
    if (components.length !== 2) {
      return { entries: [], error: 'Formato inválido: inicio-fin (ej: 0900-1100)' };
    }
    const [inicio, fin] = components;
    if (!isValidMilitary(inicio)) return { entries: [], error: `Hora inicio inválida: ${inicio}` };
    if (!isValidMilitary(fin)) return { entries: [], error: `Hora fin inválida: ${fin}` };
    entries.push({ inicio, fin });
  }
  return { entries, error: null };
}
export function buildExtString(entries: ExtDraftEntry[]): string {
  const clean = entries
    .map((e) => ({
      inicio: e.inicio.trim(),
      fin: e.fin.trim(),
    }))
    .filter((e) => e.inicio || e.fin);
  if (clean.length === 0) return '';
  return clean.map((e) => `${e.inicio}-${e.fin}`).join(';');
}
export async function computeHolidaySet(year: number): Promise<Set<string>> {
  const holidaySet = new Set<string>();
  try {
    const { default: Holidays } = await import('date-holidays');
    const hd = new Holidays('CO');
    const holidays = hd.getHolidays(year) as Array<{ date: string | Date; type?: string }>;
    for (const h of holidays) {
      if (h.type && h.type !== 'public') continue;
      const iso = typeof h.date === 'string' ? h.date.slice(0, 10) : h.date.toISOString().slice(0, 10);
      holidaySet.add(iso);
    }
  } catch {
    // Holiday library failed, return empty set
  }
  return holidaySet;
}
export function escapeCsvCell(value: string): string {
  const raw = value ?? '';
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}
export function buildCsvText(rows: CSVRow[] | null): string {
  const header = 'Estado,Extras';
  const body = (rows ?? []).map((r) => {
    const cuenta = escapeCsvCell((r.cuenta ?? '').trim());
    const extras = escapeCsvCell((r.extras ?? '').trim());
    return `${cuenta},${extras}`;
  });
  return [header, ...body].join('\n');
}

/**
 * Calcula información de días para un mes específico
 * DRY: Un solo lugar para la lógica de fechas
 */
export async function computeDayInfo(
  year: number,
  monthIndex: number,
  daysInMonth: number
): Promise<DayInfo[]> {
  const monthNumber = monthIndex + 1;
  const holidaySet = await computeHolidaySet(year);
  const info: DayInfo[] = [];
  
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, monthIndex, d);
    const dayOfWeek = day.getDay();
    const dayKey = `${year}-${pad2(monthNumber)}-${pad2(d)}`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dayKey);
    
    info.push({
      date: dayKey,
      dayNumber: d,
      dowLabel: DOW_ES[dayOfWeek] ?? '',
      isWeekend,
      isHoliday,
    });
  }
  
  return info;
}
