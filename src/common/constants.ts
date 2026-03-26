export const DEFAULT_HORARIOS = [
  { id: '1', start_time: '7:00am', end_time: '1:00pm' },
  { id: '2', start_time: '2:00pm', end_time: '4:00pm' },
];

/**
 * Timeouts para operaciones de Playwright (en milisegundos)
 * Centralizados para mantenibilidad y consistencia
 */
export const PLAYWRIGHT_TIMEOUTS = {
  /** Timeout para MFA verification */
  MFA_CHECK: 5000,
  /** Timeout para esperar página nueva */
  NEW_PAGE: 30000,
  /** Timeout para elementos de UI normales */
  ELEMENT: 30000,
  /** Timeout largo para login/auth */
  AUTH: 60000,
  /** Delay entre acciones de Playwright */
  SLOW_MO: 50,
  /** Delay para polling cuando está pausado */
  PAUSE_POLL: 500,
} as const;

export const SPECIAL_ACCOUNTS = {
  VACATION: ['V'],
  NO_WORK: ['ND'],
  WEEKEND: ['FDS'],
  WORK: ['W'],
  MEDICAL: ['M'],
};

export const DEFAULT_CONFIG = {
  loginUrl: process.env.REPLICON_LOGIN_URL || '',
  timeout: Number(process.env.REPLICON_TIMEOUT) || 45000,
  headless: process.env.REPLICON_HEADLESS === 'true',
  autoSave: process.env.REPLICON_AUTOSAVE !== 'false',
};
export const DEFAULT_MAPPINGS: Record<string, string> = {
  "V": "Vacaciones",
  "W": "Work",
  "M": "Médico",
  "ND": "No Data",
  "FDS": "Fin de Semana"
};
export const CSV_TEMPLATES = [
  {
    id: 'standard-week',
    name: 'Semana Estándar',
    description: 'Semana de trabajo normal (Lun-Vie)',
    rows: [
      { cuenta: 'W', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'FDS', extras: '' },
      { cuenta: 'FDS', extras: '' },
    ]
  },
  {
    id: 'vacation-week',
    name: 'Semana Vacaciones',
    description: 'Semana completa de vacaciones',
    rows: [
      { cuenta: 'V', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'FDS', extras: '' },
      { cuenta: 'FDS', extras: '' },
    ]
  },
  {
    id: 'mixed-week',
    name: 'Semana Mixta',
    description: 'Semana con días de trabajo y vacaciones',
    rows: [
      { cuenta: 'W', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'V', extras: '' },
      { cuenta: 'W', extras: '' },
      { cuenta: 'FDS', extras: '' },
      { cuenta: 'FDS', extras: '' },
    ]
  }
];
