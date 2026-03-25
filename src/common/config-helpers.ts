import type { TimeSlot } from './types';

// Funciones para gestión de horarios
export function addHorario(horarios: TimeSlot[], slot: TimeSlot): TimeSlot[] {
  return [...horarios, slot];
}

export function removeHorario(horarios: TimeSlot[], id: string): TimeSlot[] {
  return horarios.filter((h) => h.id !== id);
}

export function updateHorario(
  horarios: TimeSlot[],
  id: string,
  field: 'start_time' | 'end_time',
  value: string,
): TimeSlot[] {
  return horarios.map((h) => (h.id === id ? { ...h, [field]: value } : h));
}
