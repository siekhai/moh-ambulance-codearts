/**
 * E2E — Visual Diff (TC-VIS-001)
 *
 * Sprint 1 has no full UI (only title + subtitle). A full-screen pixel diff
 * against Figma `main-screen.png` is NOT expected to match — Sprint 1 is
 * foundation-only. This test captures a baseline screenshot for future
 * regression and documents the deferral.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Visual diff — Sprint 1 scope', () => {
  test('TC-VIS-001: capture baseline screenshot (full UI deferred to Sprint 2+)', async ({ page, baseURL }) => {
    await page.goto(baseURL!);
    await page.setViewportSize({ width: 393, height: 852 });

    const outDir = path.join(process.cwd(), 'test-report', 'screenshots');
    await fs.promises.mkdir(outDir, { recursive: true });
    const shotPath = path.join(outDir, 'sprint1-baseline.png');
    await page.screenshot({ path: shotPath, fullPage: true });

    // Sanity: screenshot file exists and is non-empty
    const stat = await fs.promises.stat(shotPath);
    expect(stat.size).toBeGreaterThan(0);

    // Document deferral: Sprint 1 renders only title+subtitle, not the full
    // Figma screen. Full visual diff deferred to Sprint 2+ when UI lands.
    const h1 = await page.locator('h1').textContent();
    expect(h1).toBeTruthy();
  });
});
