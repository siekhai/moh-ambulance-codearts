/**
 * Maps API routes.
 *
 * Exposes Google Maps operations as REST endpoints:
 *   GET  /api/maps/geocode?address=...
 *   GET  /api/maps/reverse-geocode?lat=...&lng=...
 *   GET  /api/maps/directions?originLat=&originLng=&destLat=&destLng=&mode=driving
 *   GET  /api/maps/distance-matrix (origins/destinations as CSV "lat,lng|lat,lng")
 *   GET  /api/maps/eta?originLat=&originLng=&destLat=&destLng=
 */

import { Router, type Request, type Response } from 'express';
import {
  GoogleMapsService,
  GoogleMapsError,
  TravelMode,
  formatETA,
  formatDistance,
  type Coordinates,
} from '../services/googleMaps.js';

const router = Router();

let service: GoogleMapsService | null = null;
function getService(): GoogleMapsService {
  if (!service) service = GoogleMapsService.fromEnv();
  return service;
}

export function _setGoogleMapsService(s: GoogleMapsService | null): void {
  service = s;
}

router.get('/geocode', async (req: Request, res: Response) => {
  const address = typeof req.query.address === 'string' ? req.query.address : '';
  if (!address.trim()) {
    return res.status(400).json({ error: 'address query param is required' });
  }
  try {
    const result = await getService().geocodeAddress(address);
    return res.json(result);
  } catch (err) {
    return handleMapsError(res, err);
  }
});

router.get('/reverse-geocode', async (req: Request, res: Response) => {
  const parsed = parseLatLngQuery(req);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const result = await getService().reverseGeocode(parsed.lat, parsed.lng);
    return res.json(result);
  } catch (err) {
    return handleMapsError(res, err);
  }
});

router.get('/directions', async (req: Request, res: Response) => {
  const coords = parseRouteQuery(req);
  if ('error' in coords) return res.status(400).json({ error: coords.error });
  const mode = parseTravelMode(req.query.mode);
  try {
    const result = await getService().getDirections(
      coords.origin,
      coords.destination,
      { travelMode: mode },
    );
    const { staticMapUrl: _stripped, ...safeResult } = result;
    return res.json({
      ...safeResult,
      etaText: formatETA(
        result.durationInTrafficSeconds ?? result.durationSeconds,
      ),
      distanceText: formatDistance(result.distanceMeters),
    });
  } catch (err) {
    return handleMapsError(res, err);
  }
});

router.get('/distance-matrix', async (req: Request, res: Response) => {
  const originsRaw = str(req.query.origins);
  const destsRaw = str(req.query.destinations);
  if (!originsRaw || !destsRaw) {
    return res
      .status(400)
      .json({ error: 'origins and destinations query params are required' });
  }
  const origins = parseCoordinateList(originsRaw);
  const destinations = parseCoordinateList(destsRaw);
  if (!origins.length || !destinations.length) {
    return res
      .status(400)
      .json({ error: 'origins and destinations must be non-empty coordinate lists' });
  }
  try {
    const result = await getService().getDistanceMatrix(origins, destinations);
    return res.json(result);
  } catch (err) {
    return handleMapsError(res, err);
  }
});

router.get('/eta', async (req: Request, res: Response) => {
  const coords = parseRouteQuery(req);
  if ('error' in coords) return res.status(400).json({ error: coords.error });
  try {
    const result = await getService().getDirections(
      coords.origin,
      coords.destination,
    );
    const seconds = result.durationInTrafficSeconds ?? result.durationSeconds;
    return res.json({
      etaSeconds: seconds,
      etaText: formatETA(seconds),
      distanceMeters: result.distanceMeters,
      distanceText: formatDistance(result.distanceMeters),
    });
  } catch (err) {
    return handleMapsError(res, err);
  }
});

export default router;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function parseLatLngQuery(req: Request):
  | { lat: number; lng: number }
  | { error: string } {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: 'lat and lng must be numeric' };
  }
  return { lat, lng };
}

function parseRouteQuery(req: Request):
  | { origin: Coordinates; destination: Coordinates }
  | { error: string } {
  const originLat = Number(req.query.originLat);
  const originLng = Number(req.query.originLng);
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  if (
    [originLat, originLng, destLat, destLng].some((n) => Number.isNaN(n))
  ) {
    return {
      error:
        'originLat, originLng, destLat, destLng must all be numeric',
    };
  }
  return {
    origin: { lat: originLat, lng: originLng },
    destination: { lat: destLat, lng: destLng },
  };
}

function parseTravelMode(v: unknown): TravelMode {
  const s = str(v).toLowerCase();
  if (s === 'walking') return TravelMode.walking;
  if (s === 'bicycling') return TravelMode.bicycling;
  if (s === 'transit') return TravelMode.transit;
  return TravelMode.driving;
}

function parseCoordinateList(raw: string): Coordinates[] {
  return raw
    .split('|')
    .map((pair) => pair.split(','))
    .filter((parts) => parts.length === 2)
    .map(([lat, lng]) => ({ lat: Number(lat), lng: Number(lng) }))
    .filter((c) => !Number.isNaN(c.lat) && !Number.isNaN(c.lng));
}

function handleMapsError(res: Response, err: unknown): Response {
  if (err instanceof GoogleMapsError) {
    if (err.status === 'INVALID_INPUT' || err.status === 'MISSING_KEY') {
      return res.status(400).json({ error: err.message, status: err.status });
    }
    if (err.status === 'ZERO_RESULTS') {
      return res.status(404).json({ error: err.message, status: err.status });
    }
    return res.status(502).json({ error: err.message, status: err.status });
  }
  const message = err instanceof Error ? err.message : 'unknown error';
  return res.status(500).json({ error: message });
}