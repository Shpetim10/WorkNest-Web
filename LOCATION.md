# API Documentation: Company Site Setup

This document provides a comprehensive technical reference for integrating the **Company Site Setup** feature into the NextJS frontend. It covers the DRAFT-to-ACTIVE lifecycle, idempotent step-saves, server-side detection logic, and optimistic concurrency.

---

## 1. Feature Context & Lifecycle

The Site Setup follows a **Wizard** pattern designed for resumability and high reliability.

### The Lifecycle States
- **DRAFT**: The site is being configured. It is invisible for attendance/clocking operations but fully editable by admins.
- **ACTIVE**: The site is operationally live. Basic info, location, and at least one trusted network are locked in (but still editable with version tracking).
- **DISABLED**: The site was active but has been temporarily taken offline.
- **ARCHIVED**: Terminal read-only state.

### Design Principles
- **Idempotent Saves**: Setup steps use `PUT` endpoints. Re-submitting the same payload results in the same state, preventing duplicate records or inconsistent states during network retries.
- **Advisory Detection**: Geolocation and Network detection calls do **not** persist data. They provide server-side analysis (warnings/confidence) for the admin to review before they explicitly "Commit" the choice.
- **Optimistic Locking**: Every write request must include a `version` field. If the site was modified by another admin in the meantime, the server will return a `409 Conflict`.

---

## 2. API Endpoint Reference

### [A] Initialization & Progress
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/companies/{companyId}/sites` | Create a new site in `DRAFT` status (Step 1). |
| `GET` | `/api/v1/sites/{siteId}/setup-status` | Get progress, completeness flags, blocking issues, and warnings. |

### [B] Configuration Steps
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PUT` | `/api/v1/sites/{siteId}/basic-info` | Save Step 1: Name, Code, Address, Timezone. |
| `PUT` | `/api/v1/sites/{siteId}/location` | Save Step 2: Geofence (Circle/Polygon), Accuracy, Buffers. |
| `PUT` | `/api/v1/sites/{siteId}/trusted-networks/{id}` | Upsert Step 3: Add/Update a CIDR rule for this site. |

### [C] Detection & Activation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/sites/{siteId}/detect-location` | Assess client Geolocation for staleness and suggested radius. |
| `POST` | `/api/v1/sites/{siteId}/detect-network` | Capture server-seen IP and check for CGNAT/VPN/Tor/Overlap. |
| `POST` | `/api/v1/sites/{siteId}/activate` | Validate readiness and transition to `ACTIVE`. |

---

## 3. Data Models (TypeScript)

### Core Enums
```typescript
export enum SiteStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ARCHIVED = 'ARCHIVED'
}

export enum SiteType {
  HQ = 'HQ',
  BRANCH = 'BRANCH',
  WAREHOUSE = 'WAREHOUSE',
  STORE = 'STORE',
  CLIENT_SITE = 'CLIENT_SITE',
  FIELD_ZONE = 'FIELD_ZONE'
}

export enum GeofenceShapeType {
  CIRCLE = 'CIRCLE',
  POLYGON = 'POLYGON'
}

export enum NetworkType {
  PUBLIC_IP = 'PUBLIC_IP',
  CIDR_RANGE = 'CIDR_RANGE',
  VPN = 'VPN',
  AUTO_DETECTED = 'AUTO_DETECTED'
}
```

### Main Interfaces
```typescript
export interface CompanySiteResponse {
  id: string; // UUID
  companyId: string;
  code: string;
  name: string;
  type: SiteType;
  status: SiteStatus;
  version: number;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode: string;
  timezone: string;
  // Geofence
  latitude?: number;
  longitude?: number;
  geofenceShapeType?: GeofenceShapeType;
  geofenceRadiusMeters?: number;
  geofencePolygonGeoJson?: string;
  entryBufferMeters?: number;
  exitBufferMeters?: number;
  maxLocationAccuracyMeters?: number;
  locationRequired: boolean;
  // Options
  qrEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  notes?: string;
}

export interface SiteSetupStatus {
  siteId: string;
  status: SiteStatus;
  version: number;
  basicInfoComplete: boolean;
  locationComplete: boolean;
  networkComplete: boolean;
  readyToActivate: boolean;
  blockingIssues: Issue[];
  warnings: Issue[];
  site: CompanySiteResponse;
  trustedNetworks: TrustedNetwork[];
}

export interface Issue {
  code: string;      // e.g., 'SITE_LOCATION_INCOMPLETE'
  message: string;   // Human readable
  field?: string;    // e.g., 'location'
}
```

---

## 4. Integration Workflow

### Step 1: Create Draft (or Resume)
The frontend should first check if there is an existing draft. If creating new:
```bash
POST /api/v1/companies/{companyId}/sites
{
  "code": "HQ-TIR",
  "name": "Tirana HQ",
  "type": "HQ",
  "countryCode": "AL",
  "timezone": "Europe/Tirane"
}
```

### Step 2: Location Assessment
Instead of raw input, use the **Detection API** to help the user.
1. Call `navigator.geolocation.getCurrentPosition`.
2. Forward the result to the server:
   ```bash
   POST /api/v1/sites/{siteId}/detect-location
   {
     "latitude": 41.3275,
     "longitude": 19.8189,
     "accuracyMeters": 45.0,
     "browserTimestampMs": 1712520000000
   }
   ```
3. Use the `suggestedRadiusMeters` from the response to initialize the map indicator.
4. Show `warnings` if `stale: true` or `lowAccuracy: true`.

### Step 3: Network Detection
Detection identifies the **real egress IP** seen by the server (not what the browser thinks it is).
1. Call `POST /api/v1/sites/{siteId}/detect-network`.
2. **Handle Scenarios**:
    - `confidence: "AUTO_HIGH"`: Safe to suggest "Use current network".
    - `confidence: "AUTO_LOW"`: Surface warnings (e.g., VPN/CGNAT).
    - `torExitNode: true`: Hard block (Red warning).
3. **Save**: Send the `suggestedCidr` via `PUT /api/v1/sites/{siteId}/trusted-networks/{new-uuid}`.

### Step 4: Final Activation
Before transitioning, perform a **Dry-Run**:
```bash
POST /api/v1/sites/{siteId}/activate?dryRun=true
```
- If `readyToActivate: true`, show the "Go Live" button.
- If not, display `blockingIssues` in a structured list.

---

## 5. Error Handling & Edge Cases

> [!CAUTION]
> **409 Conflict**: Always store the `version` field from the latest response. If you receive a 409, the UI must prompt the user to refresh their state to avoid overwriting recent changes from another admin.

> [!IMPORTANT]
> **Timezones**: The `timezone` field expects IANA identifiers (e.g., `Europe/Tirane`). The frontend should preferably use a timezone picker to ensure valid values.

> [!TIP]
> **Stale Location Warning**: If the detection result shows `stale: true`, it means the user's browser provided a cached geolocation. Encourage the user to wait for a fresh GPS fix for better accuracy.
