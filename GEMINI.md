# Project Overview: Keuangan Desa (Village Finance)

A multi-tenant village finance management system built with a modern full-stack monorepo architecture.

## Architecture & Technologies

- **Monorepo**: Managed with [Turbo](https://turbo.build/) and [pnpm](https://pnpm.io/).
- **Backend (`apps/api`)**:
    - Framework: [NestJS](https://nestjs.com/)
    - Database ORM: [Prisma](https://www.prisma.io/) (MySQL)
    - Authentication: Passport.js with JWT
- **Frontend (`apps/web`)**:
    - Framework: [Vue 3](https://vuejs.org/) (SFC with `<script setup>`)
    - Build Tool: [Vite](https://vitejs.dev/)
    - UI Components: [PrimeVue 4](https://primevue.org/) (Aura theme)
    - Styling: [Tailwind CSS 4](https://tailwindcss.com/)
    - State Management: [Pinia](https://pinia.vuejs.org/)
    - Icons: [PrimeIcons](https://primeicons.org/)

## Core Business Logic (Data Model)

The system is multi-tenant and manages:
- **Tenants**: Independent village/community entities.
- **Users & Roles**: RBAC (Role-Based Access Control) system.
- **Warga (Residents)**: Management of residents and their house status.
- **Iuran (Fees/Dues)**: Monthly and incidental fee management.
- **Kas & Transactions**: Income and expense tracking with cash account management.
- **Proyek (Projects)**: Budget tracking for specific village activities.

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- pnpm (v9+)
- MySQL Database

### Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure environment variables:
   - Copy `apps/api/.env.example` to `apps/api/.env` and configure `DATABASE_URL` and `JWT_SECRET`.
   - Copy `apps/web/.env.example` to `apps/web/.env` and configure `VITE_API_URL`.

3. Database Migration:
   ```bash
   cd apps/api
   npx prisma migrate dev
   npx prisma db seed
   ```

### Development
Run the whole monorepo in development mode:
```bash
pnpm dev
```

Run specific apps:
```bash
pnpm --filter api dev
pnpm --filter web dev
```

### Testing
```bash
pnpm --filter api test
```

## Development Conventions

### API (NestJS)
- Follow standard NestJS modular architecture.
- Use Prisma Service for database operations.
- Controllers should handle requests, Services should handle business logic.
- DTOs (Data Transfer Objects) should be used for request validation (TODO: implement class-validator if not already present).

### Web (Vue)
- Use Composition API with `<script setup>`.
- Prefer PrimeVue components for UI elements.
- Use Pinia stores for global state (e.g., `auth.ts`, `finance.ts`).
- Follow the existing module-based structure in `src/modules/`.

### Design Integration
- The project includes support for `.pen` design files via the Pencil MCP.
- Design files should be used as the source of truth for UI layouts and themes.
