import * as fs from 'fs';
import Papa from 'papaparse';
import type { CSVRow, LoadCSVResponse } from '../../common/types.js';

/**
 * Servicio para operaciones de CSV (carga y guardado).
 * 
 * @instanciable - Servicio stateless, se puede instanciar donde se necesite.
 * No mantiene estado entre llamadas, solo realiza operaciones de I/O.
 * 
 * @example
 * const csvService = new CSVService();
 * const result = csvService.loadCSV('/path/to/file.csv');
 */
export class CSVService {
  /**
   * Carga y parsea un archivo CSV con datos de proyectos
   * @param filePath - Ruta absoluta al archivo CSV
   * @returns Objeto con success, data (CSVRow[]), error y filePath
   * @example
   * const result = csvService.loadCSV('/path/to/file.csv');
   * if (result.success) {
   *   console.log(result.data); // [{ cuenta, proyecto, extras }]
   * }
   */
  loadCSV(filePath: string): LoadCSVResponse {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = Papa.parse<{ Cuenta: string; Projecto: string; Extras?: string }>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });
      if (result.errors.length > 0) {
        return {
          success: false,
          error: `Error parsing CSV: ${result.errors[0].message}`,
        };
      }
      const data: CSVRow[] = result.data.map(row => ({
        cuenta: (row.Cuenta || '').trim(),
        proyecto: (row.Projecto || '').trim(),
        extras: (row.Extras || '').trim(),
      }));
      return {
        success: true,
        data,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error loading file: ${error}`,
      };
    }
  }
  /**
   * Guarda datos en formato CSV
   * @param filePath - Ruta donde guardar el archivo
   * @param data - Array de filas CSV (cuenta, proyecto, extras)
   * @returns Objeto con success y error opcional
   * @example
   * csvService.saveCSV('/path/to/output.csv', csvRows);
   */
  saveCSV(filePath: string, data: CSVRow[]): { success: boolean; error?: string } {
    try {
      const csvData = data.map(row => ({
        Cuenta: row.cuenta,
        Extras: row.extras || '',
      }));
      const csv = Papa.unparse(csvData, {
        header: true,
      });
      fs.writeFileSync(filePath, csv, 'utf-8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Error saving file: ${error}`,
      };
    }
  }
  generateFromTemplate(templateRows: CSVRow[], daysCount: number): CSVRow[] {
    const result: CSVRow[] = [];
    for (let i = 0; i < daysCount; i++) {
      const templateIndex = i % templateRows.length;
      result.push({ ...templateRows[templateIndex] });
    }
    return result;
  }
}
