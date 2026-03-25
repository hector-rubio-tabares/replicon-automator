import { SPECIAL_ACCOUNTS } from './constants.js';

export function militaryToStandard(militaryTime: string): string {
  try {
    const hour = parseInt(militaryTime.slice(0, 2));
    const minute = parseInt(militaryTime.slice(2));
    const minuteStr = pad2(minute);
    if (hour === 0) {
      return `12:${minuteStr}am`;
    } else if (hour < 12) {
      return `${hour}:${minuteStr}am`;
    } else if (hour === 12) {
      return `12:${minuteStr}pm`;
    } else {
      return `${hour - 12}:${minuteStr}pm`;
    }
  } catch {
    return militaryTime;
  }
}
export function standardToMilitary(standardTime: string): string {
  try {
    const match = standardTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return standardTime;
    let hour = parseInt(match[1]);
    const minute = match[2];
    const period = match[3].toLowerCase();
    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }
    return `${pad2(hour)}${minute}`;
  } catch {
    return standardTime;
  }
}
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * DRY: Padding de números a 2 dígitos con ceros a la izquierda
 * Usado en fechas, horas militares, días, etc.
 */
export function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

/**
 * DRY: Normalización estándar de códigos de cuenta
 * Todos los códigos se comparan en mayúsculas sin espacios
 */
export function normalizeAccountCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * DRY: Verifica si un código de cuenta es especial (vacaciones, feriados, fin de semana)
 * Centraliza lógica que estaba duplicada en 3+ archivos
 */
export function isSpecialAccountCode(code: string): boolean {
  const upper = normalizeAccountCode(code);
  return (
    SPECIAL_ACCOUNTS.VACATION.includes(upper) ||
    SPECIAL_ACCOUNTS.NO_WORK.includes(upper) ||
    SPECIAL_ACCOUNTS.WEEKEND.includes(upper)
  );
}
