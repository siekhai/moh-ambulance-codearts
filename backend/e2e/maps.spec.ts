/**
 * E2E — Google Maps REST API (BE-009)
 * Covers: /api/maps/geocode, /reverse-geocode, /directions, /distance-matrix, /eta
 *
 * Environment: NO GOOGLE_MAPS_API_KEY configured → graceful-degradation path.
 * Maps endpoints must return 400 with status: "MISSING_KEY".
 * Validation errors (bad/missing params) must return 400 with descriptive error.
 */
import { test, expect } from '@playwright/test';

test.describe('Maps API — validation & graceful degradation', () => {
  // ── /api/maps/geocode ────────────────────────────────────────────────────
  test('TC-BE-002: geocode rejects empty address with 400', async ({ request }) => {
    const res = await request.get('/api/maps/geocode');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('address');
  });

  test('TC-BE-002b: geocode rejects whitespace-only address with 400', async ({ request }) => {
    const res = await request.get('/api/maps/geocode?address=%20%20');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('address');
  });

  test('TC-BE-003: geocode returns 400 MISSING_KEY without API key', async ({ request }) => {
    const res = await request.get('/api/maps/geocode?address=Phnom%20Penh');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
    expect(body.error).toBeTruthy();
  });

  // ── /api/maps/reverse-geocode ───────────────────────────────────────────
  test('TC-BE-004: reverse-geocode rejects non-numeric coords with 400', async ({ request }) => {
    const res = await request.get('/api/maps/reverse-geocode?lat=abc&lng=xyz');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('numeric');
  });

  test('TC-BE-005: reverse-geocode returns 400 MISSING_KEY without API key', async ({ request }) => {
    const res = await request.get('/api/maps/reverse-geocode?lat=11.5564&lng=104.9282');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
  });

  // ── /api/maps/directions ────────────────────────────────────────────────
  test('TC-BE-006: directions rejects missing params with 400', async ({ request }) => {
    const res = await request.get('/api/maps/directions');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('TC-BE-006b: directions rejects partial params with 400', async ({ request }) => {
    const res = await request.get('/api/maps/directions?originLat=11.55&originLng=104.92');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('numeric');
  });

  test('TC-BE-007: directions returns 400 MISSING_KEY without API key', async ({ request }) => {
    const res = await request.get(
      '/api/maps/directions?originLat=11.55&originLng=104.92&destLat=11.56&destLng=104.93',
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
  });

  test('TC-BE-007b: directions accepts travelMode param without crashing', async ({ request }) => {
    const res = await request.get(
      '/api/maps/directions?originLat=11.55&originLng=104.92&destLat=11.56&destLng=104.93&mode=walking',
    );
    // No key → 400 MISSING_KEY (mode parsed fine, no crash)
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
  });

  // ── /api/maps/distance-matrix ───────────────────────────────────────────
  test('TC-BE-008: distance-matrix rejects missing params with 400', async ({ request }) => {
    const res = await request.get('/api/maps/distance-matrix');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('origins');
    expect(body.error).toContain('destinations');
  });

  test('TC-BE-008b: distance-matrix rejects empty origins with 400', async ({ request }) => {
    const res = await request.get('/api/maps/distance-matrix?origins=&destinations=11.56,104.93');
    expect(res.status()).toBe(400);
  });

  test('TC-BE-009: distance-matrix returns 400 MISSING_KEY without API key', async ({ request }) => {
    const res = await request.get(
      '/api/maps/distance-matrix?origins=11.55,104.92&destinations=11.56,104.93',
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
  });

  // ── /api/maps/eta ───────────────────────────────────────────────────────
  test('TC-BE-010: eta rejects non-numeric coords with 400', async ({ request }) => {
    const res = await request.get(
      '/api/maps/eta?originLat=foo&originLng=bar&destLat=1&destLng=2',
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('numeric');
  });

  test('TC-BE-011: eta returns 400 MISSING_KEY without API key', async ({ request }) => {
    const res = await request.get(
      '/api/maps/eta?originLat=11.55&originLng=104.92&destLat=11.56&destLng=104.93',
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('MISSING_KEY');
  });
});