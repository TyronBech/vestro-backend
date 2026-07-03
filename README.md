# Vestro Backend — Poverty Firewall System Engine

This is the backend engine for **Vestro**, a financial management application built around the **Poverty Firewall** philosophy. The backend organizes and manages user budgeting configurations, credit card statement cycles, structured cash-flow routing trees, and automated notification schedules.

---

## Architecture & Design Philosophy

The backend strictly enforces a **4-Layer Clean / Hexagonal Architecture** with inward-pointing dependencies. This ensures that the core domain logic remains completely decoupled from external frameworks, libraries, database drivers, and network layers.

```
                  ┌─────────────────────────────────────────┐
                  │            Presentation Layer           │
                  │        (Routes, Controllers, Zod)       │
                  └────────────────────┬────────────────────┘
                                       │ (Calls)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │              Service Layer              │
                  │            (Business Logic)             │
                  └────────────────────┬────────────────────┘
                                       │ (Interfaces)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │               Domain Layer              │
                  │       (Pure TS Entity Interfaces)       │
                  └────────────────────▲────────────────────┘
                                       │ (Implements)
                  ┌────────────────────┴────────────────────┐
                  │           Infrastructure Layer          │
                  │            (Prisma Repositories)        │
                  └─────────────────────────────────────────┘
```

### The 4 Layers
1. **Domain (`src/domain/`)**: Pure TypeScript interfaces and definitions. The domain has zero external dependencies (no Express, no Prisma, no third-party libraries).
2. **Infrastructure (`src/infrastructure/`)**: Implements the domain repository interfaces. This is the **only** layer allowed to import or interact with the database client (Prisma Client).
3. **Services (`src/services/`)**: The core brain of Vestro. Services contain all business rules and operations. They must **never** import or call the Prisma Client directly; instead, they instantiate and interact with the Repository adapters in the Infrastructure layer.
4. **Presentation (`src/presentation/`)**: Receives incoming HTTP requests via Express. It strictly validates payloads using Zod schemas, delegates the task to the Service layer, and formats the output into standard JSON responses.

### Architectural Rules
* **The Result Pattern:** Services do not throw runtime exceptions for expected failure states (e.g. `USER_NOT_FOUND`). Instead, they return a typed `Result<T, E>` interface (`ok(value)` or `err(error_code)`). Presentation controllers analyze the result and return the corresponding HTTP response.
* **The Cents Rule (Money Architecture):** To eliminate floating-point precision errors, all currencies are processed and stored in the database as pure integers representing **cents** (e.g., ₱182.50 is stored as `18250`). Money is multiplied by 100 on the way in and divided by 100 on the way out.
* **Structured Logging:** Every API request, background job, and error is tracked via a centralized logger (`src/utils/logger.ts`) writing daily-rotating logs.

---

## Key Features & Functionalities

### 1. Identity & Security
* **Authentication:** Email-password authentication with JWT-based session tokens (15-minute expiry).
* **Two-Factor Authentication (2FA):** Integrated Google Authenticator / TOTP QR code generation and validation.
* **Biometrics Key Verification:** Supports mobile FaceID/Fingerprint logins. The backend stores a hashed biometric key (`biometricKeyHash` using bcrypt) corresponding to the private keys stored in the device's secure enclave.
* **Panic Mode (Shake-to-Lock):** Allows instant session invalidation and lockdown on the database level if the device is shaken.

### 2. The Poverty Firewall (Budgeting)
* **Baseline Allocation:** Supports setting baseline net salaries and allocating them automatically using the classic 50-30-10-10 rule (50% Needs, 30% Wants, 10% Savings, 10% Investments).

### 3. Credit Card Billing Cycle Tracker
* **Unbilled & Statement Tracking:** Keeps track of current unbilled card spend, statement cutoff days, and payment due days.
* **Mid-Cycle Payments:** Computes statement balances dynamically and handles partial payments made mid-cycle to lower overall statements.

### 4. Cash Routing Tree (Core Network)
* **Node Hierarchy:** Financial routers are structured as a hierarchical self-referencing tree (nodes can have parent nodes and child nodes, e.g., "Payroll Catch" -> "Emergency Fund").
* **Type-Based Vaults:** Categorizes nodes by financial purpose (Rent, Utilities, Wants Sandbox, Savings Vault, Paycheck, etc.).
* **Dynamic Cashflow Logs:** Records every inflow and outflow transaction occurring inside a routing node.

### 5. Sinking Fund Sweeps
* **Sweep:** Leftover funds in the "Wants Sandbox" can be swept out manually.
* **Audit Trails:** Tracks all historical sweeps via detailed Sweep Logs.

### 6. Scheduler Services
* **Cron Jobs:** Uses `node-cron` to execute daily background operations:
  * Checking credit card payment due dates and scheduling push notification warnings.
  * Initiating automated budget sweeps.
  * Inactivity checks and session lockouts.

### 7. Mobile Push Notifications
* **Expo Push Integration:** Integrates with the Expo Server SDK to send target push notifications to registered user devices.

---

## Directory Structure

```
vestro-backend/
├── .github/workflows/    # CI/CD deployment pipelines
├── prisma/
│   ├── schema.prisma     # Prisma DB Schema (PostgreSQL)
│   └── seed.ts           # Development database seeder
├── src/
│   ├── app.ts            # Express application setup
│   ├── server.ts         # Server startup entrypoint
│   ├── config/           # App configuration and environment validation
│   ├── domain/           # Hexagonal Domain layer (Repository interfaces)
│   ├── infrastructure/   # Infrastructure adapters (Prisma DB repositories)
│   ├── services/         # Service layer (Business Logic)
│   ├── presentation/     # Controllers, routers, middlewares, and Zod schemas
│   └── utils/            # Shared utilities (Result type, Logger, 2FA, QR Code)
├── tests/                # Automated Jest testing files
├── package.json          # Dependency configurations
└── tsconfig.json         # TypeScript configuration
```
