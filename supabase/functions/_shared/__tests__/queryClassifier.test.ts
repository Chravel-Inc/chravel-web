import { describe, expect, it } from 'vitest';
import { classifyQuery } from '../concierge/queryClassifier.ts';

describe('queryClassifier attachment intent and lean fallback', () => {
  it('routes attachment smart import intent to smart_import', () => {
    const cls = classifyQuery('please check this', true, { attachmentIntent: 'smart_import' });
    expect(cls).toBe('smart_import');
  });

  it('routes attachment summarize intent to trip_lookup_light', () => {
    const cls = classifyQuery('please check this', true, { attachmentIntent: 'summarize' });
    expect(cls).toBe('trip_lookup_light');
  });

  it('uses trip_lookup_light for very short non-trip prompts', () => {
    // q.length < 4 takes the lean fast-path regardless of vocabulary.
    const cls = classifyQuery('hi', false);
    expect(cls).toBe('trip_lookup_light');
  });

  it('routes trip-scoped vocabulary to trip_summary (full tool registry)', () => {
    // Intentional: trip vocabulary ("trip", "calendar", "task", ...) routes to
    // trip_summary so write tools stay available — see queryClassifier.ts step 7.
    const cls = classifyQuery('trip?', false);
    expect(cls).toBe('trip_summary');
  });
});
