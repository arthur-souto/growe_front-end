# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check and build for production
npm run lint         # Run ESLint
npm run format       # Format all TS/TSX files with Prettier
npm run typecheck    # Type-check without emitting
```

To add a shadcn/ui component:
```bash
npx shadcn@latest add <component-name>
```

## Architecture

React 19 + TypeScript SPA built with Vite, React Router v7, Tailwind CSS v4, and shadcn/ui.

### Path alias

`@/` maps to `src/`. Use it for all internal imports.

### Auth flow

Auth state lives in `AuthContext` (context + provider pattern). The `useUser` hook reads/writes from the context; `useAuth` wraps `useUser` and adds side effects: on mount it calls `GET /users/me` to hydrate the session, redirects to `/sign-in` on failure, and exposes `login`/`logout` helpers.

`home-layout.tsx` calls `useAuth` to guard protected routes — it shows a spinner while loading and only renders the layout once the session is resolved.

### API layer

`src/api/instance.ts` — a single shared Axios instance configured with `VITE_API_BASE_URL`, a 10 s timeout, `withCredentials: true` (cookie-based auth), and a response interceptor that redirects to `/sign-in` on any 401 (except `/users/me`, which is handled by `useAuth` instead).

`src/api/services/` — class-based services (e.g. `AuthService`) that wrap the instance. Instantiate and export a singleton from each service file.

### Navigation service

`src/api/services/navigation-service.ts` exposes a singleton `navigationService` that holds a reference to React Router's `navigate` function. `root-layout.tsx` registers the navigator on mount so that non-component code (e.g. the Axios interceptor) can trigger navigation imperatively.

### Route structure

```
/                   → redirects to /sign-in
/sign-in            → auth page
/home               → home-layout (guarded, has Header)
  /home             → home feature
  /home/companies   → companies feature
```

All route components are lazy-loaded. New feature pages go under `src/features/<feature>/` and are registered in `src/routes.tsx`.

### Shared types

`src/shared/model.ts` — domain-level types (`User`, `InfoHeaderUser`, `Role`). API request/response shapes live in `src/api/model.ts`.

## Backend API

Base URL: `http://localhost:8080/api/v1` (set via `VITE_API_BASE_URL`).  
Swagger UI: `http://localhost:8080/swagger-ui/index.html#/`  
OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Auth uses **cookie-based sessions** (`withCredentials: true`); the Swagger spec also declares bearer JWT but the frontend relies on cookies.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sign-in` | Sign in → `SignInResponse` |
| POST | `/auth/logout` | Invalidate session |
| POST | `/users/sign-up` | Register new user → `SignUpResponse` |
| GET | `/users/me` | Current user session → `UserDetailsResponse` |
| POST | `/companies/create-company` | Create a company → `CreateCompanyResponse` |
| GET | `/companies/my-companies` | Paginated list of owned companies |

### Key schemas

**SignInRequest / SignUpRequest**
```ts
{ email: string; password: string }                          // sign-in
{ fullName: string; email: string; password: string; profileImage?: string } // sign-up
```

**CreateCompanyRequest**
```ts
{
  name: string          // max 200 chars
  cnpj: string          // 14 digits
  sizeRange: "ONE_TO_10" | "ELEVEN_TO_50" | "FIFTY_ONE_TO_200" | "TWO_HUNDRED_PLUS"
  plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE"
  companyImage?: string
}
```

**UserDetailsResponse** (from `GET /users/me`)
```ts
{
  id: string (uuid); fullName: string; email: string
  role: "ADMIN" | "EMPLOYEE" | "RH" | "MANAGER" | "GUEST"
  active: boolean; profileImage?: string
  lastLoginAt: string; createdAt: string; updatedAt: string
}
```

`GET /companies/my-companies` accepts standard Spring `Pageable` query params: `page`, `size`, `sort`.
