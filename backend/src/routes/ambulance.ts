/**
 * Ambulance routes.
 *
 *   GET  /nearby?lat=&lng=&radius=   -> list ambulances within radius,
 *                                       ranked by driving distance/ETA
 *   POST /request                     -> create an ambulance request
 */

import { Router, type Request, type Response } from 'express';
import {
  GoogleMapsService,
  GoogleMapsError,
  formatETA,
  formatDistance,
  type Coordinates,
} from '../services/googleMaps.js';

const router = Router();

let mapsService: GoogleMapsService | null = null;
function maps(): GoogleMapsService | null {
  if (!mapsService) {
    try {
      mapsService = GoogleMapsService.fromEnv();
    } catch {
      // Service unavailable (no key). Nearby will fall back to no distance data.
      mapsService = null;
    }
  }
  return mapsService;
}

/** Exposed for tests to inject a fake service. */
export function _setGoogleMapsService(s: GoogleMapsService | null): void {
  mapsService = s;
}

/**
 * In-memory ambulance fleet stub. Replaced by a DB/persistence layer in a
 * later sprint. Each ambulance has a fixed depot location.
 */
interface Ambulance {
  id: string;
  status: 'available' | 'busy' | 'offline';
  location: Coordinates;
}

const FLEET: Ambulance[] = [
  { id: 'AMB-001', status: 'available', location: { lat: 1.3521, lng: 103.8198 } },
  { id: 'AMB-002', status: 'available', location: { lat: 1.2805, lng: 103.8499 } },
  { id: 'AMB-003', status: 'busy', location: { lat: 1.4304, lng: 103.8354 } },
];

// GET /nearby?lat=&lng=&radius=20000  (radius in meters, default 10km)
router.get('/nearby', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius ?? 10000);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng must be numeric' });
  }
  if (Number.isNaN(radius) || radius <= 0) {
    return res.status(400).json({ error: 'radius must be a positive number (meters)' });
  }

  const origin: Coordinates = { lat, lng };
  const candidates = FLEET.filter((a) => a.status === 'available');

  // Fast path: no available ambulances.
  if (!candidates.length) {
    return res.json({ ambulances: [], origin, radius });
  }

  const service = maps();
  if (!service) {
    // No Google Maps key configured: return candidates without distance data.
    return res.json({
      ambulances: candidates.map((a) => ({
        id: a.id,
        status: a.status,
        location: a.location,
        distanceMeters: null,
        etaSeconds: null,
      })),
      origin,
      radius,
      warning: 'GOOGLE_MAPS_API_KEY not configured; distances unavailable',
    });
  }

  try {
    const destinations = candidates.map((a) => a.location);
    const matrix = await service.getDistanceMatrix([origin], destinations);
    const row = matrix.rows[0];

    const ranked = candidates
      .map((amb, i) => ({
        id: amb.id,
        status: amb.status,
        location: amb.location,
        distanceMeters: row[i].unreachable
          ? Number.POSITIVE_INFINITY
          : row[i].distanceMeters,
        etaSeconds: row[i].unreachable
          ? Number.POSITIVE_INFINITY
          : row[i].durationSeconds,
      }))
      .filter((a) => a.distanceMeters <= radius)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((a) => ({
        ...a,
        distanceText: formatDistance(a.distanceMeters),
        etaText: formatETA(a.etaSeconds),
      }));

    return res.json({ ambulances: ranked, origin, radius });
  } catch (err) {
    if (err instanceof GoogleMapsError) {
      return res
        .status(502)
        .json({ error: err.message, status: err.status });
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    return res.status(500).json({ error: message });
  }
});

// POST /request  { pickupLocation, destination, ... }
router.post('/request', async (req: Request, res: Response) => {
  // Stub: full order creation arrives in a later sprint.
  res.json({ orderCode: '', ambulanceId: '' });
});

export default router;
