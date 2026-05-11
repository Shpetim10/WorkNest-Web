# WorkNest Real-Time WebSocket Contract

**Protocol:** STOMP over WebSocket  
**Transport:** SockJS-compatible WebSocket (with fallback)  
**Base URL:** `wss://<host>/ws` (dev: `ws://localhost:8080/ws`)

---

## 1. Connection & Authentication

Authentication happens at **CONNECT time** — you must send a Bearer token in the STOMP `Authorization` native header. HTTP cookies are not used for WebSocket auth.

### Flow

```
Client                          Server
  |--- HTTP GET /ws (Upgrade) -->|   (no auth header needed for HTTP upgrade)
  |<-- 101 Switching Protocols --|
  |--- STOMP CONNECT ----------->|   Authorization: Bearer <jwt>
  |<-- STOMP CONNECTED ----------|   (session authenticated)
  |--- STOMP SUBSCRIBE ---------->|   destination: /topic/companies/{companyId}/...
  |<-- STOMP MESSAGE <------------|   envelope JSON
```

If the token is missing or invalid at CONNECT, the server closes the WebSocket session immediately with an error frame.

---

## 2. Envelope Schema

Every message pushed to the client uses this JSON structure:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "DEPARTMENT_CREATED",
  "entity": "department",
  "entityId": "d1b7e4f2-...",
  "scopeType": "company",
  "scopeId": "a3c2e1d0-...",
  "version": null,
  "occurredAt": "2026-05-06T10:32:00.123456Z",
  "actorUserId": "b2f9a1c3-...",
  "payload": { ... }
}
```

| Field        | Type              | Notes                                                       |
|--------------|-------------------|-------------------------------------------------------------|
| `eventId`    | UUID string       | Unique per event — use for deduplication                   |
| `type`       | string            | Event type constant (see per-resource tables below)         |
| `entity`     | string            | Resource name (e.g. `"department"`, `"leave_request"`)      |
| `entityId`   | UUID string       | ID of the affected entity (null for bulk/settings events)   |
| `scopeType`  | string            | Always `"company"`                                          |
| `scopeId`    | UUID string       | The company ID — matches the topic URL segment              |
| `version`    | number or null    | Optimistic-lock version (null where not applicable)         |
| `occurredAt` | ISO-8601 UTC      | Server-side timestamp of the event                          |
| `actorUserId`| UUID string/null  | User who triggered the action (null for system events)      |
| `payload`    | object or null    | Resource-specific data (see per-topic sections below)       |

---

## 3. Topic Reference

### 3.1 Authorization Matrix

| Topic destination                                | Allowed roles                          |
|--------------------------------------------------|----------------------------------------|
| `/topic/companies/{cid}/sites`                   | ADMIN, SUPERADMIN                      |
| `/topic/companies/{cid}/departments`             | ADMIN, SUPERADMIN                      |
| `/topic/companies/{cid}/settings`                | ADMIN, SUPERADMIN                      |
| `/topic/companies/{cid}/leave-requests`          | STAFF, ADMIN, SUPERADMIN               |
| `/topic/companies/{cid}/employees`               | STAFF, ADMIN, SUPERADMIN               |
| `/topic/companies/{cid}/attendance`              | STAFF, ADMIN, SUPERADMIN               |
| `/topic/companies/{cid}/announcements`           | EMPLOYEE, STAFF, ADMIN, SUPERADMIN     |
| `/user/queue/notifications`                      | Any authenticated user (own queue)     |

Subscribing to a topic outside your role returns a STOMP ERROR frame and the subscription is rejected.

Subscribing to another company's topic (`scopeId != your companyId`) is rejected even with a valid role.

---

### 3.2 Sites — `/topic/companies/{companyId}/sites`

| `type`                   | `entity`       | Trigger                                  |
|--------------------------|----------------|------------------------------------------|
| `COMPANY_SITE_CREATED`   | `company_site` | Admin creates a new site                 |
| `COMPANY_SITE_UPDATED`   | `company_site` | Admin updates site details               |
| `COMPANY_SITE_ACTIVATED` | `company_site` | Admin activates a disabled site          |
| `COMPANY_SITE_DISABLED`  | `company_site` | Admin disables an active site            |

**Payload** (all four types — `CompanySiteResponse` snapshot):
```json
{
  "id": "uuid",
  "name": "Main Office",
  "address": "...",
  "city": "...",
  "country": "AL",
  "timezone": "Europe/Tirane",
  "status": "ACTIVE",
  "latitude": 41.33,
  "longitude": 19.82,
  "geofenceRadiusMeters": 200,
  "companyId": "uuid"
}
```

---

### 3.3 Departments — `/topic/companies/{companyId}/departments`

| `type`                | `entity`     | Trigger                     |
|-----------------------|--------------|-----------------------------|
| `DEPARTMENT_CREATED`  | `department` | Admin creates a department   |
| `DEPARTMENT_UPDATED`  | `department` | Admin updates a department   |
| `DEPARTMENT_DELETED`  | `department` | Admin deletes a department   |

**Payload for CREATED / UPDATED** (`DepartmentResponse` snapshot):
```json
{
  "id": "uuid",
  "name": "Engineering",
  "description": "...",
  "status": "ACTIVE",
  "companyId": "uuid",
  "createdAt": "2026-05-06T10:00:00Z"
}
```

**Payload for DELETED**:
```json
{
  "deletedName": "Engineering"
}
```

---

### 3.4 Employees — `/topic/companies/{companyId}/employees`

| `type`                 | `entity`   | Trigger                                |
|------------------------|------------|----------------------------------------|
| `EMPLOYEE_PROVISIONED` | `employee` | Admin provisions a new employee/staff  |

**Payload**:
```json
{
  "employeeId": "uuid",
  "role": "EMPLOYEE",
  "email": "jane@example.com"
}
```

Note: No activation token is included. The new employee receives a separate email invite.

---

### 3.5 Announcements — `/topic/companies/{companyId}/announcements`

| `type`                   | `entity`       | Trigger                        |
|--------------------------|----------------|--------------------------------|
| `ANNOUNCEMENT_CREATED`   | `announcement` | Admin publishes an announcement |
| `ANNOUNCEMENT_DELETED`   | `announcement` | Admin deletes an announcement  |

**Payload for CREATED** (`AnnouncementListResponse` snapshot):
```json
{
  "id": "uuid",
  "title": "Office closed Friday",
  "content": "...",
  "targetAudience": "ALL",
  "priority": "HIGH",
  "authorName": "John Admin",
  "createdAt": "2026-05-06T09:00:00Z"
}
```

**Payload for DELETED**: `null` (use `entityId` from envelope to remove from local state)

---

### 3.6 Leave Requests — `/topic/companies/{companyId}/leave-requests`

| `type`                    | `entity`        | Trigger                        |
|---------------------------|-----------------|--------------------------------|
| `LEAVE_REQUEST_SUBMITTED` | `leave_request` | Employee submits a leave request |
| `LEAVE_REQUEST_APPROVED`  | `leave_request` | Admin/staff approves request   |
| `LEAVE_REQUEST_REJECTED`  | `leave_request` | Admin/staff rejects request    |

**Payload for SUBMITTED**:
```json
{
  "leaveRequestId": "uuid",
  "employeeId": "uuid",
  "leaveType": "VACATION",
  "startDate": "2026-06-01",
  "endDate": "2026-06-07",
  "totalDays": 7
}
```

**Payload for APPROVED**:
```json
{
  "leaveRequestId": "uuid",
  "employeeId": "uuid",
  "leaveType": "VACATION"
}
```

**Payload for REJECTED**:
```json
{
  "leaveRequestId": "uuid",
  "employeeId": "uuid",
  "leaveType": "VACATION",
  "rejectionReason": "Overlaps with team event"
}
```

---

### 3.7 Attendance — `/topic/companies/{companyId}/attendance`

| `type`                       | `entity`     | Trigger                                    |
|------------------------------|--------------|--------------------------------------------|
| `ATTENDANCE_MANUAL_CHECK_IN` | `attendance` | Staff/admin records a manual check-in      |
| `ATTENDANCE_MANUAL_CHECK_OUT`| `attendance` | Staff/admin records a manual check-out     |
| `ATTENDANCE_EVENT_REVIEWED`  | `attendance` | Staff/admin reviews an attendance event    |
| `ATTENDANCE_DAY_ADJUSTED`    | `attendance` | Staff/admin adjusts an attendance day record |

**Payload for MANUAL_CHECK_IN / MANUAL_CHECK_OUT**:
```json
{
  "employeeId": "uuid",
  "realtimeEventType": "ATTENDANCE_MANUAL_CHECK_IN",
  "occurredAt": "2026-05-06T08:00:00Z"
}
```

**Payload for EVENT_REVIEWED**:
```json
{
  "attendanceEventId": "uuid",
  "employeeId": "uuid",
  "reviewStatus": "APPROVED"
}
```

**Payload for DAY_ADJUSTED**:
```json
{
  "recordId": "uuid",
  "employeeId": "uuid",
  "workDate": "2026-05-06"
}
```

---

### 3.8 Company Settings — `/topic/companies/{companyId}/settings`

| `type`                    | `entity`  | Trigger                       |
|---------------------------|-----------|-------------------------------|
| `COMPANY_SETTINGS_UPDATED`| `company` | Admin saves company settings  |

**Payload** (`CompanySettingsResponse` snapshot):
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "email": "admin@acme.com",
  "nipt": "L12345678A",
  "phoneNumber": "+355 69 123 4567",
  "industry": "Technology",
  "timezone": "Europe/Tirane",
  "dateFormat": "dd/MM/yyyy",
  "currency": "ALL",
  "locale": "en",
  "countryCode": "AL",
  "logoKey": "logos/acme.png",
  "logoPath": "https://cdn.example.com/logos/acme.png"
}
```

---

### 3.9 Personal Notifications — `/user/queue/notifications`

This private queue delivers notifications directly to the logged-in user, regardless of role. Currently used for leave request decisions targeting the affected employee.

| `type`                   | When delivered                                |
|--------------------------|-----------------------------------------------|
| `LEAVE_REQUEST_APPROVED` | Employee whose request was approved           |
| `LEAVE_REQUEST_REJECTED` | Employee whose request was rejected           |

The payload structure is identical to the company-scoped leave-request events (see §3.6).

---

## 4. Next.js Integration

### 4.1 Dependencies

```bash
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

### 4.2 STOMP Client Setup

```typescript
// lib/realtimeClient.ts
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;

export function connectRealtime(
  token: string,
  onConnected: (client: Client) => void,
  onDisconnected?: () => void
): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => onConnected(client),
    onDisconnect: () => onDisconnected?.(),
    onStompError: (frame) => {
      console.error("STOMP error", frame.headers["message"], frame.body);
    },
  });

  client.activate();
  stompClient = client;
  return client;
}

export function disconnectRealtime(): void {
  stompClient?.deactivate();
  stompClient = null;
}
```

### 4.3 React Hook Example

```typescript
// hooks/useCompanyTopic.ts
import { useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function useCompanyTopic(
  token: string | null,
  companyId: string | null,
  resource: string,
  onMessage: (envelope: RealtimeEventEnvelope) => void
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token || !companyId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/companies/${companyId}/${resource}`,
          (msg: IMessage) => {
            try {
              onMessage(JSON.parse(msg.body));
            } catch {
              console.warn("Unparseable realtime message", msg.body);
            }
          }
        );
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [token, companyId, resource]);
}

// Usage — admin departments page
useCompanyTopic(token, companyId, "departments", (envelope) => {
  switch (envelope.type) {
    case "DEPARTMENT_CREATED":
      dispatch(addDepartment(envelope.payload));
      break;
    case "DEPARTMENT_UPDATED":
      dispatch(updateDepartment(envelope.payload));
      break;
    case "DEPARTMENT_DELETED":
      dispatch(removeDepartment(envelope.entityId));
      break;
  }
});
```

### 4.4 Personal Notifications Hook

```typescript
// hooks/usePersonalNotifications.ts
import { useEffect } from "react";
import { Client, IMessage } from "@stomp/stompjs";

export function usePersonalNotifications(
  client: Client | null,
  onNotification: (envelope: RealtimeEventEnvelope) => void
) {
  useEffect(() => {
    if (!client?.connected) return;

    const sub = client.subscribe("/user/queue/notifications", (msg: IMessage) => {
      try {
        onNotification(JSON.parse(msg.body));
      } catch {
        console.warn("Unparseable notification", msg.body);
      }
    });

    return () => sub.unsubscribe();
  }, [client]);
}
```

### 4.5 TypeScript Types

```typescript
// types/realtime.ts
export interface RealtimeEventEnvelope {
  eventId: string;
  type: string;
  entity: string;
  entityId: string | null;
  scopeType: "company";
  scopeId: string;
  version: number | null;
  occurredAt: string;       // ISO-8601 UTC
  actorUserId: string | null;
  payload: unknown;
}

// Event type constants
export const RealtimeEventType = {
  // Sites
  COMPANY_SITE_CREATED: "COMPANY_SITE_CREATED",
  COMPANY_SITE_UPDATED: "COMPANY_SITE_UPDATED",
  COMPANY_SITE_ACTIVATED: "COMPANY_SITE_ACTIVATED",
  COMPANY_SITE_DISABLED: "COMPANY_SITE_DISABLED",
  // Departments
  DEPARTMENT_CREATED: "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED: "DEPARTMENT_UPDATED",
  DEPARTMENT_DELETED: "DEPARTMENT_DELETED",
  // Employees
  EMPLOYEE_PROVISIONED: "EMPLOYEE_PROVISIONED",
  // Announcements
  ANNOUNCEMENT_CREATED: "ANNOUNCEMENT_CREATED",
  ANNOUNCEMENT_DELETED: "ANNOUNCEMENT_DELETED",
  // Leave
  LEAVE_REQUEST_SUBMITTED: "LEAVE_REQUEST_SUBMITTED",
  LEAVE_REQUEST_APPROVED: "LEAVE_REQUEST_APPROVED",
  LEAVE_REQUEST_REJECTED: "LEAVE_REQUEST_REJECTED",
  // Attendance
  ATTENDANCE_MANUAL_CHECK_IN: "ATTENDANCE_MANUAL_CHECK_IN",
  ATTENDANCE_MANUAL_CHECK_OUT: "ATTENDANCE_MANUAL_CHECK_OUT",
  ATTENDANCE_EVENT_REVIEWED: "ATTENDANCE_EVENT_REVIEWED",
  ATTENDANCE_DAY_ADJUSTED: "ATTENDANCE_DAY_ADJUSTED",
  // Settings
  COMPANY_SETTINGS_UPDATED: "COMPANY_SETTINGS_UPDATED",
} as const;

export type RealtimeEventTypeKey = keyof typeof RealtimeEventType;
```

---

## 5. Expo (React Native) Integration

### 5.1 Dependencies

```bash
npx expo install @stomp/stompjs
# SockJS is not available in React Native — use native WebSocket directly
```

React Native's `WebSocket` global is STOMP-compatible. Do **not** install or import `sockjs-client`.

### 5.2 STOMP Client Setup

```typescript
// lib/realtimeClient.ts
import { Client } from "@stomp/stompjs";

let stompClient: Client | null = null;

export function connectRealtime(
  apiBaseUrl: string,
  token: string,
  onConnected: (client: Client) => void,
  onDisconnected?: () => void
): Client {
  // React Native uses native WebSocket — append /websocket to bypass SockJS handshake
  const wsUrl = `${apiBaseUrl.replace(/^http/, "ws")}/ws/websocket`;

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => onConnected(client),
    onDisconnect: () => onDisconnected?.(),
    onStompError: (frame) => {
      console.error("[STOMP]", frame.headers["message"]);
    },
  });

  client.activate();
  stompClient = client;
  return client;
}

export function disconnectRealtime(): void {
  stompClient?.deactivate();
  stompClient = null;
}
```

### 5.3 React Native Hook

```typescript
// hooks/useCompanyTopic.ts
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { RealtimeEventEnvelope } from "../types/realtime";

export function useCompanyTopic(
  apiBaseUrl: string,
  token: string | null,
  companyId: string | null,
  resource: string,
  onMessage: (envelope: RealtimeEventEnvelope) => void
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token || !companyId) return;

    const wsUrl = `${apiBaseUrl.replace(/^http/, "ws")}/ws/websocket`;

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/companies/${companyId}/${resource}`,
          (msg) => {
            try {
              onMessage(JSON.parse(msg.body));
            } catch {
              console.warn("[STOMP] Unparseable message", msg.body);
            }
          }
        );
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [token, companyId, resource]);
}
```

### 5.4 Announcement Screen Example

```typescript
// screens/AnnouncementsScreen.tsx
import { useEffect, useState } from "react";
import { useCompanyTopic } from "../hooks/useCompanyTopic";
import { RealtimeEventType, RealtimeEventEnvelope } from "../types/realtime";

export function AnnouncementsScreen({ token, companyId, apiBaseUrl }) {
  const [announcements, setAnnouncements] = useState([]);

  useCompanyTopic(apiBaseUrl, token, companyId, "announcements", (envelope: RealtimeEventEnvelope) => {
    if (envelope.type === RealtimeEventType.ANNOUNCEMENT_CREATED) {
      setAnnouncements((prev) => [envelope.payload, ...prev]);
    } else if (envelope.type === RealtimeEventType.ANNOUNCEMENT_DELETED) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== envelope.entityId));
    }
  });

  // ... rest of component
}
```

### 5.5 Personal Notifications (Leave Decisions)

```typescript
// Employee receives approval/rejection on their personal queue
client.subscribe("/user/queue/notifications", (msg) => {
  const envelope: RealtimeEventEnvelope = JSON.parse(msg.body);
  if (envelope.type === RealtimeEventType.LEAVE_REQUEST_APPROVED) {
    showToast("Your leave request was approved!");
    // refresh leave balance
  } else if (envelope.type === RealtimeEventType.LEAVE_REQUEST_REJECTED) {
    showToast(`Leave request rejected: ${(envelope.payload as any).rejectionReason}`);
  }
});
```

---

## 6. Deduplication & Idempotency

Events may be replayed if the client reconnects. Use `eventId` (UUID) to deduplicate:

```typescript
const seenEventIds = new Set<string>();

function handleEnvelope(envelope: RealtimeEventEnvelope) {
  if (seenEventIds.has(envelope.eventId)) return;
  seenEventIds.add(envelope.eventId);
  // process event...
}
```

Clear `seenEventIds` on reconnect after a full REST re-fetch to prevent unbounded growth.

---

## 7. Reconnection & State Sync Strategy

WebSocket events are **supplemental** — the REST API is authoritative. On reconnect:

1. Re-fetch the relevant resource list via REST (e.g., `GET /api/departments`).
2. Re-subscribe to the STOMP topics.
3. Apply any incoming events on top of the freshly fetched state.

The `@stomp/stompjs` client reconnects automatically (after `reconnectDelay` ms) and re-runs the `onConnect` callback, which re-subscribes. No manual reconnect logic is needed.

---

## 8. Error Handling

| Scenario                          | Client behavior                                              |
|-----------------------------------|--------------------------------------------------------------|
| Invalid JWT at CONNECT            | Server sends STOMP ERROR frame; client fires `onStompError` |
| Insufficient role at SUBSCRIBE    | Server sends STOMP ERROR frame for that subscription only    |
| Wrong company in topic            | Server sends STOMP ERROR frame; subscription rejected        |
| Server-side WebSocket broker down | Events silently dropped (REST responses unaffected)          |
| Network drop                      | Client auto-reconnects per `reconnectDelay`                  |

**Do not** treat absence of WebSocket events as an error — the REST API is always the source of truth.

---

## 9. Environment Variables

| Variable                              | Default                                        | Notes                              |
|---------------------------------------|------------------------------------------------|------------------------------------|
| `APP_REALTIME_WEBSOCKET_ENDPOINT`     | `/ws`                                          | Override for custom path           |
| `APP_REALTIME_ALLOWED_ORIGIN_PATTERNS`| `http://localhost:*,exp://localhost:*,...`      | Comma-separated CORS patterns      |
| `APP_REALTIME_BROKER_SIMPLE_ENABLED`  | `true`                                         | Set to `false` with external broker (RabbitMQ/Redis) |

---

## 10. Sequence Diagrams

### Leave Request Lifecycle

```
Employee (Expo)                API                    Admin (Next.js)
     |                          |                           |
     |-- POST /leave/request -->|                           |
     |                          |-- AFTER_COMMIT emit ----->|
     |                          |   /topic/.../leave-requests (SUBMITTED)
     |                          |                           |
     |                         (admin reviews)              |
     |                          |<-- POST /leave/{id}/approve|
     |<-- /user/queue/notifications (APPROVED)              |
     |                          |-- AFTER_COMMIT emit ----->|
     |                          |   /topic/.../leave-requests (APPROVED)
```

### Announcement Delivery

```
Admin (Next.js)                API               Employee (Expo)
     |                          |                     |
     |-- POST /announcements -->|                     |
     |                          |-- AFTER_COMMIT ----->|
     |<-- emit: CREATED --------|   /topic/.../announcements (CREATED)
     |  (admin list updates)    |---------------------| (badge increments)
```
