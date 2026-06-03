# Ekinnow Backend — Claude Context

## Stack

- **NestJS v11** + TypeScript (strict)
- **TypeORM v1** + PostgreSQL (Supabase Session Pooler, `synchronize: false`)
- **JWT** auth via Passport (`local` + `jwt` strategies)
- **Cloudflare R2** for file storage (S3-compatible, `@aws-sdk/client-s3`)
- **class-validator** + **class-transformer** for DTO validation
- **Swagger** at `/api`
- **Jest** for unit tests, **SonarCloud** for quality gates
- Node 22+, npm 10+

## Running the project

```bash
npm install
cp .env.example .env   # fill in DB + JWT + R2 vars
npm run migration:run
npm run start:dev      # runs prettier + watch
```

Tests: `npm test -- --forceExit`
Type check: `npx tsc --noEmit`

## Environment variables

```
DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_NAME
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false   # Supabase Session Pooler has self-signed cert

JWT_SECRET / JWT_EXPIRES_IN=7d

R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME / R2_PUBLIC_URL
```

DB must use **Session Pooler** host (`aws-0-<region>.pooler.supabase.com`), not direct. Direct uses IPv6 and is unreachable from most networks.

## Module structure

```
src/
├── auth/
│   ├── decorators/      roles.decorator.ts  (@Roles), userRole.enum.ts
│   ├── guards/          jwt-auth.guard.ts, local-auth.guard.ts, roles.guard.ts
│   ├── strategies/      jwt.strategy.ts, local.strategy.ts
│   ├── dto/             login.dto.ts, auth-response.dto.ts
│   └── auth.service.ts  login() → { access_token }
├── users/               CRUD, password hashing (bcrypt, 10 rounds)
├── company/             CRUD, soft-delete via isActive
├── sport-event/         CRUD, soft-delete via status=CANCELLED
├── sport-sub-event/     nested under sport-events, soft-delete via status=CANCELLED
├── storage/             Cloudflare R2 upload + presigned URLs
└── database/
    ├── data-source.ts   TypeORM CLI standalone DataSource
    └── migrations/      all schema changes live here
```

## Auth & roles

JWT payload: `{ sub: userId, email, role, companyId? }` — role and companyId embedded to avoid extra DB queries per request.

`UserRole` enum (at `src/auth/decorators/userRole.enum.ts`):
- `PARTICIPANT` — default for new users
- `COMPANY_STAFF`
- `COMPANY_ADMIN` — manages own company's events/sub-events
- `SUPER_ADMIN` — unrestricted

Guards pattern:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
```

For cross-tenant checks (e.g. COMPANY_ADMIN can only touch own company's resources), the controller fetches the entity first and compares `entity.companyId === req.user.companyId`. This is done explicitly in the controller — the service stays pure.

JWT payload includes `companyId` (optional UUID). Controllers use `req.user.companyId` for cross-tenant ownership checks (company PATCH, sport-event PATCH, sport-sub-event create/update). `companyId` is null for PARTICIPANT and COMPANY_STAFF users with no associated company.

## Authorization rules per endpoint

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| User | public | public | self or SUPER_ADMIN | — |
| Company | SUPER_ADMIN | public (active only) | SUPER_ADMIN or COMPANY_ADMIN (own) | SUPER_ADMIN (soft) |
| SportEvent | SUPER_ADMIN or COMPANY_ADMIN | public (non-DRAFT/CANCELLED) | SUPER_ADMIN or COMPANY_ADMIN (own company) | SUPER_ADMIN (soft) |
| SportSubEvent | SUPER_ADMIN or COMPANY_ADMIN (own event's company) | public (non-DRAFT/CANCELLED) | SUPER_ADMIN or COMPANY_ADMIN (own event's company) | SUPER_ADMIN (soft) |
| Storage upload | any JWT | — | — | SUPER_ADMIN or COMPANY_ADMIN |

## Entity conventions

- `id`: `@PrimaryGeneratedColumn('uuid')`
- `createdAt` / `updatedAt`: `@CreateDateColumn` / `@UpdateDateColumn`
- Soft-delete:
  - Users/Company → `isActive: boolean` (default true)
  - SportEvent/SportSubEvent → `status` enum set to `CANCELLED`
- Enums stored as postgres `enum` type
- Relations use explicit scalar FK column alongside the relation object:
  ```typescript
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  companyId: string;
  ```

## DTO conventions

- **Create DTOs**: required fields use `@IsString()` / `@IsDateString()` / etc. No `@IsNotEmpty()` (consistent with existing code).
- **Update DTOs**: all fields `@IsOptional()`.
- **Response DTOs**: pure classes with `@ApiProperty` / `@ApiPropertyOptional` for Swagger — no logic.
- Always annotate with `@ApiProperty` / `@ApiPropertyOptional`.
- Import `UserRole` from `src/auth/decorators/userRole.enum.ts` (not from users/entities — the enum was moved here).

## Service conventions

- Services are pure business logic — no auth/role checks.
- `findAll()` returns only non-soft-deleted records:
  - Company: `findBy({ isActive: true })`
  - SportEvent/SportSubEvent: `findBy({ status: Not(In([STATUS.DRAFT, STATUS.CANCELLED])) })`
- `remove()` soft-deletes, never hard-deletes.
- Slug auto-generation: `generateSlug(name)` → lowercase, NFD normalize, spaces→dashes, strip non-alphanumeric.
- Slug uniqueness checked on create via `findOneBy({ slug })` → `ConflictException`.

## Storage (Cloudflare R2)

Two upload flows:
1. **Server-side** (`POST /storage/upload?type=<type>`) — file goes through NestJS, max 50 MB.
2. **Pre-signed URL** (`GET /storage/presigned-url?type=<type>&contentType=<mime>`) — client uploads direct to R2. Extension derived server-side from `contentType` (never trusted from client). ContentType is signed into the presigned URL conditions.

Asset types → allowed MIME:
- `events`, `sub-events`, `companies`, `users` → `image/jpeg`, `image/png`, `image/webp`
- `gpx` → `application/gpx+xml`, `text/xml`, `application/xml`

Keys follow pattern `{assetType}/{uuid}.{ext}`. DB stores only the public URL string. Key only needed for deletion.

## Database migrations

**Never** use `synchronize: true`. All schema changes via TypeORM CLI:

```bash
npm run migration:generate -- src/database/migrations/DescriptiveName
npm run migration:run
npm run migration:revert
npm run migration:show
```

`data-source.ts` is the standalone DataSource for CLI — separate from the app's TypeOrmModule.

## Testing conventions

- One spec per service + one per controller.
- Mock the repository with a plain object (`findOneBy`, `findBy`, `create`, `save` as `jest.fn()`).
- Guards (`JwtAuthGuard`, `RolesGuard`) are **not** instantiated in unit tests — they run in the HTTP pipeline only. For endpoints that use `RolesGuard`, test the delegate-to-service behaviour only.
- For controller methods that do manual role checks (ForbiddenException thrown synchronously), use `expect(() => controller.method(...)).toThrow(ForbiddenException)` — not `rejects.toThrow`.
- For async throws, use `await expect(controller.method(...)).rejects.toThrow(...)`.
- Always `jest.clearAllMocks()` in `beforeEach`.
- Run with `npm test -- --forceExit`.

## CI / Quality

- GitHub Actions: `.github/workflows/ci.yml` — triggers on PR to `main`.
- Steps: checkout (fetch-depth: 0) → Node 22 → npm ci → lint → tsc --noEmit → test --coverage → SonarCloud.
- Secrets needed: `SONAR_TOKEN`, `GITHUB_TOKEN` (auto).
- SonarCloud config: `sonar-project.properties` — excludes spec files, module files, main.ts, database/.

## Known TODOs / gaps

- `companyId` is in the JWT payload (`JwtPayload` + `jwt.strategy.ts` + `auth.service.ts` all updated). User entity exposes it as `@Column({ nullable: true, type: 'uuid' }) companyId?: string`.
- `sport-sub-evet-status.enum.ts` has a typo in the filename (`evet` instead of `event`) — keep consistent when importing.
- Storage `DELETE /storage/*key` restricts to SUPER_ADMIN/COMPANY_ADMIN by role but does not verify the key belongs to the caller's company. Full ownership check would require a DB table mapping keys to owners.
- The `@UseGuards(JwtAuthGuard)` decorator on `StorageController` class level was commented out in the source — verify this is intentional before deploying.

## Code style

- No comments unless the WHY is non-obvious.
- No trailing `console.log`.
- Prettier auto-runs on file save via Claude Code hook (PostToolUse on Write|Edit).
- ESLint: unused vars allowed if prefixed with `_`.
