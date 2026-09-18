/**
 * Google Maps service for the MoH Ambulance backend.
 *
 * Wraps `@googlemaps/google-maps-services-js` to provide:
 *  - Geocoding (address -> coordinates)
 *  - Reverse geocoding (coordinates -> address)
 *  - Directions / routing with ETA and distance
 *  - Distance matrix calculation (many origins x many destinations)
 *
 * The service is environment-driven: the API key is read from
 * `GOOGLE_MAPS_API_KEY`. Use `GoogleMapsService.fromEnv()` to build the
 * default instance, or the constructor directly for testing.
 */

import {
  Client,
  Status,
  TravelMode,
  TravelRestriction,
  UnitSystem,
} from '@googlemaps/google-maps-services-js';

/** Geographic point. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Result of a forward geocode lookup. */
export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  placeId: string;
  partialMatch: boolean;
}

/** Result of a reverse geocode lookup. */
export interface ReverseGeocodeResult {
  formattedAddress: string;
  placeId: string;
  coordinates: Coordinates;
}

/** A single leg step in a route. */
export interface RouteStep {
  distanceMeters: number;
  durationSeconds: number;
  instructions: string;
  startLocation: Coordinates;
  endLocation: Coordinates;
}

/** A computed route between two points. */
export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Present only when `departure_time: 'now'` is requested. */
  durationInTrafficSeconds?: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
  steps: RouteStep[];
  summary: string;
  /** Optional pre-built static-map URL for the route polyline. */
  staticMapUrl?: string;
}

/** One origin/destination cell in a distance matrix. */
export interface DistanceMatrixElement {
  distanceMeters: number;
  durationSeconds: number;
  status: string;
  /** True when the cell could not be routed. */
  unreachable: boolean;
}

/** Full distance matrix result, indexed [origin][destination]. */
export interface DistanceMatrixResult {
  origins: Coordinates[];
  destinations: Coordinates[];
  rows: DistanceMatrixElement[][];
}

/** Options accepted by `getDirections`. */
export interface DirectionsOptions {
  travelMode?: TravelMode;
  /** Request `duration_in_traffic`. Defaults to true. */
  considerTraffic?: boolean;
  /** Avoid tolls / highways / ferries / indoor. */
  avoid?: ('tolls' | 'highways' | 'ferries' | 'indoor')[];
  /** Arrival time (Unix seconds) instead of departure now. */
  arrivalTime?: number;
}

/** Typed error thrown by the service. */
export class GoogleMapsError extends Error {
  constructor(
    public readonly status: string,
    message?: string,
    public readonly cause?: unknown,
  ) {
    super(`Google Maps API error [${status}]: ${message ?? 'no detail'}`);
    this.name = 'GoogleMapsError';
  }
}

const AVOID_MAP: Record<string, TravelRestriction> = {
  tolls: TravelRestriction.tolls,
  highways: TravelRestriction.highways,
  ferries: TravelRestriction.ferries,
  indoor: TravelRestriction.indoor,
};

/**
 * Core Google Maps service. Stateless aside from the injected client/key,
 * so a single instance can be shared across the app.
 */
export class GoogleMapsService {
  constructor(
    private readonly client: Client,
    private readonly apiKey: string,
  ) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new GoogleMapsError('MISSING_KEY', 'API key is empty');
    }
  }

  /** Build a service from the process environment, using a default Client. */
  static fromEnv(client?: Client): GoogleMapsService {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new GoogleMapsError(
        'MISSING_KEY',
        'GOOGLE_MAPS_API_KEY environment variable is not set',
      );
    }
    return new GoogleMapsService(client ?? new Client(), apiKey);
  }

  /** Forward geocode: address string -> coordinates + metadata. */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    const trimmed = address?.trim();
    if (!trimmed) {
      throw new GoogleMapsError('INVALID_INPUT', 'address is required');
    }

    const response = await this.client.geocode({
      params: { address: trimmed, key: this.apiKey },
    });

    if (response.data.status !== Status.OK) {
      throw new GoogleMapsError(
        response.data.status,
        response.data.error_message,
      );
    }
    if (!response.data.results.length) {
      throw new GoogleMapsError('ZERO_RESULTS', 'no geocode results');
    }

    const top = response.data.results[0];
    return {
      coordinates: {
        lat: top.geometry.location.lat,
        lng: top.geometry.location.lng,
      },
      formattedAddress: top.formatted_address,
      placeId: top.place_id,
      partialMatch: Boolean(top.partial_match),
    };
  }

  /** Reverse geocode: coordinates -> nearest address. */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    validateCoordinates(lat, lng);

    const response = await this.client.reverseGeocode({
      params: { latlng: { lat, lng }, key: this.apiKey },
    });

    if (response.data.status !== Status.OK) {
      throw new GoogleMapsError(
        response.data.status,
        response.data.error_message,
      );
    }
    if (!response.data.results.length) {
      throw new GoogleMapsError('ZERO_RESULTS', 'no reverse geocode results');
    }

    const top = response.data.results[0];
    return {
      formattedAddress: top.formatted_address,
      placeId: top.place_id,
      coordinates: { lat, lng },
    };
  }

  /** Directions between two points, returning distance + ETA + steps. */
  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    options: DirectionsOptions = {},
  ): Promise<DirectionsResult> {
    validateCoordinates(origin.lat, origin.lng);
    validateCoordinates(destination.lat, destination.lng);

    const travelMode =
      options.travelMode ?? TravelMode.driving;
    const considerTraffic = options.considerTraffic ?? true;

    const avoidList = (options.avoid ?? [])
      .map((a) => AVOID_MAP[a])
      .filter((a): a is TravelRestriction => Boolean(a));

    const response = await this.client.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: travelMode,
        units: UnitSystem.metric,
        key: this.apiKey,
        ...(options.arrivalTime
          ? { arrival_time: options.arrivalTime }
          : considerTraffic && travelMode === TravelMode.driving
            ? { departure_time: 'now' as const }
            : {}),
        ...(avoidList.length ? { avoid: avoidList } : {}),
      },
    });

    if (response.data.status !== Status.OK) {
      throw new GoogleMapsError(
        response.data.status,
        response.data.error_message,
      );
    }
    if (!response.data.routes.length) {
      throw new GoogleMapsError('ZERO_RESULTS', 'no route found');
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const steps: RouteStep[] = leg.steps.map((s) => ({
      distanceMeters: s.distance.value,
      durationSeconds: s.duration.value,
      instructions: s.html_instructions ?? '',
      startLocation: { lat: s.start_location.lat, lng: s.start_location.lng },
      endLocation: { lat: s.end_location.lat, lng: s.end_location.lng },
    }));

    return {
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
      durationInTrafficSeconds: leg.duration_in_traffic?.value,
      startLocation: { lat: leg.start_location.lat, lng: leg.start_location.lng },
      endLocation: { lat: leg.end_location.lat, lng: leg.end_location.lng },
      steps,
      summary: route.summary,
      staticMapUrl: buildStaticMapUrl(route.overview_polyline?.points, this.apiKey),
    };
  }

  /**
   * Distance matrix: compute distance + duration for every
   * origin x destination pair in a single request.
   */
  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
    options: DirectionsOptions = {},
  ): Promise<DistanceMatrixResult> {
    if (!origins.length || !destinations.length) {
      throw new GoogleMapsError(
        'INVALID_INPUT',
        'origins and destinations must be non-empty',
      );
    }
    origins.forEach((c) => validateCoordinates(c.lat, c.lng));
    destinations.forEach((c) => validateCoordinates(c.lat, c.lng));

    const travelMode = options.travelMode ?? TravelMode.driving;
    const considerTraffic = options.considerTraffic ?? true;

    const response = await this.client.distancematrix({
      params: {
        origins: origins.map((c) => `${c.lat},${c.lng}`),
        destinations: destinations.map((c) => `${c.lat},${c.lng}`),
        mode: travelMode,
        units: UnitSystem.metric,
        key: this.apiKey,
        // Distance Matrix API does not accept "now"; use the current Date.
        ...(considerTraffic && travelMode === TravelMode.driving
          ? { departure_time: new Date() }
          : {}),
      },
    });

    if (response.data.status !== Status.OK) {
      throw new GoogleMapsError(
        response.data.status,
        response.data.error_message,
      );
    }

    const rows: DistanceMatrixElement[][] = response.data.rows.map((row) =>
      row.elements.map((el) => ({
        distanceMeters: el.distance?.value ?? Number.POSITIVE_INFINITY,
        durationSeconds: el.duration?.value ?? Number.POSITIVE_INFINITY,
        status: el.status,
        unreachable: el.status !== Status.OK,
      })),
    );

    return { origins, destinations, rows };
  }

  /**
   * Convenience: pick the nearest destination to a single origin.
   * Returns the index of the closest destination and its metrics.
   */
  async findNearest(
    origin: Coordinates,
    destinations: Coordinates[],
  ): Promise<{ index: number; distanceMeters: number; durationSeconds: number }> {
    const matrix = await this.getDistanceMatrix([origin], destinations);
    const row = matrix.rows[0];
    let best = 0;
    for (let i = 1; i < row.length; i++) {
      if (row[i].unreachable) continue;
      if (row[i].distanceMeters < row[best].distanceMeters) best = i;
    }
    return {
      index: best,
      distanceMeters: row[best].distanceMeters,
      durationSeconds: row[best].durationSeconds,
    };
  }
}

/** Format an ETA in seconds as a human string, e.g. "8 min" / "1 hr 5 min". */
export function formatETA(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return 'unknown';
  const mins = Math.round(durationSeconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

/** Format a distance in meters as km with one decimal, e.g. "4.2 km". */
export function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return 'unknown';
  const km = distanceMeters / 1000;
  return km < 1 ? `${Math.round(distanceMeters)} m` : `${km.toFixed(1)} km`;
}

// --- internals ---------------------------------------------------------------

function validateCoordinates(lat: number, lng: number): void {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new GoogleMapsError(
      'INVALID_INPUT',
      `invalid coordinates: lat=${lat}, lng=${lng}`,
    );
  }
}

function buildStaticMapUrl(polyline?: string, key?: string): string | undefined {
  if (!polyline || !key) return undefined;
  const encoded = encodeURIComponent(`enc:${polyline}`);
  return `https://maps.googleapis.com/maps/api/staticmap?size=600x400&path=weight:5|color:0x0b6e4f|${encoded}&key=${key}`;
}

export { TravelMode };
