# Google Maps API Key Management (DO-002)

This document describes how the MoH Ambulance backend manages the
`GOOGLE_MAPS_API_KEY` and the rotation strategy.

## 1. Where the key lives

- **Local dev:** `backend/.env` (gitignored). Copy from `backend/.env.example`.
- **CI/CD:** stored as a repository secret `GOOGLE_MAPS_API_KEY` in GitHub
  Actions (or the equivalent variable in Azure DevOps pipelines). Injected into
  the build/deploy environment — never written to a file or logged.
- **Production:** injected by the hosting platform (Azure App Service / container
  env) from a secret store. The running process reads `process.env.GOOGLE_MAPS_API_KEY`.

The backend reads the key once per service instance via
`GoogleMapsService.fromEnv()` (see `src/services/googleMaps.ts`). If the key is
missing, the maps routes return HTTP 400 with `status: "MISSING_KEY"` and the
`/api/ambulances/nearby` route degrades gracefully (returns ambulances without
distance data).

## 2. Key restrictions (Google Cloud Console)

Apply all of the following to every key:

1. **API restrictions** — enable only:
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Maps Static API (optional)
2. **Application restrictions** —
   - Backend/server: **IP address** restriction to the production server egress
     IP(s) only.
   - Do NOT use an HTTP referrer restriction for the server key.

## 3. Rotation strategy

- **Cadence:** rotate every **90 days**, or immediately on suspected compromise.
- **Dual-key rotation** (zero-downtime):
  1. Create `KEY_B` in the Google Cloud Console with the same restrictions.
  2. Deploy with `GOOGLE_MAPS_API_KEY=KEY_B` (blue/green or rolling restart).
  3. Observe logs for 24h; confirm no `GoogleMapsError` spikes.
  4. Disable/regenerate `KEY_A` (the old key) in the Console.
  5. Record the rotation in the secrets audit log (date, key IDs, operator).
- **Emergency rotation:** skip step 3; deploy `KEY_B` and revoke `KEY_A` at once.
- **Quota/billing alerts:** set Cloud Monitoring alerts on quota exhaustion and
  unexpected spend so a leaked key is detected before the next scheduled rotation.

## 4. What NOT to do

- Never commit `.env` or any file containing a real key.
- Never log the key or echo it in CI logs. Mask it in pipeline output.
- Never share a single unrestricted key across environments — use one key per
  environment (dev/staging/prod) with distinct IP restrictions.
