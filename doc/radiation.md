# Radiation Module

A table-based log of radiation measurements with analytics dashboards and per-user unit preferences.

---

## Route

`/radiation` — protected, requires login.

---

## Features

- **Measurement logging** — Date, time window (start/end), location, average and peak radiation levels, comments, notes, tags, status.
- **Location management** — User-owned named locations with optional GPS coordinates (lat/lng).
- **Unit conversion** — All values stored internally in **µSv/h**. Display is converted client-side to the user's preferred unit: `µSv/h`, `mSv/h`, `nSv/h`, `µGy/h`, `mGy/h`, `mR/h`, or `CPM`.
- **CPM support** — User-configurable conversion factor (default **151 CPM/µSv/h** for SBM-20 tube).
- **Status workflow** — `Draft` → `Verified` / `Flagged` / `Archived`.
- **Public sharing** — Each measurement can be made public (similar to Wishlist pattern). Public feed available without auth.
- **Soft delete with audit trail** — Captures `deletedBy`, `deletedAt`, `deletedReason`, plus snapshots of `comments`, `tags`, `status` at deletion time. Hard delete also supported.
- **Restore** — Soft-deleted measurements can be restored.
- **Analytics (3 charts)**:
  1. **Time-series line chart** — Average and peak radiation level over time (filterable by date range).
  2. **Per-location bar chart** — Average level per named location, sorted descending.
  3. **Heatmap calendar** — Daily average level displayed as a GitHub-style contribution grid (year-selectable).
- **GDPR compliance** — Full erasure on account deletion; data included in export.

---

## Backend

### Models

#### `RadiationLocation` (`backend/models/RadiationLocation.js`)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | Owner |
| `name` | String | Required, max 100 chars |
| `description` | String | Optional, max 500 chars |
| `coordinates.lat` | Number | -90 to 90, nullable |
| `coordinates.lng` | Number | -180 to 180, nullable |
| `createdAt`, `updatedAt` | Date | Auto-managed by Mongoose |

#### `RadiationMeasurement` (`backend/models/RadiationMeasurement.js`)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | Owner |
| `date` | Date | Required |
| `timeStart`, `timeEnd` | String | HH:MM format, optional |
| `locationId` | ObjectId → RadiationLocation | Optional |
| `locationName` | String | Denormalized for display |
| `averageLevel` | Number | **µSv/h**, required |
| `peakLevel` | Number | **µSv/h**, optional |
| `comments` | String | max 2000 |
| `notes` | String | max 5000 |
| `tags` | [String] | max 50 per tag |
| `status` | String | `Draft` \| `Verified` \| `Flagged` \| `Archived` |
| `isPublic` | Boolean | Default false |
| `createdBy`, `updatedBy` | ObjectId → User | Audit |
| `isDeleted` | Boolean | Default false |
| `deletedBy`, `deletedAt`, `deletedReason` | — | Soft-delete audit |
| `deletedComments`, `deletedTags`, `deletedStatus` | — | State snapshot at deletion |
| `createdAt`, `updatedAt` | Date | Auto-managed |

### Controller

`backend/controllers/radiationController.js` — Exports:

- **Locations**: `createLocation`, `getLocations`, `updateLocation`, `deleteLocation`
- **Measurements**: `createMeasurement`, `getMeasurements`, `getPublicMeasurements`, `updateMeasurement`, `softDeleteMeasurement`, `hardDeleteMeasurement`, `restoreMeasurement`, `toggleVisibility`
- **Analytics**: `getTimeSeries`, `getByLocation`, `getHeatmap`

### Routes

`backend/routes/radiation.js` — Mounted at `/api/radiation` in `server.js`.

See [api-overview.md](./api-overview.md) for the full endpoint table.

### Settings

A `radiation` block is added to the `Settings` model (`backend/models/Settings.js`):

```javascript
radiation: {
  preferredUnit: 'µSv/h',     // enum of 7 units
  defaultLocationId: null,     // ObjectId ref RadiationLocation
  cpmConversionFactor: 151     // CPM per µSv/h, default for SBM-20
}
```

Updated via `PUT /api/settings/radiation` (see `settingsController.updateRadiationSettings`).

---

## Frontend

### Files

| File | Purpose |
|------|---------|
| `frontend/src/components/Pages/Radiation.js` | Main page component (all tabs) |
| `frontend/src/services/radiationAPI.js` | Axios service wrapper |
| `frontend/src/utils/radiationUnits.js` | Unit conversion utilities |

### Page Tabs

| Tab | Description |
|-----|-------------|
| **Measurements** | Paginated table with CRUD, filters (search, status, location, date range) |
| **Analytics** | Three charts: time-series, per-location bar, heatmap calendar |
| **Locations** | Location management (create, edit, delete) |
| **Public** | Read-only feed of all public measurements |
| **Trash** | Soft-deleted measurements (restore / hard delete) |
| **Settings** | Per-user radiation preferences (unit, CPM factor) |

### Unit Conversion Utility (`radiationUnits.js`)

| Export | Description |
|--------|-------------|
| `RADIATION_UNITS` | Array of supported unit strings |
| `fromUSvH(value, unit, cpmFactor)` | Convert µSv/h → display unit |
| `toUSvH(value, unit, cpmFactor)` | Convert display unit → µSv/h (for storage) |
| `formatLevel(value, unit, cpmFactor)` | Formatted string with unit label |
| `levelColorClass(uSvH)` | Tailwind bg color by radiation level |
| `levelTextColorClass(uSvH)` | Tailwind text color by radiation level |
| `levelHeatmapClass(uSvH)` | Tailwind bg color for heatmap cells |

### Conversion Factors

| Unit | Factor (relative to µSv/h) |
|------|---------------------------|
| µSv/h | 1 (base) |
| mSv/h | 0.001 |
| nSv/h | 1000 |
| µGy/h | 1 (≈1:1 for photon radiation) |
| mGy/h | 0.001 |
| mR/h | 0.1145 (1 µSv/h ≈ 0.1145 mR/h) |
| CPM | user factor (default 151) |

### Context & Settings

- Radiation preferences live in `SettingsContext` under `settings.radiation`.
- `updateRadiationSettings()` is exposed from `SettingsContext` and calls `PUT /api/settings/radiation`.
- `settingsAPI.updateRadiationSettings()` added to `frontend/src/services/settingsAPI.js`.

### Navigation

- Route `/radiation` added to `App.js` (protected).
- Entry added to the Header apps dropdown.
- `'radiation'` added to `quickActions` default list in `SettingsContext` and `Home.js`/`HomeLayoutEditor.js`.

---

## GDPR

- `deleteAccount` cascade in `userRightsController.js` deletes all `RadiationMeasurement` and `RadiationLocation` documents for the user.
- `exportUserData` includes `radiation.measurements` and `radiation.locations` in the JSON export.
