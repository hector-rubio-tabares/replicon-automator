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
  VACATION: ['H', 'F'],
  NO_WORK: ['BH'],
  WEEKEND: ['FDS', 'ND'],
};

export const DEFAULT_CONFIG = {
  loginUrl: process.env.REPLICON_LOGIN_URL || '',
  timeout: Number(process.env.REPLICON_TIMEOUT) || 45000,
  headless: process.env.REPLICON_HEADLESS === 'true',
  autoSave: process.env.REPLICON_AUTOSAVE !== 'false',
};
export const DEFAULT_MAPPINGS = {
  "BH": {
    "name": "No work",
    "projects": {}
  },
  "H": {
    "name": "Vacation",
    "projects": {}
  },
  "F": {
    "name": "Vacation",
    "projects": {}
  },
  "AV": {
    "name": "Avianca",
    "projects": {
      "MS": "Avianca-Services-AM",
      "PR": "Avianca-Services-Projects"
    }
  },
  "JM": {
    "name": "Jambojet",
    "projects": {
      "MS": "Jambojet-Services-AM",
      "PR": "Jambojet-Services-Projects"
    }
  },
  "PROD": {
    "name": "Newshore (Product)",
    "projects": {
      "MS": "",
      "PR": "",
      "IN": "Engineering",
      "PI": "Platform-Integrations"
    }
  },
  "PU": {
    "name": "Plus Ultra",
    "projects": {
      "MS": "PlusUltra- Services- AM",
      "PR": "PlusUltra-Services-Projects",
      "IBE": "PlusUltra-IBE-Setup"
    }
  },
  "DT": {
    "name": "TAAGAngola",
    "projects": {
      "MS": "TAAGAngola-Services-AM",
      "PR": "TAAGAngola-Services-Projects"
    }
  },
  "NEW": {
    "name": "Newshore (Interno)",
    "projects": {}
  }
};
export const CSV_TEMPLATES = [
  {
    id: 'standard-week',
    name: 'Semana Estándar',
    description: 'Semana de trabajo normal (Lun-Vie)',
    rows: [
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
    ]
  },
  {
    id: 'vacation-week',
    name: 'Semana Vacaciones',
    description: 'Semana completa de vacaciones',
    rows: [
      { cuenta: 'H', proyecto: '', extras: '' },
      { cuenta: 'H', proyecto: '', extras: '' },
      { cuenta: 'H', proyecto: '', extras: '' },
      { cuenta: 'H', proyecto: '', extras: '' },
      { cuenta: 'H', proyecto: '', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
    ]
  },
  {
    id: 'mixed-projects',
    name: 'Proyectos Mixtos',
    description: 'Semana con diferentes proyectos y horas extra',
    rows: [
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'AV', proyecto: 'MS', extras: 'EXT/PROD:PI:1600:1800' },
      { cuenta: 'PROD', proyecto: 'IN', extras: 'EXT/PROD:PI:0900:1100;AV:MS:1400:1500' },
      { cuenta: 'JM', proyecto: 'PR', extras: '' },
      { cuenta: 'PROD', proyecto: 'PI', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
      { cuenta: 'ND', proyecto: 'ND', extras: '' },
    ]
  }
];
