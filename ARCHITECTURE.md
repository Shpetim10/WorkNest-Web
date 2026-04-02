# WorkNest Frontend Architecture Guide

This project follows a **Feature-Modular Architecture** for Next.js 17+ (App Router). The goal is maximum scalability, strict separation of concerns, and alignment with our Spring Boot backend.

---

## 🏗️ Core Structure

All source code lives in the `src/` directory to isolate business logic from configuration files.

### 1. `src/app/` — [Composition Layer]
Responsible for **Routing, Layouts, and Page Metadata**.
- **Rule**: Pages should be lean. They only "glue" together components from the `features/` layer.
- **Route Groups**: We use `(auth)`, `(dashboard)`, etc., to group routes logically without affecting the URL structure.
- **Middleware**: Handles high-level auth guards and role-based redirects.

### 2. `src/features/` — [Business Layer]
This is where the domain-specific logic lives. Each domain (e.g., `auth`, `employees`, `attendance`) is a self-contained module.

**Internal Module Structure:**
- `api/`: TanStack Query hooks (e.g., `useEmployees`) and Axios calls.
- `components/`: Feature-specific UI (e.g., `EmployeeListTable`).
- `hooks/`: Business logic hooks (e.g., `useEmployeeFilter`).
- `types/`: DTOs that precisely mirror the Spring Boot backend contracts.
- `index.ts`: The **Public API**. Only export what the rest of the app needs. **Never cross-import internals from other features.**

### 3. `src/common/` — [Platform Layer]
Truly shared code used across multiple features.
- `ui/`: Design System (Shadcn/UI wrappers, Buttons, Modals).
- `network/`: Axios instance, interceptors for JWT, and Multi-tenancy context.
- `providers/`: Global React Context (QueryClient, Auth, Theme).
- `hooks/`: Generic utility hooks (e.g., `useDebounce`).
- `utils/`: Platform-wide helpers (date-fns, formatting).
- `types/`: Global API types (e.g., `ApiErrorResponse`, `PaginatedResponse`).

---

## 🔄 Development Workflow

### Adding a New Feature
1. Create `src/features/[feature-name]`.
2. Define DTOs in `types/`.
3. Implement API hooks in `api/` using `apiClient`.
4. Build the UI in `components/`.
5. Export the main components/hooks in `index.ts`.
6. Consume in `src/app/[route]/page.tsx`.

### Data Fetching (TanStack Query)
- **Queries**: Used for any GET requests.
- **Mutations**: Used for POST/PUT/PATCH/DELETE.
- **Query Keys**: Use a centralized object (e.g., `employeeKeys`) within the feature's `api/` to manage cache invalidation consistently.

### UI & Styling
- **Base Components**: Use Shadcn/UI for consistent visuals.
- **Custom Styling**: Tailwind CSS (v4) utility classes only. Avoid inline styles or CSS modules unless strictly necessary.

---

## 🔧 Tech Stack
- **Framework**: Next.js 17 (App Router, Server Components)
- **Data Fetching**: TanStack Query v5 + Axios
- **State Management**: Zustand (Client-only state)
- **UI Library**: Shadcn/UI (Radix UI + Tailwind)
- **Validation**: Zod (For DTO and Form validation)

---

## 🚫 Things to Avoid
1. **No "Global" Component folder**: If a component is specific to one domain (e.g., `AttendanceCalendar`), it MUST live in `features/attendance/components`.
2. **No Deep Nesting**: Keep the folder structure flat where possible.
3. **No Direct Feature-to-Feature imports**: If Feature A needs data from Feature B, define a shared interface in `common/types` or communicate via a high-level `common` service/hook.
