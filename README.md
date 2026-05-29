# Ekinnow Backend

[![CI](https://github.com/ekin-now/backend/actions/workflows/ci.yml/badge.svg)](https://github.com/ekin-now/backend/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)

REST API built with NestJS, TypeORM, and PostgreSQL (Supabase). Handles user management and JWT authentication.

## Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL via Supabase (TypeORM)
- **Auth**: JWT + Passport (local strategy)
- **Validation**: class-validator
- **Testing**: Jest
- **CI**: GitHub Actions + SonarCloud

## Prerequisites

- Node.js 22+
- npm 10+
- A [Supabase](https://supabase.com) project

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
# Supabase Session Pooler (Settings → Database → Connection pooling → Session mode)
DB_HOST=aws-0-<region>.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=your-password
DB_NAME=postgres
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false   # false for local dev with Supabase pooler

JWT_SECRET=your-secret-key         # use a long random string in production
JWT_EXPIRES_IN=7d
```

> **Note:** Use the **Session Pooler** host from Supabase, not the direct connection. The direct connection uses IPv6 which may not be reachable from all networks.

### 3. Run database migrations

```bash
npm run migration:run
```

### 4. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

API runs at `http://localhost:3000`.

## API Endpoints

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | `{ email, password }` | Returns JWT token |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users` | No | Create user |
| `GET` | `/users` | No | List all users |
| `GET` | `/users/:id` | No | Get user by ID |

### Protected route example

```http
GET /users
Authorization: Bearer <access_token>
```

## Database Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npx tsc --noEmit
```

CI runs on every PR to `main`: lint → type check → tests → SonarCloud analysis.

## Project Structure

```
src/
├── auth/
│   ├── dto/           # LoginDto
│   ├── guards/        # JwtAuthGuard, LocalAuthGuard
│   ├── strategies/    # jwt.strategy, local.strategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── database/
│   ├── migrations/    # TypeORM migrations
│   └── data-source.ts # TypeORM CLI config
└── users/
    ├── controller/
    ├── dto/           # CreateUserDto
    ├── entities/      # User entity
    ├── service/
    └── users.module.ts
```
