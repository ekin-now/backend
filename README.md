# Ekinnow Backend

[![CI](https://github.com/ekin-now/backend/actions/workflows/ci.yml/badge.svg)](https://github.com/ekin-now/backend/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ekin-now_backend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ekin-now_backend)

REST API built with NestJS, TypeORM, and PostgreSQL (Supabase). Handles user management, JWT authentication, companies, sport events, and a social timeline (posts, follows, likes, comments).

## Tech Stack

- **Framework**: NestJS v11 + TypeScript
- **Database**: PostgreSQL via Supabase (TypeORM)
- **Auth**: JWT + Passport (local strategy)
- **Validation**: class-validator
- **Storage**: Cloudflare R2 (S3-compatible)
- **Docs**: Swagger / OpenAPI (`/api`)
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
Swagger UI at `http://localhost:3000/api`.

## Roles

| Role | Description |
|------|-------------|
| `PARTICIPANT` | Regular user |
| `COMPANY_STAFF` | Staff member of a company |
| `COMPANY_ADMIN` | Admin of a company — manages that company's data |
| `SUPER_ADMIN` | Full access to all resources |

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | No | Returns JWT token |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users` | No | Register new user |
| `GET` | `/users` | No | List all users |
| `GET` | `/users/:id` | No | Get user by ID |
| `PATCH` | `/users/:id` | JWT (self or SUPER_ADMIN) | Update profile |

### Companies

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/company` | SUPER_ADMIN | Create company |
| `GET` | `/company` | No | List active companies |
| `GET` | `/company/:id` | No | Get company by ID |
| `PATCH` | `/company/:id` | SUPER_ADMIN or COMPANY_ADMIN (own) | Update company |
| `DELETE` | `/company/:id` | SUPER_ADMIN | Deactivate company |

### Sport Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/sport-events` | SUPER_ADMIN or COMPANY_ADMIN | Create sport event |
| `GET` | `/sport-events` | No | List published events (excludes DRAFT and CANCELLED) |
| `GET` | `/sport-events/:id` | No | Get event by ID |
| `PATCH` | `/sport-events/:id` | SUPER_ADMIN or COMPANY_ADMIN (own company) | Update event |
| `DELETE` | `/sport-events/:id` | SUPER_ADMIN | Cancel event |

> `COMPANY_ADMIN` can only create/update events belonging to their own company. `SUPER_ADMIN` must provide `companyId` in the request body when creating.

### Sport Sub-Events

Sub-events are nested under their parent sport event.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/sport-events/:eventId/sub-events` | SUPER_ADMIN or COMPANY_ADMIN | Create sub-event |
| `GET` | `/sport-events/:eventId/sub-events` | No | List sub-events (excludes DRAFT and CANCELLED) |
| `GET` | `/sport-events/:eventId/sub-events/:id` | No | Get sub-event by ID |
| `PATCH` | `/sport-events/:eventId/sub-events/:id` | SUPER_ADMIN or COMPANY_ADMIN | Update sub-event |
| `DELETE` | `/sport-events/:eventId/sub-events/:id` | SUPER_ADMIN | Cancel sub-event |

### Sport Event Filters

`GET /sport-events` accepts optional query params:

| Param | Type | Description |
|-------|------|-------------|
| `sportType` | string | Filter by sport type |
| `country` | string | Filter by country |
| `region` | string | Filter by region |
| `dateFrom` | ISO date | Events on or after this date |
| `dateTo` | ISO date | Events on or before this date |

`GET /sport-events/filter-options?country=España` returns distinct values for filter dropdowns.

### Sport Event Statuses

| Status | Description |
|--------|-------------|
| `DRAFT` | Not visible publicly |
| `PUBLISHED` | Visible, registration not yet open |
| `REGISTRATION_OPEN` | Open for registration |
| `REGISTRATION_CLOSED` | Registration ended |
| `IN_PROGRESS` | Event is happening |
| `FINISHED` | Event completed |
| `CANCELLED` | Soft-deleted, not visible publicly |

### Follows

All endpoints require JWT. Asymmetric follow model (Twitter-style).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/follows/:userId` | Follow a user (204) |
| `DELETE` | `/follows/:userId` | Unfollow a user (204) |
| `GET` | `/follows/followers` | My followers |
| `GET` | `/follows/following` | Users I follow |

### Posts & Timeline

All endpoints require JWT.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/posts/feed?page=1&limit=20` | Chronological feed (own posts + followed users) |
| `POST` | `/posts` | Create a post |
| `GET` | `/posts/:id` | Get post by ID |
| `DELETE` | `/posts/:id` | Delete own post (or SUPER_ADMIN) |
| `POST` | `/posts/:id/likes` | Like a post (idempotent, 204) |
| `DELETE` | `/posts/:id/likes` | Unlike a post (idempotent, 204) |
| `GET` | `/posts/:id/comments` | Get comments for a post |
| `POST` | `/posts/:id/comments` | Add a comment |
| `DELETE` | `/posts/:id/comments/:commentId` | Delete own comment (or SUPER_ADMIN) |

#### Post types

| `type` | Description |
|--------|-------------|
| `TEXT` | Plain text post |
| `IMAGE` | Text + `imageUrl` |
| `EVENT_REF` | References a `SportEvent` via `sportEventId` |
| `ACTIVITY` | Sport activity result with `activityData` (sport, distance, duration, pace, elevation) |

The `type` field is auto-inferred if not provided: `activityData` → `ACTIVITY`, `sportEventId` → `EVENT_REF`, `imageUrl` → `IMAGE`, otherwise `TEXT`.

Feed response includes `likesCount`, `commentsCount`, and `isLikedByMe` per post.

### Storage

All endpoints require JWT. Files are stored in Cloudflare R2.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/storage/upload?type=<type>` | JWT | Upload file (multipart/form-data) |
| `GET` | `/storage/presigned-url?type=<type>&contentType=<mime>` | JWT | Get pre-signed URL for direct client upload |
| `DELETE` | `/storage/*key` | SUPER_ADMIN or COMPANY_ADMIN | Delete file by key |

**Asset types and allowed MIME types:**

| `type` | Used in | Allowed MIME |
|--------|---------|--------------|
| `events` | `SportEvent.bannerUrl`, `logoUrl` | `image/jpeg`, `image/png`, `image/webp` |
| `sub-events` | `SportSubEvent.coverImageUrl` | `image/jpeg`, `image/png`, `image/webp` |
| `companies` | `Company.logoUrl`, `bannerUrl` | `image/jpeg`, `image/png`, `image/webp` |
| `users` | `User.avatarUrl` | `image/jpeg`, `image/png`, `image/webp` |
| `gpx` | `SportSubEvent.gpxUrl` | `application/gpx+xml`, `text/xml`, `application/xml` |

**Max file size:** 50 MB

## Seed Data

Populate the database with test users, companies, events, sub-events, follows, posts, likes, and comments:

```bash
npm run seed
```

Re-running the script is idempotent — it removes previous seed rows first.

**Test accounts** (password: `Ekinnow2026!`):

| Email | Role | Company |
|-------|------|---------|
| `admin@ekinnow.com` | SUPER_ADMIN | — |
| `admin@andalucia-trail.com` | COMPANY_ADMIN | Andalucía Trail Runners |
| `admin@cycling-euskadi.com` | COMPANY_ADMIN | Cycling Euskadi |
| `admin@triatlo-cat.com` | COMPANY_ADMIN | Club Triatlón Catalunya |
| `participant1@test.com` | PARTICIPANT | — |
| `participant2@test.com` | PARTICIPANT | — |
| `participant3@test.com` | PARTICIPANT | — |

`participant1@test.com` follows 4 users and has the richest timeline feed to test.

## Creating a Sport Event with Assets — Full Flow

End-to-end example of creating a sport event and a sub-event including image and GPX uploads.

### Step 1 — Upload event images (server-side)

```http
POST /storage/upload?type=events
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: banner.jpg
```
```json
{ "key": "events/a1b2c3.jpg", "url": "https://pub-xxx.r2.dev/events/a1b2c3.jpg" }
```

Repeat for the logo:

```http
POST /storage/upload?type=events
file: logo.png
```
```json
{ "key": "events/d4e5f6.png", "url": "https://pub-xxx.r2.dev/events/d4e5f6.png" }
```

### Step 2 — Create the SportEvent

```http
POST /sport-events
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "name": "Madrid Trail 2025",
  "shortDescription": "La mejor carrera de trail de la sierra de Madrid",
  "description": "Carrera de trail running por los mejores senderos de la sierra de Madrid. Tres distancias disponibles para todos los niveles.",
  "sportType": "trail",
  "eventDate": "2025-10-12T07:00:00.000Z",
  "registrationOpenAt": "2025-03-01T00:00:00.000Z",
  "registrationCloseAt": "2025-10-01T00:00:00.000Z",
  "country": "Spain",
  "region": "Community of Madrid",
  "city": "Manzanares el Real",
  "address": "Parque Regional de la Cuenca Alta del Manzanares",
  "latitude": 40.7198,
  "longitude": -3.8682,
  "bannerUrl": "https://pub-xxx.r2.dev/events/a1b2c3.jpg",
  "logoUrl": "https://pub-xxx.r2.dev/events/d4e5f6.png",
  "websiteUrl": "https://madridtrail2025.com",
  "rulesDocumentUrl": "https://madridtrail2025.com/reglamento.pdf",
  "featured": true,
  "companyId": "uuid-de-la-company"
}
```

Response includes the event `id` used in the next steps.

### Step 3 — Upload sub-event cover image

```http
POST /storage/upload?type=sub-events
Authorization: Bearer <token>
file: portada-42k.jpg
```
```json
{ "key": "sub-events/g7h8i9.jpg", "url": "https://pub-xxx.r2.dev/sub-events/g7h8i9.jpg" }
```

### Step 4 — Upload GPX via pre-signed URL (direct to R2, no server overhead)

```http
GET /storage/presigned-url?type=gpx&contentType=application/gpx+xml
Authorization: Bearer <token>
```
```json
{
  "key": "gpx/j1k2l3.gpx",
  "uploadUrl": "https://bucket.r2.cloudflarestorage.com/gpx/j1k2l3.gpx?X-Amz-Algorithm=...",
  "publicUrl": "https://pub-xxx.r2.dev/gpx/j1k2l3.gpx"
}
```

Then upload the file **directly to R2** — no NestJS involved:

```http
PUT <uploadUrl>
Content-Type: application/gpx+xml

<GPX file binary>
```

### Step 5 — Create the SportSubEvent

```http
POST /sport-events/<event-id>/sub-events
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "name": "Marathon 42K",
  "shortDescription": "Recorrido clásico de maratón por la sierra",
  "description": "42.195 km de puro trail con 1.800m de desnivel positivo. Salida desde el centro de Manzanares.",
  "distanceKm": 42.195,
  "elevationGainMeters": 1800,
  "capacity": 300,
  "price": 55.00,
  "currency": "EUR",
  "startDateTime": "2025-10-12T07:00:00.000Z",
  "timeLimitMinutes": 480,
  "minimumAge": 18,
  "gpxUrl": "https://pub-xxx.r2.dev/gpx/j1k2l3.gpx",
  "coverImageUrl": "https://pub-xxx.r2.dev/sub-events/g7h8i9.jpg",
  "bibNumberRequired": true,
  "bibStartNumber": 1,
  "bibEndNumber": 300,
  "registrationOpenAt": "2025-03-01T00:00:00.000Z",
  "registrationCloseAt": "2025-10-01T00:00:00.000Z"
}
```

### Upload flow summary

```
Images (small files)         Large files / GPX
──────────────────           ─────────────────────────────────────
POST /storage/upload    →    GET /storage/presigned-url
← { key, url }          →    ← { key, uploadUrl, publicUrl }
                        →    PUT <uploadUrl>  (direct to R2)
                        →    ← 200 OK from R2

PATCH /sport-events/:id  { bannerUrl: url }
POST  /sport-events/:id/sub-events  { gpxUrl: publicUrl }
```

The database only stores the **public URL**. The `key` is only needed for deletion (`DELETE /storage/*key`).

## Authorization

Endpoints protected by `JwtAuthGuard` require a Bearer token:

```http
Authorization: Bearer <access_token>
```

Role enforcement uses the `@Roles()` decorator combined with `RolesGuard`. The role is embedded in the JWT payload so no extra DB query is needed per request.

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

### Adding fields to an existing model

Every time you modify an entity (add/remove/rename columns), you must create and apply a migration so the database schema stays in sync.

**Step-by-step:**

1. Edit the entity file (e.g. `src/users/entities/user.entity.ts`) — add your new `@Column()` fields.

2. Generate the migration. Use a descriptive name:
   ```bash
   npm run migration:generate -- src/database/migrations/AddPhoneToUser
   ```
   TypeORM connects to the DB, diffs the current schema against your entities, and generates the SQL automatically.

3. Review the generated file in `src/database/migrations/`. Verify the SQL looks correct before applying.

4. Apply the migration:
   ```bash
   npm run migration:run
   ```

5. Commit both the entity change and the migration file together in the same commit.

> **Never** set `synchronize: true` in production — it auto-mutates the schema without version control and can cause data loss.

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
│   ├── decorators/    # @Roles() decorator, UserRole enum
│   ├── dto/           # LoginDto, AuthResponseDto
│   ├── guards/        # JwtAuthGuard, LocalAuthGuard, RolesGuard
│   ├── strategies/    # jwt.strategy, local.strategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── company/
│   ├── controller/
│   ├── dto/           # CreateCompanyDto, UpdateCompanyDto, CompanyResponseDto
│   ├── entities/      # Company entity
│   ├── service/
│   └── company.module.ts
├── database/
│   ├── migrations/    # TypeORM migrations
│   ├── data-source.ts # TypeORM CLI config
│   └── seed.ts        # Test data seed script
├── follow/
│   ├── controller/
│   ├── dto/           # FollowResponseDto
│   ├── entities/      # Follow entity (composite PK)
│   ├── service/
│   └── follow.module.ts
├── post/
│   ├── controller/
│   ├── dto/           # CreatePostDto, CreateCommentDto, PostResponseDto
│   ├── entities/      # Post, PostComment, PostLike entities; PostType enum
│   ├── service/
│   └── post.module.ts
├── sport-event/
│   ├── controller/
│   ├── dto/           # CreateSportEventDto, UpdateSportEventDto, SportEventResponseDto
│   ├── entities/      # SportEvent entity, SportEventStatus enum
│   ├── service/
│   └── sport-event.module.ts
├── sport-sub-event/
│   ├── controller/
│   ├── dto/           # CreateSportSubEventDto, UpdateSportSubEventDto, SportSubEventResponseDto
│   ├── entities/      # SportSubEvent entity, SportSubEventStatus enum
│   ├── service/
│   └── sport-sub-event.module.ts
├── storage/
│   ├── dto/           # UploadResponseDto, PresignedUrlResponseDto
│   ├── storage.controller.ts
│   ├── storage.module.ts
│   └── storage.service.ts
└── users/
    ├── controller/
    ├── dto/           # CreateUserDto, UpdateUserDto, UserResponseDto
    ├── entities/      # User entity
    ├── service/
    └── users.module.ts
```
