# Advanced NestJS Study Guide — Veridian Clinical API

**Audience:** JS developers preparing for **15 LPA** full-stack roles who already know Express basics and want **production NestJS + Neon** depth.

**Codebase:** `backend/src/**`  
**Live pattern:** Module → Controller → Service → Prisma → Neon PostgreSQL

---

## 1. Why NestJS here (interview answer)

> "The frontend stays on Next.js for UX and Auth.js. The **domain API** lives in NestJS because it gives us **modular boundaries**, **DTO validation**, **global exception handling**, **interceptors for logging and response envelopes**, and **Prisma** on **Neon serverless Postgres** — the same stack many enterprise Node teams use instead of ad-hoc Express routes."

---

## 2. Architecture map

```
backend/
├── src/
│   ├── main.ts                 # Bootstrap, CORS, ValidationPipe
│   ├── app.module.ts           # Root module + global providers
│   ├── common/
│   │   ├── dto/pagination.dto.ts
│   │   ├── filters/all-exceptions.filter.ts
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts
│   │       └── transform.interceptor.ts
│   ├── prisma/                 # PrismaService (global module)
│   ├── health/                 # Health + DB probe
│   ├── doctors/                # Paginated read API
│   ├── appointments/           # CRUD + pagination
│   ├── ai/                     # Groq proxy
│   ├── innovation/             # ClinicalTrials.gov + PubMed
│   └── analytics/              # Enterprise dataset stats
├── prisma/
│   ├── schema.prisma           # 15+ models, indexes, enums
│   ├── seed.ts                 # Quick demo (3 users)
│   └── seed-enterprise.ts      # 10k+ records
└── api/index.ts                # Vercel serverless entry
```

---

## 3. Core NestJS concepts (advanced)

### 3.1 Modules (`@Module`)

Each feature is a **bounded context**:

```typescript
@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService], // other modules can inject DoctorsService
})
export class DoctorsModule {}
```

**Study task:** Trace `AppModule` imports → see how `PrismaModule` is `@Global()` so you never re-import Prisma in every feature module.

### 3.2 Dependency injection

```typescript
@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}
}
```

Nest constructs the graph at boot. **No manual `new DoctorsService()`** — testable via mock providers.

### 3.3 DTOs + ValidationPipe

```typescript
export class CreateAppointmentDto {
  @IsString() patientId!: string;
  @IsEnum(ConsultationType) consultationType!: ConsultationType;
  @IsDateString() scheduledAt!: string;
}
```

`ValidationPipe` with `whitelist: true` strips unknown fields (security). `transform: true` coerces query strings to numbers for pagination.

### 3.4 Global exception filter

`AllExceptionsFilter` catches everything and returns:

```json
{ "success": false, "statusCode": 404, "error": "Doctor xyz not found" }
```

**Interview:** "Consistent error contract for frontend and observability."

### 3.5 Interceptors (AOP)

| Interceptor | Purpose |
|-------------|---------|
| `LoggingInterceptor` | Request latency logging |
| `TransformInterceptor` | Wrap success as `{ success, timestamp, data }` |

Runs **around** the handler — like middleware but aware of route metadata.

### 3.6 Pagination pattern

```typescript
const [total, rows] = await Promise.all([
  prisma.doctorProfile.count({ where }),
  prisma.doctorProfile.findMany({ where, ...skipTake(page, limit) }),
]);
return paginate(rows, total, page, limit);
```

Response:

```json
{
  "success": true,
  "data": {
    "data": [...],
    "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

---

## 4. Database — Neon + Prisma (enterprise)

### 4.1 Why Neon

- Serverless Postgres — scales to zero, good for portfolio + Vercel
- **Pooled connection string** required for serverless (many short-lived connections)
- Same SQL/Prisma skills transfer to RDS, Supabase, Azure Postgres

### 4.2 Schema highlights (`prisma/schema.prisma`)

- **Enums:** `UserRole`, `AppointmentStatus`, `ConsultationType`
- **Relations:** User ↔ PatientProfile ↔ Appointment ↔ Consultation
- **Indexes:** `@@index([scheduledAt])`, `@@index([role])` — mention in interviews
- **Audit:** `AuditLog`, `ConsentLog` — compliance story

### 4.3 Migrations workflow

```bash
cd backend
npm run db:push          # dev: sync schema to Neon
npm run db:seed          # 3 demo users
npm run db:seed:enterprise   # 10,000 appointments + 2,000 patients
```

### 4.4 Enterprise seed breakdown

| Entity | Count |
|--------|-------|
| Doctors | 50 |
| Patients | ~2,000 |
| Appointments | **10,000** |
| Audit logs | 500 |
| Notifications | 500 |

Verify: `GET /api/v1/analytics/enterprise-stats` → `"datasetScale": "enterprise"`

---

## 5. Deployment

### 5.1 Local

```bash
cd backend && npm run start:dev   # :4000
cd web && npm run dev             # :3000, proxies /api/v1 if NEST_API_URL set
```

### 5.2 Vercel (API project)

Root directory: `backend`  
Env: `DATABASE_URL`, `GROQ_API_KEY`, `CORS_ORIGINS`

Serverless entry: `api/index.ts` caches Express + Nest bootstrap between invocations.

### 5.3 Connection pooling

Always use Neon's **pooled** URL on Vercel. Direct URL is for migrations from your laptop only.

---

## 6. API reference (study these handlers)

| Endpoint | Nest patterns used |
|----------|-------------------|
| `GET /health` | ConfigService, raw SQL probe |
| `GET /doctors?page=&limit=` | Pagination DTO, Prisma count+findMany |
| `POST /appointments` | Body DTO, NotFoundException, nested includes |
| `POST /ai/chat` | External HTTP (Groq), ServiceUnavailableException |
| `GET /analytics/enterprise-stats` | Parallel `Promise.all` counts |

---

## 7. Phase 2 (your next learning steps)

1. **JWT AuthGuard** — validate Next.js session token or issue Nest JWT
2. **RBAC `@Roles()` decorator** — mirror `web/lib/rbac.ts`
3. **Swagger** — `@nestjs/swagger` OpenAPI at `/docs`
4. **Prisma middleware** — audit log on every write
5. **Rate limiting** — `@nestjs/throttler`
6. **Health checks** — `@nestjs/terminus` for Redis, DB, Groq

---

## 8. Practice exercises

1. Add `GET /patients/:id/appointments` with pagination
2. Add Prisma `$transaction` for appointment + notification create
3. Write a unit test mocking `PrismaService` with `@nestjs/testing`
4. Add `If-None-Match` caching on `GET /doctors`
5. Deploy API to Vercel and call from mobile browser

---

## 9. Cheat sheet — file → responsibility

| File | One line |
|------|----------|
| `main.ts` | App bootstrap |
| `app.module.ts` | Wire modules + global filter/interceptors |
| `prisma.service.ts` | DB connection lifecycle |
| `pagination.dto.ts` | Reusable list API contract |
| `seed-enterprise.ts` | 10k dataset for demos |
| `api/index.ts` | Vercel serverless adapter |

Read these files in order when studying. Each maps to a NestJS doc chapter.
