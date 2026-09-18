import { describe, it, expect, beforeEach } from 'vitest';
import { Client, Status, TravelMode } from '@googlemaps/google-maps-services-js';
import {
  GoogleMapsService,
  GoogleMapsError,
  formatETA,
  formatDistance,
} from '../googleMaps.js';

/**
 * Build a fake Client by partially overriding the methods we use.
 * The real Client is still constructed (its constructor is side-effect free)
 * but every method we call is replaced with a stub returning canned data.
 */
function makeClient(overrides: Record<string, unknown> = {}): Client {
  const client = new Client();
  return Object.assign(client, overrides) as Client;
}

const KEY = 'test-key';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;

  describe('construction', () => {
    it('throws on empty API key', () => {
      expect(() => new GoogleMapsService(makeClient(), '')).toThrow(
        GoogleMapsError,
      );
    });

    it('fromEnv throws when env var missing', () => {
      const old = process.env.GOOGLE_MAPS_API_KEY;
      delete process.env.GOOGLE_MAPS_API_KEY;
      expect(() => GoogleMapsService.fromEnv(makeClient())).toThrow(
        /GOOGLE_MAPS_API_KEY/,
      );
      if (old) process.env.GOOGLE_MAPS_API_KEY = old;
    });
  });

  describe('geocodeAddress', () => {
    beforeEach(() => {
      service = new GoogleMapsService(
        makeClient({
          geocode: async () => ({
            data: {
              status: Status.OK,
              results: [
                {
                  formatted_address: '1600 Amphitheatre Pkwy, Mountain View, CA',
                  geometry: { location: { lat: 37.422, lng: -122.084 } },
                  place_id: 'ChIJ2e',
                  partial_match: false,
                },
              ],
            },
          }),
        }),
        KEY,
      );
    });

    it('returns coordinates and formatted address', async () => {
      const r = await service.geocodeAddress('1600 Amphitheatre Pkwy');
      expect(r.coordinates).toEqual({ lat: 37.422, lng: -122.084 });
      expect(r.formattedAddress).toContain('Mountain View');
      expect(r.placeId).toBe('ChIJ2e');
      expect(r.partialMatch).toBe(false);
    });

    it('rejects empty address', async () => {
      await expect(service.geocodeAddress('   ')).rejects.toThrow(
        GoogleMapsError,
      );
    });

    it('throws on non-OK status', async () => {
      const bad = new GoogleMapsService(
        makeClient({
          geocode: async () => ({
            data: {
              status: Status.INVALID_REQUEST,
              results: [],
              error_message: 'bad',
            },
          }),
        }),
        KEY,
      );
      await expect(bad.geocodeAddress('x')).rejects.toThrow(GoogleMapsError);
    });

    it('throws when no results', async () => {
      const empty = new GoogleMapsService(
        makeClient({
          geocode: async () => ({ data: { status: Status.OK, results: [] } }),
        }),
        KEY,
      );
      await expect(empty.geocodeAddress('nowhere')).rejects.toThrow(
        /no geocode results/,
      );
    });
  });

  describe('reverseGeocode', () => {
    it('returns nearest address', async () => {
      service = new GoogleMapsService(
        makeClient({
          reverseGeocode: async () => ({
            data: {
              status: Status.OK,
              results: [
                {
                  formatted_address: 'Singapore',
                  place_id: 'ChIJ',
                },
              ],
            },
          }),
        }),
        KEY,
      );
      const r = await service.reverseGeocode(1.3521, 103.8198);
      expect(r.formattedAddress).toBe('Singapore');
      expect(r.coordinates).toEqual({ lat: 1.3521, lng: 103.8198 });
    });

    it('rejects out-of-range coordinates', async () => {
      service = new GoogleMapsService(makeClient(), KEY);
      await expect(service.reverseGeocode(999, 0)).rejects.toThrow(
        GoogleMapsError,
      );
    });
  });

  describe('getDirections', () => {
    it('returns distance, duration, and steps', async () => {
      service = new GoogleMapsService(
        makeClient({
          directions: async () => ({
            data: {
              status: Status.OK,
              routes: [
                {
                  summary: 'PIE',
                  overview_polyline: { points: 'abc' },
                  legs: [
                    {
                      distance: { value: 5200 },
                      duration: { value: 480 },
                      duration_in_traffic: { value: 420 },
                      start_location: { lat: 1.1, lng: 103.1 },
                      end_location: { lat: 1.2, lng: 103.2 },
                      steps: [
                        {
                          distance: { value: 5200 },
                          duration: { value: 480 },
                          html_instructions: 'go straight',
                          start_location: { lat: 1.1, lng: 103.1 },
                          end_location: { lat: 1.2, lng: 103.2 },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          }),
        }),
        KEY,
      );
      const r = await service.getDirections(
        { lat: 1.1, lng: 103.1 },
        { lat: 1.2, lng: 103.2 },
      );
      expect(r.distanceMeters).toBe(5200);
      expect(r.durationSeconds).toBe(480);
      expect(r.durationInTrafficSeconds).toBe(420);
      expect(r.steps).toHaveLength(1);
      expect(r.summary).toBe('PIE');
      expect(r.staticMapUrl).toContain('staticmap');
    });

    it('rejects invalid coordinates', async () => {
      service = new GoogleMapsService(makeClient(), KEY);
      await expect(
        service.getDirections({ lat: NaN, lng: 0 }, { lat: 1, lng: 1 }),
      ).rejects.toThrow(GoogleMapsError);
    });
  });

  describe('getDistanceMatrix', () => {
    it('returns a row per origin', async () => {
      service = new GoogleMapsService(
        makeClient({
          distancematrix: async () => ({
            data: {
              status: Status.OK,
              rows: [
                {
                  elements: [
                    { status: Status.OK, distance: { value: 1000 }, duration: { value: 60 } },
                    { status: Status.ZERO_RESULTS, distance: null, duration: null },
                  ],
                },
              ],
            },
          }),
        }),
        KEY,
      );
      const r = await service.getDistanceMatrix(
        [{ lat: 1, lng: 1 }],
        [
          { lat: 2, lng: 2 },
          { lat: 3, lng: 3 },
        ],
      );
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0][0].distanceMeters).toBe(1000);
      expect(r.rows[0][0].unreachable).toBe(false);
      expect(r.rows[0][1].unreachable).toBe(true);
    });

    it('rejects empty lists', async () => {
      service = new GoogleMapsService(makeClient(), KEY);
      await expect(service.getDistanceMatrix([], [{ lat: 1, lng: 1 }])).rejects.toThrow(
        GoogleMapsError,
      );
    });
  });

  describe('findNearest', () => {
    it('picks the closest destination', async () => {
      service = new GoogleMapsService(
        makeClient({
          distancematrix: async () => ({
            data: {
              status: Status.OK,
              rows: [
                {
                  elements: [
                    { status: Status.OK, distance: { value: 5000 }, duration: { value: 300 } },
                    { status: Status.OK, distance: { value: 2000 }, duration: { value: 120 } },
                    { status: Status.OK, distance: { value: 9000 }, duration: { value: 700 } },
                  ],
                },
              ],
            },
          }),
        }),
        KEY,
      );
      const best = await service.findNearest(
        { lat: 0, lng: 0 },
        [
          { lat: 1, lng: 1 },
          { lat: 2, lng: 2 },
          { lat: 3, lng: 3 },
        ],
      );
      expect(best.index).toBe(1);
      expect(best.distanceMeters).toBe(2000);
    });
  });
});

describe('formatETA', () => {
  it('formats minutes', () => {
    expect(formatETA(480)).toBe('8 min');
  });
  it('formats hours and minutes', () => {
    expect(formatETA(3900)).toBe('1 hr 5 min');
  });
  it('formats exact hours', () => {
    expect(formatETA(3600)).toBe('1 hr');
  });
  it('handles invalid input', () => {
    expect(formatETA(NaN)).toBe('unknown');
    expect(formatETA(-1)).toBe('unknown');
  });
});

describe('formatDistance', () => {
  it('formats meters under 1km', () => {
    expect(formatDistance(400)).toBe('400 m');
  });
  it('formats kilometers', () => {
    expect(formatDistance(4200)).toBe('4.2 km');
  });
  it('handles invalid input', () => {
    expect(formatDistance(NaN)).toBe('unknown');
  });
});
