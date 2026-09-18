import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import mapsRouter, { _setGoogleMapsService } from '../maps.js';
import {
  GoogleMapsService,
  type Coordinates,
  type DirectionsResult,
  type DistanceMatrixResult,
} from '../../services/googleMaps.js';

/**
 * A fake GoogleMapsService that returns canned data without touching the
 * network. We cast it to the service type the router expects.
 */
function fakeService(opts: {
  geocode?: (a: string) => Promise<unknown>;
  reverseGeocode?: (lat: number, lng: number) => Promise<unknown>;
  directions?: (o: Coordinates, d: Coordinates) => Promise<DirectionsResult>;
  matrix?: (o: Coordinates[], d: Coordinates[]) => Promise<DistanceMatrixResult>;
}): GoogleMapsService {
  const svc = {
    geocodeAddress: opts.geocode ?? (async () => ({})),
    reverseGeocode:
      opts.reverseGeocode ?? (async () => ({})),
    getDirections:
      opts.directions ??
      (async () => ({} as DirectionsResult)),
    getDistanceMatrix:
      opts.matrix ??
      (async () => ({} as DistanceMatrixResult)),
    findNearest: async () => ({ index: 0, distanceMeters: 0, durationSeconds: 0 }),
  };
  return svc as unknown as GoogleMapsService;
}

const app = express();
app.use(express.json());
app.use('/api/maps', mapsRouter);

beforeEach(() => {
  // inject a permissive fake by default
  _setGoogleMapsService(
    fakeService({
      geocode: async (address) => ({
        coordinates: { lat: 1.35, lng: 103.81 },
        formattedAddress: address,
        placeId: 'p1',
        partialMatch: false,
      }),
      reverseGeocode: async (lat, lng) => ({
        formattedAddress: 'Some Address',
        placeId: 'p1',
        coordinates: { lat, lng },
      }),
      directions: async () => ({
        distanceMeters: 5200,
        durationSeconds: 480,
        durationInTrafficSeconds: 420,
        startLocation: { lat: 1, lng: 1 },
        endLocation: { lat: 2, lng: 2 },
        steps: [],
        summary: 'PIE',
      }),
      matrix: async (origins, destinations) => ({
        origins,
        destinations,
        rows: origins.map(() =>
          destinations.map(() => ({
            distanceMeters: 1000,
            durationSeconds: 60,
            status: 'OK',
            unreachable: false,
          })),
        ),
      }),
    }),
  );
});

afterEach(() => {
  _setGoogleMapsService(null);
});

describe('GET /api/maps/geocode', () => {
  it('200 with coordinates', async () => {
    const res = await request(app).get('/api/maps/geocode?address=Singapore');
    expect(res.status).toBe(200);
    expect(res.body.coordinates).toEqual({ lat: 1.35, lng: 103.81 });
  });

  it('400 when address missing', async () => {
    const res = await request(app).get('/api/maps/geocode');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/address/);
  });
});

describe('GET /api/maps/reverse-geocode', () => {
  it('200 with address', async () => {
    const res = await request(app).get('/api/maps/reverse-geocode?lat=1.3&lng=103.8');
    expect(res.status).toBe(200);
    expect(res.body.formattedAddress).toBe('Some Address');
  });

  it('400 when lat/lng non-numeric', async () => {
    const res = await request(app).get('/api/maps/reverse-geocode?lat=foo&lng=1');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/maps/directions', () => {
  it('200 with route and formatted ETA/distance', async () => {
    const res = await request(app).get(
      '/api/maps/directions?originLat=1&originLng=1&destLat=2&destLng=2&mode=driving',
    );
    expect(res.status).toBe(200);
    expect(res.body.distanceMeters).toBe(5200);
    expect(res.body.etaText).toBe('7 min');
    expect(res.body.distanceText).toBe('5.2 km');
  });

  it('400 when a coordinate is missing', async () => {
    const res = await request(app).get('/api/maps/directions?originLat=1&originLng=1');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/maps/distance-matrix', () => {
  it('200 with rows', async () => {
    const res = await request(app).get(
      '/api/maps/distance-matrix?origins=1,1|2,2&destinations=3,3',
    );
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(2);
    expect(res.body.rows[0]).toHaveLength(1);
  });

  it('400 when destinations missing', async () => {
    const res = await request(app).get('/api/maps/distance-matrix?origins=1,1');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/maps/eta', () => {
  it('200 with eta payload', async () => {
    const res = await request(app).get(
      '/api/maps/eta?originLat=1&originLng=1&destLat=2&destLng=2',
    );
    expect(res.status).toBe(200);
    expect(res.body.etaSeconds).toBe(420);
    expect(res.body.etaText).toBe('7 min');
  });
});
