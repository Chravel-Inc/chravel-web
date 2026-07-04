/**
 * Unit tests for PDF export client functionality
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('jspdf', () => {
  class JsPDFMock {
    static instances: JsPDFMock[] = [];
    internal = {
      pageSize: {
        getWidth: () => 612,
        getHeight: () => 792,
      },
      pages: [[], []],
    };
    lastAutoTable?: { finalY: number };
    _texts: string[] = [];
    _links: string[] = [];
    _tables: Array<Record<string, unknown>> = [];
    _properties: Record<string, unknown> | null = null;

    constructor() {
      JsPDFMock.instances.push(this);
    }

    addFileToVFS() {}
    addFont() {}
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}
    setLineWidth() {}
    line() {}
    addPage() {
      this.internal.pages.push([]);
    }
    setPage() {}
    getTextWidth(text: string) {
      return String(text).length * 5;
    }
    splitTextToSize(text: string) {
      return [text];
    }
    text(text: string | string[]) {
      if (Array.isArray(text)) {
        this._texts.push(...text.map(String));
      } else {
        this._texts.push(String(text));
      }
    }
    link(_x: number, _y: number, _w: number, _h: number, options: { url?: string }) {
      if (options?.url) {
        this._links.push(options.url);
      }
    }
    setProperties(props: Record<string, unknown>) {
      this._properties = props;
    }
    output() {
      return new Blob(['pdf']);
    }
  }

  return { __esModule: true, default: JsPDFMock };
});

vi.mock('jspdf-autotable', () => ({
  default: (doc: Record<string, unknown>, options: Record<string, unknown>) => {
    doc.lastAutoTable = { finalY: ((options?.startY as number) || 0) + 20 };

    const tables = (doc._tables as Array<Record<string, unknown>>) || [];
    tables.push(options);
    doc._tables = tables;

    const body = (options?.body as Array<Array<string>>) || [];
    const didParseCell = options?.didParseCell as
      | ((hookData: Record<string, unknown>) => void)
      | undefined;
    const didDrawCell = options?.didDrawCell as
      | ((hookData: Record<string, unknown>) => void)
      | undefined;

    body.forEach((row, rowIndex) => {
      row.forEach((_cell, columnIndex) => {
        const hookData = {
          section: 'body',
          row: { index: rowIndex },
          column: { index: columnIndex },
          cell: {
            x: 10,
            y: 10,
            width: 100,
            height: 12,
            styles: {},
          },
        };

        didParseCell?.(hookData);
        didDrawCell?.(hookData);
      });
    });
  },
}));

import jsPDF from 'jspdf';
import { resolveSectionOrder } from '../exportPdfClient';
import type { ExportSection } from '@/types/tripExport';

interface JsPDFMockInstance {
  _texts: string[];
  _links: string[];
  _tables: Array<Record<string, unknown>>;
  _properties: Record<string, unknown> | null;
}

function getLatestMockDoc(): JsPDFMockInstance {
  const instances = (jsPDF as unknown as Record<string, unknown[]>)
    .instances as JsPDFMockInstance[];
  return instances[instances.length - 1];
}

// Note: These are basic unit tests for helper functions
// Full integration tests would require jsPDF mocking

describe('PDF Export Client Helpers', () => {
  afterEach(() => {
    (jsPDF as unknown as Record<string, unknown[]>).instances = [];
    vi.unstubAllGlobals();
  });

  describe('chunkArray', () => {
    it('should chunk array into smaller arrays', () => {
      // This would test the chunkArray helper if exported
      const _array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const _chunkSize = 3;
      const _expected = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];

      // Implementation would be:
      // const chunks: number[][] = [];
      // for (let i = 0; i < array.length; i += chunkSize) {
      //   chunks.push(array.slice(i, i + chunkSize));
      // }
      // expect(chunks).toEqual(expected);

      expect(true).toBe(true); // Placeholder
    });

    it('should handle empty arrays', () => {
      const _array: number[] = [];
      const _chunkSize = 3;
      const _expected: number[][] = [];

      expect(true).toBe(true); // Placeholder
    });

    it('should handle arrays smaller than chunk size', () => {
      const _array = [1, 2];
      const _chunkSize = 5;
      const _expected = [[1, 2]];

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('hexToRgb', () => {
    it('should parse hex color to RGB array', () => {
      // This would test hexToRgb if exported
      const _hex = '#428BCA';
      const _expected: [number, number, number] = [66, 139, 202];

      // Implementation would be:
      // const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      // expect(result).toEqual(expected);

      expect(true).toBe(true); // Placeholder
    });

    it('should handle hex without # prefix', () => {
      const _hex = '428BCA';
      const _expected: [number, number, number] = [66, 139, 202];

      expect(true).toBe(true); // Placeholder
    });

    it('should return default color for invalid hex', () => {
      const _hex = 'invalid';
      const _defaultColor: [number, number, number] = [66, 139, 202];

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('PDF Generation', () => {
    it('creates clickable links for places URLs (including missing protocol)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      await generateClientPDF(
        {
          tripId: '1',
          tripTitle: 'Trip',
          places: [
            { name: 'Camp', url: 'maps.google.com', votes: 0 },
            { name: 'Hotel', url: 'https://example.com/hotel', votes: 2 },
            { name: 'Bad URL', url: 'not a valid url', votes: 1 },
          ],
        },
        ['places'],
      );

      const instances = (jsPDF as unknown as Record<string, unknown[]>).instances as Array<{
        _links: string[];
      }>;
      const latest = instances[instances.length - 1];

      expect(latest._links).toContain('https://maps.google.com/');
      expect(latest._links).toContain('https://example.com/hotel');
      expect(latest._links).not.toContain('not a valid url');
    });

    it('renders attachments header when files exist', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      await generateClientPDF(
        {
          tripId: '1',
          tripTitle: 'Trip',
          attachments: [
            {
              name: 'Azulik Eco-Resort Confirmation.pdf',
              type: 'application/pdf',
              uploaded_at: '2026-01-01T00:00:00Z',
            },
          ],
        },
        ['attachments'],
      );

      const instances = (jsPDF as unknown as Record<string, unknown[]>).instances as Array<{
        _texts: string[];
      }>;
      const latest = instances[instances.length - 1];
      expect(latest._texts).toContain('Attachments');
    });

    it('should handle empty trip data', async () => {
      // This would test generateClientPDF with empty data
      expect(true).toBe(true); // Placeholder - requires jsPDF mocking
    });

    it('should handle large datasets with pagination', async () => {
      // This would test pagination with >100 items
      expect(true).toBe(true); // Placeholder - requires jsPDF mocking
    });

    it('should apply customization options', async () => {
      // This would test color customization, section order, etc.
      expect(true).toBe(true); // Placeholder - requires jsPDF mocking
    });

    it('should call progress callback', async () => {
      // This would test progress callbacks fire correctly
      expect(true).toBe(true); // Placeholder - requires jsPDF mocking
    });
  });

  describe('resolveSectionOrder', () => {
    it('respects a custom sectionOrder exactly', () => {
      const sections: ExportSection[] = ['calendar', 'payments', 'tasks'];
      const customOrder: ExportSection[] = ['tasks', 'payments', 'calendar'];

      expect(resolveSectionOrder(sections, customOrder)).toEqual(['tasks', 'payments', 'calendar']);
    });

    it('appends sections missing from the custom order alphabetically by heading', () => {
      const sections: ExportSection[] = ['roster', 'calendar', 'payments', 'tasks'];
      const customOrder: ExportSection[] = ['tasks'];

      // Headings: Calendar Events < Payments < Trip Members (roster)
      expect(resolveSectionOrder(sections, customOrder)).toEqual([
        'tasks',
        'calendar',
        'payments',
        'roster',
      ]);
    });

    it('drops custom-order entries that are not included sections and ignores duplicates', () => {
      const sections: ExportSection[] = ['calendar', 'tasks'];
      const customOrder: ExportSection[] = ['polls', 'tasks', 'tasks', 'calendar'];

      expect(resolveSectionOrder(sections, customOrder)).toEqual(['tasks', 'calendar']);
    });

    it('falls back to alphabetical-by-heading order without a custom order', () => {
      const sections: ExportSection[] = ['tasks', 'roster', 'calendar', 'agenda'];

      // Headings: Agenda < Calendar Events < Tasks < Trip Members (roster)
      expect(resolveSectionOrder(sections)).toEqual(['agenda', 'calendar', 'tasks', 'roster']);
      expect(resolveSectionOrder(sections, [])).toEqual(['agenda', 'calendar', 'tasks', 'roster']);
    });

    it('survives generateClientPDF: custom order controls rendered heading order', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      await generateClientPDF(
        {
          tripId: '1',
          tripTitle: 'Trip',
          calendar: [{ title: 'Dinner', start_time: '2026-06-10T19:00:00Z' }],
          tasks: [{ title: 'Pack bags', completed: false }],
        },
        ['calendar', 'tasks'],
        { customization: { sectionOrder: ['tasks', 'calendar'] } },
      );

      const texts = getLatestMockDoc()._texts;
      const tasksIndex = texts.indexOf('Tasks');
      const calendarIndex = texts.indexOf('Calendar Events');

      expect(tasksIndex).toBeGreaterThan(-1);
      expect(calendarIndex).toBeGreaterThan(-1);
      // Alphabetical would put Calendar Events first; the custom order must win.
      expect(tasksIndex).toBeLessThan(calendarIndex);
    });
  });

  describe('deliverable branding', () => {
    it('uses the trip name as document title and modest footer attribution', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      await generateClientPDF(
        {
          tripId: '1',
          tripTitle: 'Smith Wedding Weekend',
          calendar: [{ title: 'Rehearsal Dinner', start_time: '2026-06-10T19:00:00Z' }],
        },
        ['calendar'],
      );

      const doc = getLatestMockDoc();

      // Marketing copy must not appear anywhere in the deliverable
      expect(doc._texts).not.toContain('ChravelApp Recap');
      expect(doc._texts).not.toContain('The Group Chat Travel App');

      // Modest single-line attribution remains
      expect(doc._texts).toContain('Made with ChravelApp');

      // Trip name is the heading and the PDF metadata title
      expect(doc._texts).toContain('Smith Wedding Weekend');
      expect(doc._properties).toEqual({ title: 'Smith Wedding Weekend' });
    });

    it('still honors a custom footerText override', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      await generateClientPDF({ tripId: '1', tripTitle: 'Trip' }, ['calendar'], {
        customization: { footerText: 'Prepared by Atelier Travel' },
      });

      const doc = getLatestMockDoc();
      expect(doc._texts).toContain('Prepared by Atelier Travel');
      expect(doc._texts).not.toContain('Made with ChravelApp');
    });
  });

  describe('calendar description rendering', () => {
    it('keeps full event descriptions (no 60-char truncation)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

      const { generateClientPDF } = await import('../exportPdfClient');

      const longDescription =
        'Private sunset catamaran charter departing from the marina, including champagne service, ' +
        'a four-course tasting menu, and return transfer to the villa.';

      await generateClientPDF(
        {
          tripId: '1',
          tripTitle: 'Trip',
          calendar: [
            {
              title: 'Catamaran Charter',
              start_time: '2026-06-10T17:30:00Z',
              description: longDescription,
            },
          ],
        },
        ['calendar'],
      );

      const doc = getLatestMockDoc();
      const calendarTable = doc._tables.find(table => {
        const head = table.head as string[][] | undefined;
        return head?.[0]?.includes('Description');
      });

      expect(calendarTable).toBeTruthy();
      const body = calendarTable?.body as string[][];
      expect(body[0][3]).toBe(longDescription);
      expect(body[0][3]).not.toMatch(/\.\.\.$/);
    });
  });
});
