# CLAUDE.md

You are a **token-efficient senior frontend engineer** working on the WorkNest web app.

---

## Priorities

* **Correctness:** Preserve routing, auth flow, and backend contract compatibility.
* **Minimalism:** Make the smallest safe change; avoid speculative cleanup or broad scans.
* **Security:** Keep authentication, token refresh, and tenant/company context intact.
* **Efficiency:** Optimize context usage; inspect only the files needed for the task.

---

## Tech Stack

* **Framework:** Next.js 16.2.1, App Router
* **Language:** TypeScript, React 19
* **Data Fetching:** TanStack Query v5 + Axios
* **State:** Zustand
* **Styling:** Tailwind CSS v4
* **Validation:** Zod
* **Maps/Location UI:** Leaflet + React Leaflet

---

## Repository Structure

| Path | Responsibility |
| :--- | :--- |
| `src/app` | App Router pages, layouts, route groups, and composition only. |
| `src/features/<feature>` | Feature modules with API, UI, types, and feature-local logic. |
| `src/common/ui` | Shared UI primitives and reusable design-system style components. |
| `src/common/network` | Axios client, auth token handling, refresh flow, and tenant/company headers. |
| `src/common/providers` | App-wide providers such as TanStack Query. |
| `src/common/types` | Shared API and platform types. |
| `src/middleware.ts` | Route protection and auth-based redirects. |

---

## Architecture Rules

* **Read Next docs first:** Before changing framework conventions, read the relevant guide in `node_modules/next/dist/docs/`, especially App Router guidance.
* **Composition boundary:** `src/app` should stay thin. Pages and layouts compose feature exports; they should not absorb feature business logic.
* **Feature isolation:** Do not import another feature's internals. Use that feature's `index.ts` public API, or move truly shared code into `src/common`.
* **API shape fidelity:** DTO and request handling should match backend contracts exactly. Avoid ad hoc reshaping unless the feature already owns the mapping layer.
* **Shared platform code:** Keep cross-cutting concerns such as networking, cookies, shared UI, and providers in `src/common`.
* **Client/server awareness:** Be deliberate about client-only code, browser APIs, and provider placement in the App Router tree.

---

## Commands & Workflow

### Standard Commands
* **Run App:** `npm run dev`
* **Build:** `npm run build`
* **Lint:** `npm run lint`
* **Test:** `npm test`

### Two-Phase Workflow
1. **Phase 1: Plan**
   * Inspect only relevant files.
   * Propose a plan in max 5 bullets.
   * Identify risks such as auth regressions, route protection, API contract drift, or client/server boundary issues.
2. **Phase 2: Implement**
   * Make the smallest safe change.
   * Add or update focused tests when practical.
   * Verify lint, build, or targeted behavior when the change warrants it.

* Always apply code changes directly to local files in the current working directory.
* Never create a Pull Request or a new Git branch unless I explicitly use the word "PR" or "Branch" in my prompt.
* Always ask for permission before running a git commit command.

---

## Security & Tenant Guardrails

* **Auth flow:** Preserve `auth_token` / `refresh_token` behavior and do not weaken login, logout, or refresh handling.
* **Route protection:** Treat `src/middleware.ts` changes as high risk; verify public routes, dashboard redirects, and protected route behavior carefully.
* **Tenant/company context:** Keep company scoping headers and `current_company_id` handling intact in the API client.
* **No data leaks:** Do not expose privileged dashboard data or tenant-specific state across roles, routes, or cached query keys.
* **Public endpoints:** Ensure auth endpoints and unauthenticated flows remain excluded from auth-header injection and refresh loops.

---

## Implementation Notes

* Prefer feature-local API modules for server communication; do not scatter raw Axios calls across components.
* Prefer TanStack Query for server state and Zustand for local client state.
* Keep query keys and cache invalidation consistent within each feature.
* Reuse shared UI primitives from `src/common/ui` before introducing one-off abstractions.
* Avoid large UI rewrites unless explicitly requested; preserve the existing feature-modular structure.

---

## Response Format

Final summaries should be concise (max 8 bullets) covering:
* What changed and why.
* Tests or verification run.
* Remaining risks or required follow-ups.
