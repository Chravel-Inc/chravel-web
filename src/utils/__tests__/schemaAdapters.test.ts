import { describe, it, expect } from 'vitest';
import { adaptTripsDataToTripSchema, isTripsDataFormat } from '../schemaAdapters';

describe('schemaAdapters', () => {
  describe('adaptTripsDataToTripSchema', () => {
    it('should correctly adapt standard tripsData format to Trip format', () => {
      const tripsData = [
        {
          id: 1,
          title: 'Spring Break 2026',
          location: 'Miami, FL',
          dateRange: 'Mar 15 - Mar 22, 2026',
          description: 'Fun in the sun',
          participants: [{ id: 1, name: 'Alice', avatar: 'alice.jpg' }],
          coverPhoto: 'miami.jpg',
        },
      ];

      const result = adaptTripsDataToTripSchema(tripsData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '1',
          name: 'Spring Break 2026',
          destination: 'Miami, FL',
          start_date: '2026-03-15',
          end_date: '2026-03-22',
          description: 'Fun in the sun',
          cover_image_url: 'miami.jpg',
          created_by: 'demo-user',
          is_archived: false,
          trip_type: 'consumer',
        }),
      );
    });

    it('should correctly handle missing optional fields', () => {
      const tripsData = [
        {
          id: '2',
          title: 'Weekend Getaway',
          location: 'Cabin',
          dateRange: '',
          description: 'Relaxing weekend',
          participants: [],
        },
      ];

      const result = adaptTripsDataToTripSchema(tripsData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '2',
          name: 'Weekend Getaway',
          destination: 'Cabin',
          start_date: undefined,
          end_date: undefined,
          description: 'Relaxing weekend',
          cover_image_url: '',
          is_archived: false,
          trip_type: 'consumer',
        }),
      );
    });

    it('should correctly handle malformed dateRanges', () => {
      const tripsData = [
        {
          id: 3,
          title: 'Bad Dates',
          location: 'Nowhere',
          dateRange: 'Invalid Date Format',
          description: 'No idea when',
          participants: [],
        },
      ];

      const result = adaptTripsDataToTripSchema(tripsData);

      expect(result).toHaveLength(1);
      expect(result[0].start_date).toBeUndefined();
      expect(result[0].end_date).toBeUndefined();
    });

    it('should map custom fields like trip_type and archived', () => {
      const tripsData = [
        {
          id: 4,
          title: 'Work Trip',
          location: 'NYC',
          dateRange: 'Jan 01 - Jan 05, 2024',
          description: 'Conference',
          participants: [],
          archived: true,
          trip_type: 'pro' as const,
        },
      ];

      const result = adaptTripsDataToTripSchema(tripsData);

      expect(result).toHaveLength(1);
      expect(result[0].is_archived).toBe(true);
      expect(result[0].trip_type).toBe('pro');
    });
  });

  describe('isTripsDataFormat', () => {
    it('should return true for valid tripsData objects', () => {
      const validObj = {
        id: 1,
        title: 'Trip',
        location: 'Location',
        participants: [],
      };

      expect(isTripsDataFormat(validObj)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isTripsDataFormat(null)).toBe(false);
      expect(isTripsDataFormat(undefined)).toBe(false);
      expect(isTripsDataFormat('string')).toBe(false);
      expect(isTripsDataFormat(123)).toBe(false);
      expect(isTripsDataFormat({ id: 1, title: 'Trip', location: 'Loc' })).toBe(false); // missing participants
      expect(isTripsDataFormat({ id: '1', title: 'Trip', location: 'Loc', participants: [] })).toBe(
        false,
      ); // id is string
      expect(isTripsDataFormat({ id: 1, title: 123, location: 'Loc', participants: [] })).toBe(
        false,
      ); // title is number
    });
  });
});
