import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import ambulanceRouter, { _setGoogleMapsService } from '../ambulance.js';
import {
  GoogleMapsService,
  type Coordinates,
  type DistanceMatrixResult,
} from '../../services/googleMaps.js';

function fakeMatrixService(distances: number[]): GoogleMapsService {
  const svc = {
    geocodeAddress: async () => ({}),
    reverseGeocode: async () => ({}),
    getDirections: async () => ({}),
    getDistanceMatrix: async (
      origins: Coordinates[],
      destinations: Coordinates[],
    ): Promise<DistanceMatrixResult> => ({
      origins,
      destinations,
      rows: [
        destinations.map((_, i) => ({
          distanceMeters: distances[i] ?? 1000,
          durationSeconds: (distances[i] ?? 1000) / 10,
          status: 'OK',
          unreachable: false,
        })),
      ],
    }),
    findNearest: async () => ({ index: 0, distanceMeters: 0, durationSeconds: 0 }),
  };
  return svc as unknown as GoogleMapsService;
}

const app = express();
app.use(express.json());
app.use('/api/ambulances', ambulanceRouter);

afterEach(() => {
  _setGoogleMapsService(null);
});

describe('GET /api/ambulances/nearby', () => {
  it('400 when lat/lng missing', async () => {
    const res = await request(app).get('/api/ambulances/nearby');
    expect(res.status).toBe(400);
  });

  it('400 when radius invalid', async () => {
    const res = await request(app).get('/api/ambulances/nearby?lat=1&lng=1&radius=-5');
    expect(res.status).toBe(400);
  });

  it('returns ranked ambulances within radius', async () => {
    // AMB-001 at index 0 -> 3000m, AMB-002 at index 1 -> 8000m
    _setGoogleMapsService(fakeMatrixService([3000, 8000]));
    const res = await request(app).get(
      '/api/ambulances/nearby?lat=1.35&lng=103.81&radius=10000',
    );
    expect(res.status).toBe(200);
    expect(res.body.ambulances).toHaveLength(2);
    // sorted ascending by distance
    expect(res.body.ambulances[0].id).toBe('AMB-001');
    expect(res.body.ambulances[0].distanceMeters).toBe(3000);
    expect(res.body.ambulances[1].id).toBe('AMB-002');
  });

  it('filters out ambulances beyond radius', async () => {
    _setGoogleMapsService(fakeMatrixService([3000, 50000]));
    const res = await request(app).get(
      '/api/ambulances/nearby?lat=1.35&lng=103.81&radius=10000',
    );
    expect(res.status).toBe(200);
    expect(res.body.ambulances).toHaveLength(1);
    expect(res.body.ambulances[0].id).toBe('AMB-001');
  });

  it('degrades gracefully when service unavailable (no key)', async () => {
    _setGoogleMapsService(null);
    const res = await request(app).get(
      '/api/ambulances/nearby?lat=1.35&lng=103.81&radius=10000',
    );
    expect(res.status).toBe(200);
    expect(res.body.ambulances.length).toBeGreaterThan(0);
    expect(res.body.warning).toMatch(/GOOGLE_MAPS_API_KEY/);
  });
});
