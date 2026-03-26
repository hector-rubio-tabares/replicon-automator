import type { AccountMappings } from '../../common/types.js';
import { normalizeAccountCode, isSpecialAccountCode } from '../../common/utils.js';
import { SPECIAL_ACCOUNTS } from '../../common/constants.js';

/**
 * Servicio centralizado para mapeo de cuentas y proyectos.
 * Elimina código duplicado en múltiples archivos.
 * 
 * @instanciable - Factory pattern. Cada instancia se crea con mappings específicos.
 * Se recrea cuando los mappings cambian vía updateMappings().
 * 
 * @example
 * const mapper = new AccountMapperService(mappings);
 * const accountName = mapper.mapAccount('ACME');
 */
export class AccountMapperService {
    private mappings: AccountMappings;

    constructor(mappings: AccountMappings) {
        this.mappings = mappings;
    }

    /**
     * Actualiza los mappings
     */
    updateMappings(mappings: AccountMappings): void {
        this.mappings = mappings;
    }

    /**
     * Obtiene el nombre mapeado de una cuenta
     */
    mapAccount(cuenta: string): string {
        const normalized = normalizeAccountCode(cuenta);
        return this.mappings[normalized] || cuenta;
    }

    /**
     * Verifica si una cuenta es especial (vacaciones, feriados, fin de semana)
     */
    isSpecialAccount(cuenta: string): boolean {
        return isSpecialAccountCode(cuenta);
    }

    /**
     * Verifica si es una cuenta de vacaciones
     */
    isVacation(cuenta: string): boolean {
        const normalized = normalizeAccountCode(cuenta);
        return SPECIAL_ACCOUNTS.VACATION.includes(normalized);
    }

    /**
     * Verifica si es una cuenta de día no laboral
     */
    isNoWork(cuenta: string): boolean {
        const normalized = normalizeAccountCode(cuenta);
        return SPECIAL_ACCOUNTS.NO_WORK.includes(normalized);
    }

    /**
     * Verifica si es una cuenta de fin de semana
     */
    isWeekend(cuenta: string): boolean {
        const normalized = normalizeAccountCode(cuenta);
        return SPECIAL_ACCOUNTS.WEEKEND.includes(normalized);
    }

    /**
     * Verifica si una cuenta existe en los mappings
     */
    hasAccount(cuenta: string): boolean {
        const normalized = normalizeAccountCode(cuenta);
        return normalized in this.mappings;
    }

    /**
     * Obtiene todas las cuentas disponibles
     */
    getAllAccounts(): string[] {
        return Object.keys(this.mappings);
    }

    /**
     * Valida que todos los datos del CSV tengan mapping
     */
    validateCSVData(csvData: { cuenta: string }[]): {
        valid: boolean;
        unmappedAccounts: Set<string>;
    } {
        const unmappedAccounts = new Set<string>();

        csvData.forEach(row => {
            const cuenta = normalizeAccountCode(row.cuenta || '');

            if (!cuenta) {
                return;
            }

            // Ignorar cuentas especiales
            if (this.isSpecialAccount(cuenta)) {
                return;
            }

            // Verificar cuenta
            if (!this.hasAccount(cuenta)) {
                unmappedAccounts.add(cuenta);
            }
        });

        return {
            valid: unmappedAccounts.size === 0,
            unmappedAccounts,
        };
    }
}

/**
 * Factory para crear instancia del servicio
 */
export function createAccountMapper(mappings: AccountMappings): AccountMapperService {
    return new AccountMapperService(mappings);
}
