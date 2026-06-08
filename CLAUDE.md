# Wedding Invite — Backend (NestJS + Postgres)

> Cập nhật lần cuối: Session tháng 6/2026

---

## Khởi động nhanh

```bash
# Bắt buộc: Docker Desktop phải đang mở
docker start wedding-postgres

cd D:\wedding-invite-be
npm run start:dev          # hot-reload, port 4000

# Seed lần đầu (idempotent, chạy nhiều lần không lỗi):
npx ts-node src/seed.ts
```

**Verify đang chạy:**
```bash
curl http://localhost:4000/api/public/templates
# → [{"slug":"bloom",...}, ...]
```

**Tài khoản seed:**
| Role | Email | Password |
|---|---|---|
| Admin | `admin@wedding.local` | `admin123` |
| Couple demo | `couple@wedding.local` | `couple123` |

---

## Infrastructure

| Service | Tool | Port | Creds |
|---|---|---|---|
| PostgreSQL 16 | Docker `wedding-postgres` | 5544 | `wedding` / `wedding_secret` / db `wedding_invite` |
| NestJS | Node 20.x | 4000 | — |

```bash
# Docker compose (D:\wedding-invite-be\):
docker compose up -d       # start + tạo volume nếu chưa có
docker compose down        # stop, giữ data
docker compose down -v     # stop + xoá data (reset DB)
```

**DB:** `synchronize: true` (dev only) — TypeORM tự tạo/alter schema. Production → đổi sang migrations.

---

## API Endpoints

### Auth — public
```
POST /api/auth/register   { email, password, displayName? }  → { accessToken, user }
POST /api/auth/login      { email, password }                → { accessToken, user }
GET  /api/auth/me         Bearer token                       → user object
```

### Invitations — JWT, owner only
```
POST   /api/invitations          { content: jsonb, published? }  → InvitationRecord
GET    /api/invitations/mine                                       → InvitationRecord[]
GET    /api/invitations/:id                                        → InvitationRecord
PUT    /api/invitations/:id      { content, published? }           → InvitationRecord
DELETE /api/invitations/:id                                        → { success: true }
GET    /api/invitations/:id/rsvps                                  → Rsvp[]
```

### Public — no auth
```
GET  /api/public/invitations/:slug           → InvitationRecord (+ viewCount++)
GET  /api/public/invitations/:slug/guestbook → Guestbook[] (approved=true only)
POST /api/public/invitations/:slug/guestbook { guestName, message }
POST /api/public/invitations/:slug/rsvp      { guestName, status, guestCount?, note? }
GET  /api/public/templates                   → Template[] (isActive=true only)
```

### Admin — JWT + role:'admin'
```
GET   /api/admin/stats                   → { userCount, invCount, publishedCount, templateCount }
GET   /api/admin/users                   → User[]
PATCH /api/admin/users/:id/active        { isActive: bool }
GET   /api/admin/invitations             → Invitation[] với owner relation

GET    /api/admin/templates              → Template[] (kể cả inactive)
POST   /api/admin/templates              CreateTemplateDto
PUT    /api/admin/templates/:id          UpdateTemplateDto
DELETE /api/admin/templates/:id
```

---

## Cấu trúc module

```
src/
├── main.ts            globalPrefix='api', ValidationPipe(whitelist,transform), CORS từ .env
├── app.module.ts      TypeORM async config, import tất cả modules
│
├── auth/
│   ├── auth.service.ts      register() + login() → bcrypt + jwt.sign
│   ├── auth.controller.ts   /auth/register, /auth/login, /auth/me
│   ├── jwt.strategy.ts      validate JWT payload → req.user
│   ├── guards.ts            JwtAuthGuard, RolesGuard, @Roles(), @CurrentUser()
│   └── dto.ts               RegisterDto, LoginDto
│
├── users/
│   ├── user.entity.ts       id(uuid), email(unique), passwordHash, displayName, role, isActive
│   └── users.service.ts     findByEmail, findById, create, findAll, setActive, count
│
├── invitations/
│   ├── invitation.entity.ts  id(uuid), slug(unique), content(jsonb), published, viewCount, ownerId
│   ├── guestbook.entity.ts   id, guestName, message, approved(default true), invitationId
│   ├── rsvp.entity.ts        id, guestName, status, guestCount, note, invitationId
│   ├── invitations.service.ts  create/findMine/findOneOwned/update/remove/viewBySlug/guestbook/rsvp
│   ├── invitations.controller.ts  InvitationsController + PublicInvitationsController
│   └── dto.ts                UpsertInvitationDto, GuestbookDto, RsvpDto
│
├── templates/
│   ├── template.entity.ts   id(uuid), slug(unique), label, description, theme(jsonb),
│   │                        palette(simple-array), isPremium, isActive, sortOrder, usageCount
│   ├── templates.service.ts listActive / listAll / create / update / remove / ensureSeeded
│   ├── templates.controller.ts  PublicTemplatesController + AdminTemplatesController
│   └── dto.ts               CreateTemplateDto, UpdateTemplateDto
│
├── admin/
│   ├── admin.service.ts     stats() aggregate từ 3 services
│   └── admin.controller.ts  /admin/stats, /admin/users, /admin/invitations
│
└── seed.ts             Standalone script — admin + couple demo + 4 templates
```

---

## DB Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| email | varchar UNIQUE | lưu lowercase |
| passwordHash | varchar | bcrypt 10 rounds |
| displayName | varchar | default '' |
| role | varchar | 'admin' \| 'couple' |
| isActive | boolean | default true |

### `invitations`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | private key (dùng trong editor URL) |
| slug | varchar UNIQUE | 8-char random, public key (dùng trong /invite/:slug) |
| content | jsonb | Toàn bộ InvitationData — không cần migration khi thêm field FE |
| published | boolean | default false |
| viewCount | integer | tăng mỗi lần GET public |
| ownerId | uuid FK | nullable (invitations không cần account) |

### `guestbook_entries`
| Column | Type |
|---|---|
| id | uuid PK |
| guestName | varchar |
| message | text |
| approved | boolean (default true) |
| invitationId | uuid FK + INDEX |

### `rsvps`
| Column | Type |
|---|---|
| id | uuid PK |
| guestName | varchar |
| status | varchar ('yes'\|'no'\|'maybe') |
| guestCount | integer (default 1) |
| note | text |
| invitationId | uuid FK + INDEX |

### `templates`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar UNIQUE | khớp TemplateId FE: bloom/noir/minimal/velvet |
| label | varchar | tên hiển thị |
| description | text | |
| theme | jsonb | nullable — dành cho AI-generated theme |
| palette | simple-array | mảng hex, ví dụ: '#FAFAF7,#C4A882,#2C2420' |
| isPremium | boolean | |
| isActive | boolean | ảnh hưởng public API |
| sortOrder | integer | |
| usageCount | integer | chưa tự tăng (TODO) |

---

## Auth Flow

```
POST /auth/login
  → bcrypt.compare(password, hash)
  → jwt.sign({ sub: userId, email, role }, secret, { expiresIn: '7d' })
  → { accessToken, user }

Request có JWT:
  JwtAuthGuard → JwtStrategy.validate(payload)
  → users.findById(payload.sub)
  → attach { id, email, role, displayName } vào req.user
  → @CurrentUser() decorator extract req.user
  → RolesGuard check user.role nếu có @Roles('admin')
```

---

## Patterns

```typescript
// Guard pattern
@UseGuards(JwtAuthGuard)                         // chỉ cần login
@UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')  // cần admin

// Owner check trong service (không trong controller)
async findOneOwned(id: string, ownerId: string) {
  const inv = await this.repo.findOne({ where: { id } })
  if (!inv) throw new NotFoundException()
  if (inv.ownerId !== ownerId) throw new ForbiddenException()
  return inv
}
```

---

## Environment

```env
# D:\wedding-invite-be\.env
PORT=4000
DB_HOST=localhost
DB_PORT=5544
DB_USER=wedding
DB_PASSWORD=wedding_secret
DB_NAME=wedding_invite
JWT_SECRET=change_this_super_secret_key_in_prod_2026
JWT_EXPIRES=7d
CORS_ORIGIN=http://localhost:5174
```

CORS nhiều origin: `CORS_ORIGIN=http://localhost:5174,https://domain.com`

---

## Roadmap / TODO

- [ ] `POST /api/admin/ai/generate-theme` — nhận prompt → Claude/OpenAI → trả TemplateTheme object (AdminTemplates FE đã có UI mock sẵn, chỉ cần wire endpoint)
- [ ] File upload endpoint — ảnh cưới → disk/S3, thay base64 trong content jsonb
- [ ] Guestbook moderation API — admin approve/reject entries
- [ ] RSVP aggregation — tổng yes/no/maybe, số khách
- [ ] Template.usageCount tự tăng khi tạo invitation
- [ ] Rate limiting (Throttler) cho public endpoints
- [ ] Helmet + compression middleware
- [ ] TypeORM migrations thay `synchronize:true` cho production
- [ ] Refresh token (hiện access token 7 ngày, không có refresh)
- [ ] Email notification khi tạo thiệp xong
