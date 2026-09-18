/**
 * E2E — Backend misc: health, orders, 404 routing.
 */
import { test, expect } from '@playwright/test';

test.describe('Backend misc', () => {
  test('TC-BE-001: health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('TC-BE-018: GET /api/orders/:id/status returns stub status', async ({ request }) => {
    const res = await request.get('/api/orders/abc-123/status');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('string');
    expect(body).toHaveProperty('timeline');
    expect(Array.isArray(body.timeline)).toBe(true);
  });

  test('TC-BE-019: unknown API route returns 404', async ({ request }) => {
    const res = await request.get('/api/nonexistent-endpoint');
    expect(res.status()).toBe(404);
  });
});