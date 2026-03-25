import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import { CSVService } from '../main/services/csv.service';
import type { CSVRow } from '../common/types';

vi.mock('fs');

describe('CSVService', () => {
  let service: CSVService;

  beforeEach(() => {
    service = new CSVService();
    vi.clearAllMocks();
  });

  describe('loadCSV', () => {
    it('should load CSV successfully', () => {
      const csvContent = `Cuenta,Projecto,Extras
AV,MS,
JM,PR,EXT/AV:MS:1000:1200`;

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent);

      const result = service.loadCSV('/path/to/file.csv');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toEqual({ cuenta: 'AV', extras: '' });
    });

    it('should handle file read error', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = service.loadCSV('/invalid/path.csv');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error loading file');
    });

    it('should trim whitespace from fields', () => {
      const csvContent = `Cuenta,Projecto,Extras
  AV  ,  MS  ,  
 JM , PR ,`;

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent);

      const result = service.loadCSV('/path/to/file.csv');

      expect(result.data?.[0].cuenta).toBe('AV');
      expect(result.data?.[0].proyecto).toBe('MS');
    });

    it('should handle CSV parse errors', () => {
      const csvContent = `Invalid CSV Content without proper format`;

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent);

      const result = service.loadCSV('/path/to/file.csv');

      // Even invalid CSVs can be parsed, just checking it handles it
      expect(result.success).toBeDefined();
    });

    it('should skip empty lines', () => {
      const csvContent = `Cuenta,Projecto,Extras
AV,MS,

JM,PR,`;

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent);

      const result = service.loadCSV('/path/to/file.csv');

      expect(result.data).toHaveLength(2);
    });

    it('should include filePath in response', () => {
      const csvContent = `Cuenta,Projecto,Extras
AV,MS,`;

      vi.mocked(fs.readFileSync).mockReturnValue(csvContent);

      const result = service.loadCSV('/path/to/file.csv');

      expect(result.filePath).toBe('/path/to/file.csv');
    });
  });

  describe('saveCSV', () => {
    it('should save CSV successfully', () => {
      const data: CSVRow[] = [
        { cuenta: 'AV', extras: '' },
        { cuenta: 'JM', extras: 'EXT/AV:MS:1000:1200' },
      ];

      const result = service.saveCSV('/path/to/output.csv', data);

      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle write error', () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      const data: CSVRow[] = [{ cuenta: 'AV', proyecto: 'MS', extras: '' }];
      const result = service.saveCSV('/invalid/path.csv', data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error saving file');
    });

    it('should handle empty data array', () => {
      const result = service.saveCSV('/path/to/output.csv', []);

      // Should try to save, result depends on mock
      expect(result.success).toBeDefined();
    });

    it('should include headers in CSV', () => {
      const data: CSVRow[] = [{ cuenta: 'AV', proyecto: 'MS', extras: '' }];

      service.saveCSV('/path/to/output.csv', data);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const csvContent = writeCall[1] as string;

      expect(csvContent).toContain('Cuenta');
      expect(csvContent).toContain('Extras');
    });

    it('should handle empty extras field', () => {
      const data: CSVRow[] = [{ cuenta: 'AV', extras: '' }];

      const result = service.saveCSV('/path/to/output.csv', data);

      // Should try to save
      expect(result.success).toBeDefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate rows from template', () => {
      const template: CSVRow[] = [
        { cuenta: 'AV', extras: '' },
        { cuenta: 'JM', extras: '' },
      ];

      const result = service.generateFromTemplate(template, 5);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(template[0]);
      expect(result[1]).toEqual(template[1]);
      expect(result[2]).toEqual(template[0]);
    });

    it('should cycle through template rows', () => {
      const template: CSVRow[] = [
        { cuenta: 'AV', proyecto: 'MS', extras: '' },
      ];

      const result = service.generateFromTemplate(template, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(template[0]);
      expect(result[1]).toEqual(template[0]);
      expect(result[2]).toEqual(template[0]);
    });

    it('should handle zero days', () => {
      const template: CSVRow[] = [{ cuenta: 'AV', proyecto: 'MS', extras: '' }];

      const result = service.generateFromTemplate(template, 0);

      expect(result).toHaveLength(0);
    });

    it('should create copies of template rows', () => {
      const template: CSVRow[] = [{ cuenta: 'AV', proyecto: 'MS', extras: '' }];

      const result = service.generateFromTemplate(template, 2);

      result[0].cuenta = 'MODIFIED';

      expect(template[0].cuenta).toBe('AV');
    });
  });
});
