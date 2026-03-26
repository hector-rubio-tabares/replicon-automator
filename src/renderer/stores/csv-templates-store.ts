import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CSVRow } from '@shared/types';
export interface CSVTemplate {
  id: string;
  name: string;
  description?: string;
  data: CSVRow[];
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}
interface CSVTemplatesState {
  templates: CSVTemplate[];
  addTemplate: (name: string, data: CSVRow[], description?: string) => CSVTemplate;
  updateTemplate: (id: string, updates: Partial<Omit<CSVTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => CSVTemplate | undefined;
  duplicateTemplate: (id: string, newName: string) => CSVTemplate | undefined;
  importTemplates: (templates: CSVTemplate[]) => void;
  exportTemplates: () => CSVTemplate[];
}
const DEFAULT_TEMPLATES: CSVTemplate[] = [
  {
    id: 'default-weekly',
    name: 'Semana Estándar',
    description: 'Plantilla para una semana laboral típica (5 días)',
    data: [
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  },
  {
    id: 'default-multi-project',
    name: 'Multi-Proyecto',
    description: 'Plantilla con extras para múltiples proyectos',
    data: [
      { cuenta: 'CUENTA', extras: '09:00-13:00' },
      { cuenta: 'CUENTA', extras: '09:00-13:00' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  },
  {
    id: 'default-with-weekend',
    name: 'Semana con Fin de Semana',
    description: 'Plantilla de 7 días incluyendo FDS',
    data: [
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'CUENTA', extras: '' },
      { cuenta: 'FDS', extras: '' },
      { cuenta: 'FDS', extras: '' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  },
  {
    id: 'default-empty',
    name: 'Vacía',
    description: 'Plantilla vacía para empezar desde cero',
    data: [
      { cuenta: '', extras: '' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  },
];
export const useCSVTemplatesStore = create<CSVTemplatesState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      addTemplate: (name, data, description) => {
        const newTemplate: CSVTemplate = {
          id: crypto.randomUUID(),
          name,
          description,
          data: JSON.parse(JSON.stringify(data)), 
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
        return newTemplate;
      },
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: Date.now() }
              : t
          ),
        }));
      },
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id || t.isDefault),
        }));
      },
      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },
      duplicateTemplate: (id, newName) => {
        const template = get().getTemplate(id);
        if (!template) return undefined;
        return get().addTemplate(newName, template.data, template.description);
      },
      importTemplates: (templates) => {
        const existingIds = new Set(get().templates.map((t) => t.id));
        const newTemplates = templates
          .filter((t) => !existingIds.has(t.id) && !t.isDefault)
          .map((t) => ({
            ...t,
            id: crypto.randomUUID(), 
            isDefault: false,
          }));
        set((state) => ({
          templates: [...state.templates, ...newTemplates],
        }));
      },
      exportTemplates: () => {
        return get().templates.filter((t) => !t.isDefault);
      },
    }),
    {
      name: 'csv-templates',
      version: 1,
    }
  )
);
