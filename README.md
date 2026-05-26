# Keuangan Desa (Village Finance Management System)

[![Monorepo: Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-0070f3?logo=turborepo)](https://turbo.build/)
[![Package Manager: pnpm](https://img.shields.io/badge/PackageManager-pnpm-f69220?logo=pnpm)](https://pnpm.io/)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?logo=nestjs)](https://nestjs.com/)
[![Database: Prisma + MySQL](https://img.shields.io/badge/Database-Prisma_--_MySQL-0c344b?logo=prisma)](https://prisma.io)
[![Frontend: Vue 3](https://img.shields.io/badge/Frontend-Vue_3-4fc08d?logo=vue.js)](https://vuejs.org/)
[![UI: PrimeVue 4](https://img.shields.io/badge/UI_Library-PrimeVue_4-10b981?logo=primevue)](https://primevue.org/)
[![Styling: Tailwind CSS 4](https://img.shields.io/badge/Styling-Tailwind_CSS_4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

**Keuangan Desa** is a modern, multi-tenant village finance management system designed to streamline financial tracking, resident dues management, budgeting, and accountability reporting. Built as a full-stack TypeScript monorepo, it offers a robust backend powered by NestJS and Prisma (MySQL), combined with a sleek, performant frontend using Vue 3, Tailwind CSS 4, and PrimeVue 4.

---

## 🚀 Key Features

*   🏢 **Multi-Tenant Architecture**: Complete data isolation between different village/community entities (Tenants). Custom settings per tenant, such as WhatsApp receipt templates and PDF header configurations.
*   🔐 **Role-Based Access Control (RBAC)**: Secure access management with roles and custom granular permissions (e.g., Administrator, Bendahara, Warga).
*   👥 **Resident (Warga) Management**: Easily track residents, their residency statuses (`PEMILIK`, `KONTRAK`, `KOSONG`), and active flags.
*   💳 **Fee (Iuran) Tracking & Billing**:
    *   Flexible billing periods (`BULANAN`, `TAHUNAN`, `INSIDENTAL`).
    *   Custom individual monthly fee amounts per resident.
    *   Tracking of multi-month and multi-year payments with clear invoice logging.
*   💰 **Treasury & Cash Accounts (Kas)**: Manage multiple cash/bank accounts and track real-time balances for each account.
*   📈 **Transactions Management**: Complete ledger for income (`PEMASUKAN`) and expenses (`PENGELUARAN`) with support for attachments (receipts/invoices).
*   🚧 **Project Management (Proyek & Kegiatan)**:
    *   Track budgets and costs for specific village projects/activities.
    *   Manage project phases: Planning (`PERENCANAAN`), Ongoing (`BERJALAN`), and Completed (`SELESAI`).
*   📝 **Audit Log System**: Enterprise-grade security trails capturing user actions, timestamps, and IP addresses to maintain transparency.

---

## 🛠️ Tech Stack & Architecture

### Repository Structure
This repository is configured as a monorepo using **pnpm workspaces** and managed via **Turborepo** for optimized builds and caching:

```
├── apps
│   ├── api              # NestJS backend application
│   └── web              # Vue 3 + Vite frontend application
└── packages
    └── tsconfig         # Shared TypeScript configuration packages
```

### Backend (`apps/api`)
*   **Framework**: [NestJS 11](https://nestjs.com/) (Modular architecture, DI, Controllers, Services, Guards)
*   **Database ORM**: [Prisma Client](https://www.prisma.io/) (MySQL)
*   **Authentication**: [Passport.js](http://www.passportjs.org/) + [JWT](https://jwt.io/) strategy
*   **Validation**: `class-validator` and `class-transformer` for reliable payload checking
*   **Security**: [Helmet](https://helmetjs.github.io/) headers configured

### Frontend (`apps/web`)
*   **Framework**: [Vue 3](https://vuejs.org/) (Single File Components with `<script setup>` and Composition API)
*   **Build Tool**: [Vite 8](https://vite.dev/)
*   **UI Components**: [PrimeVue 4](https://primevue.org/) using the premium Aura theme
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with `tailwindcss-primeui` integration
*   **State Management**: [Pinia](https://pinia.vuejs.org/)
*   **Data Visualization**: [Chart.js](https://www.chartjs.org/)

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [pnpm](https://pnpm.io/) (v9+)
*   [MySQL Database](https://www.mysql.com/)

### Installation & Setup

1.  **Clone the repository** and navigate into it:
    ```bash
    git clone https://github.com/your-username/keuangan-desa.git
    cd keuangan-desa
    ```

2.  **Install dependencies** using pnpm:
    ```bash
    pnpm install
    ```

3.  **Environment Variables Configuration**:
    *   **Backend (`apps/api/.env`)**:
        Copy the example environment file and configure your database connection and JWT secret:
        ```bash
        cp apps/api/.env.example apps/api/.env
        ```
        Edit `apps/api/.env`:
        ```env
        DATABASE_URL="mysql://username:password@localhost:3306/keuangan_desa"
        JWT_SECRET="your_jwt_secret_key_here"
        ```

    *   **Frontend (`apps/web/.env`)**:
        Copy the example environment file:
        ```bash
        cp apps/web/.env.example apps/web/.env
        ```
        Edit `apps/web/.env`:
        ```env
        VITE_API_URL="http://localhost:3000"
        ```

4.  **Database Migration & Seeding**:
    Generate the Prisma client, run database migrations to create the tables, and seed the initial roles, permissions, and tenant data:
    ```bash
    cd apps/api
    npx prisma migrate dev
    npx prisma db seed
    cd ../..
    ```

---

## 💻 Running the App

Run tasks across all workspaces in parallel using Turborepo from the root directory:

### Development Mode
Runs both the NestJS API and Vue 3 dev servers with hot reloading enabled:
```bash
pnpm dev
```

### Running Specific Workspaces
If you want to run only one application:

*   **Run Backend Only**:
    ```bash
    pnpm --filter api dev
    ```
*   **Run Frontend Only**:
    ```bash
    pnpm --filter web dev
    ```

---

## 🧪 Testing & Code Quality

### Testing
Run tests defined in individual workspaces:
*   **Run Backend Unit Tests**:
    ```bash
    pnpm --filter api test
    ```
*   **Run Backend E2E Tests**:
    ```bash
    pnpm --filter api test:e2e
    ```
*   **Run Backend Test Coverage**:
    ```bash
    pnpm --filter api test:cov
    ```

### Code Formatting & Linting
Ensure lint checks and Prettier formatting are clean:
```bash
# Lint the whole codebase
pnpm lint

# Format code in frontend
pnpm --filter web format

# Format code in backend
pnpm --filter api format
```

---

## 📄 License

This project is [UNLICENSED](LICENSE). Feel free to use and modify for personal or localized village deployments.
