/**
 * E2E — Ambulance API (BE-009 / BE-002)
 * Covers: /api/ambulances/nearby, /api/ambulances/request
 *
 * Environment: NO GOOGLE_MAPS_API_KEY → /nearby returns available units
 * with distanceMeters:null, etaSeconds:null and a `warning` field.
 */
import { test, expect } from '@playwright/test';

test.describe('Ambulances API — /nearby', () => {
  test('TC-BE-012: nearby rejects non-numeric lat/lng with 400', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=abc&lng=xyz');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('numeric');
  });

  test('TC-BE-013: nearby rejects non-positive radius with 400', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=11.55&lng=104.92&radius=-5');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('radius');
    expect(body.error).toContain('positive');
  });

  test('TC-BE-013b: nearby rejects NaN radius with 400', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=11.55&lng=104.92&radius=abc');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('radius');
  });

  test('TC-BE-014: nearby returns available ambulances with warning when no key', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=1.3521&lng=103.8198&radius=20000');
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.ambulances)).toBe(true);
    expect(body.ambulances.length).toBeGreaterThan(0);

    // Graceful degradation: null distances + warning
    expect(body.warning).toBeTruthy();
    expect(body.warning).toContain('GOOGLE_MAPS_API_KEY');

    for (const a of body.ambulances) {
      expect(a.status).toBe('available');
      expect(a.distanceMeters).toBeNull();
      expect(a.etaSeconds).toBeNull();
      expect(typeof a.id).toBe('string');
      expect(typeof a.location.lat).toBe('number');
      expect(typeof a.location.lng).toBe('number');
    }
  });

  test('TC-BE-015: nearby response shape matches contract', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=1.3521&lng=103.8198&radius=50000');
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Top-level shape
    expect(body).toHaveProperty('ambulances');
    expect(body).toHaveProperty('origin');
    expect(body).toHaveProperty('radius');
    expect(typeof body.origin.lat).toBe('number');
    expect(typeof body.origin.lng).toBe('number');
    expect(body.origin.lat).toBeCloseTo(1.3521);
    expect(body.origin.lng).toBeCloseTo(103.8198);
    expect(typeof body.radius).toBe('number');

    // Each ambulance shape
    for (const a of body.ambulances) {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('status');
      expect(a).toHaveProperty('location');
      expect(a.location).toHaveProperty('lat');
      expect(a.location).toHaveProperty('lng');
    }
  });

  test('TC-BE-016: nearby filters out busy/offline units', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=1.3521&lng=103.8198&radius=50000');
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Fleet: AMB-001 available, AMB-002 available, AMB-003 busy
    const ids = body.ambulances.map((a: { id: string }) => a.id);
    expect(ids).toContain('AMB-001');
    expect(ids).toContain('AMB-002');
    expect(ids).not.toContain('AMB-003');

    // All returned must be available
    for (const a of body.ambulances) {
      expect(a.status).toBe('available');
    }
  });

  test('TC-BE-016b: nearby uses default radius 10000 when omitted', async ({ request }) => {
    const res = await request.get('/api/ambulances/nearby?lat=1.3521&lng=103.8198');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.radius).toBe(10000);
  });
});

test.describe('Ambulances API — /request', () => {
  test('TC-BE-017: POST /request returns stub order', async ({ request }) => {
    const res = await request.post('/api/ambulances/request', { data: {} });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('orderCode');
    expect(body).toHaveProperty('ambulanceId');
  });
});