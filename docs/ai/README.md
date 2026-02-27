# AI Documentation — مناسباتي (web-booking-e1)

> **Purpose:** Entry point for AI tools working on this project. Read this first, then follow
> the links below for the specific context you need.
>
> **Project name in prose:** مناسباتي  
> **Folder:** `web-booking-e1/`  
> **Last reviewed:** 2026-02-24

---

## Quick Identity

| Property | Value |
|----------|-------|
| App name | **مناسباتي** |
| Type | Event booking web app |
| Server stack | Node.js 22 · TypeScript · Apollo Server 4 · Express · MongoDB/Mongoose |
| API style | **GraphQL** (queries + mutations + subscriptions via WebSocket) |
| Client stack | React 18 · TypeScript · Vite · Apollo Client · React Bootstrap |
| Auth | JWT (server context injection) |
| Architecture | Repository Pattern (TypeScript/Mongoose) |
| Testing — server | Custom helpers (`ts-node --transpile-only`) |
| Testing — client | Vitest + @testing-library/react |
| Deployment | GitHub Pages (client) + cloud server |

---

## AI Docs in This Folder

| File | When to Use |
|------|-------------|
| [`architecture.md`](./architecture.md) | Before making any change — understand the full layer structure |
| [`feature-guide.md`](./feature-guide.md) | Adding a new entity/feature end-to-end |

---

## Critical Rules (Non-Negotiable)

1. **Never import a Mongoose model directly in a resolver** — all data access goes through
   `getRepositoryManager()` from `../repositories`
2. **Every mutation has a corresponding validator** in `server/src/validators/index.ts`
3. **Validators throw `GraphQLError`** with Arabic messages and `extensions.code: "BAD_USER_INPUT"`
4. **Protected resolvers use `combineResolvers(isAuthenticated, ...)`** — never inline auth checks
5. **All entity repositories are singletons** — use `get{Entity}Repository()` factory functions
6. **Client state is managed through `AuthProvider` + `useAuth()`** — never use `useContext(AuthContext)` directly
7. **Date utilities live in `client/src/utils/formatDate.ts`** — never inline date formatting

---

## Key File Locations

### Server
```
server/src/
├── index.ts                    ← Apollo Server + WebSocket entry point
├── config/index.ts             ← All env vars (jwtSecret, port, mongoUri, corsOrigins)
├── models/                     ← Mongoose schemas (user, event, booking)
├── repositories/
│   ├── repository.interface.ts ← IRepository<T> generic interface
│   ├── base.repository.ts      ← BaseRepository<T extends Document>
│   ├── user.repository.ts      ← findByEmail, emailExists
│   ├── event.repository.ts     ← findAllWithCreator, search, titleExists
│   ├── booking.repository.ts   ← findByUser, userHasBooked, deleteByEventCascade
│   └── index.ts                ← RepositoryManager + getRepositoryManager()
├── validators/index.ts         ← validateUserInput, validateEventInput, etc.
├── resolvers/
│   ├── auth.ts                 ← login, createUser, updateUser, deleteAccount
│   ├── event.ts                ← events query, createEvent, updateEvent, deleteEvent
│   ├── booking.ts              ← bookings query, createBooking, cancelBooking
│   ├── transform.ts            ← transformEvent, transformBooking (date normalization)
│   └── index.ts                ← merges all resolvers
├── schema/index.ts             ← Full GraphQL SDL (typeDefs)
├── middlewares/isAuth.ts       ← isAuthenticated resolver guard
└── tests/
    ├── test.helpers.ts         ← assert, logSection, printSummary
    ├── repositories.test.ts    ← unit tests for each repository
    ├── comprehensive.test.ts   ← multi-phase integration workflow
    └── api.test.ts             ← E2E via real HTTP/GraphQL requests
```

### Client
```
client/src/
├── App.tsx                     ← AuthProvider wrapper + AppRoutes component
├── config.ts                   ← GRAPHQL_HTTP_URL, GRAPHQL_WS_URL, APP_NAME, etc.
├── types.ts                    ← All shared TypeScript interfaces (EventData, BookingData, etc.)
├── context/
│   ├── auth-context.ts         ← AuthContext definition (createContext)
│   └── AuthProvider.tsx        ← State management (token, userId, username + login/logout)
├── hooks/useAuth.ts            ← useAuth() — guards against null context
├── utils/formatDate.ts         ← formatDateShort, formatDateArabic, formatDateForInput, formatDateFull
├── graphql/
│   ├── fragments.ts            ← EVENT_FIELDS fragment
│   └── queries.ts              ← GET_EVENTS, GET_BOOKINGS, CREATE_EVENT, etc.
├── components/                 ← Reusable UI components
├── pages/                      ← Route-level page components
└── tests/                      ← Vitest test files
```

---

## GraphQL Operations Reference

| Operation | Type | Auth Required |
|-----------|------|--------------|
| `events(searchTerm, skip, limit)` | Query | No |
| `bookings` | Query | Yes |
| `getUserEvents(userId)` | Query | No |
| `login(email, password)` | Mutation | No |
| `createUser(userInput)` | Mutation | No |
| `updateUser(userId, input)` | Mutation | Yes |
| `deleteAccount(userId)` | Mutation | Yes |
| `createEvent(eventInput)` | Mutation | Yes |
| `updateEvent(eventId, input)` | Mutation | Yes |
| `deleteEvent(eventId)` | Mutation | Yes |
| `createBooking(eventId)` | Mutation | Yes |
| `cancelBooking(bookingId)` | Mutation | Yes |
| `eventAdded` | Subscription | No |

---

## Test Scripts

```bash
# Server (from server/)
npm run test              # repositories.test.ts only
npm run test:comprehensive # comprehensive.test.ts only
npm run test:e2e          # api.test.ts — requires server to start on test port
npm run test:all          # all three sequentially

# Client (from client/)
npm run test              # vitest run (all tests, no watch)
npm run test:watch        # vitest watch mode
```

---

## Environment Variables

### Server (`server/.env`)
```env
NODE_ENV=development
PORT=4000
# Use ONE of these (checked in order: DATABASE_URL → MONGODB_URI → DB_URL):
DATABASE_URL=mongodb://localhost:27017/event-booking
# Or for MongoDB Atlas:
# DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/event-booking?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_change_in_production
APP_URLS=http://localhost:5173
```

**Production (Heroku/Render):**
- Set via Dashboard → Config Vars (recommended) or CLI
- Use `DATABASE_URL` (Heroku standard) or `MONGODB_URI` (Atlas standard)
- Must use MongoDB Atlas — localhost won't work in cloud deployments

### Client (`client/.env` or `.env.local`)
```env
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
VITE_APP_DOMAIN=http://localhost:5173
VITE_BASE_PATH=/
```

**Production:**
- `VITE_GRAPHQL_HTTP_URL=https://your-api.herokuapp.com/graphql`
- `VITE_GRAPHQL_WS_URL=wss://your-api.herokuapp.com/graphql`
- WebSocket URL auto-derives from HTTP URL if not set (http→ws, https→wss)

---

*See [`architecture.md`](./architecture.md) for the layer diagram and pattern details.*  
*See [`feature-guide.md`](./feature-guide.md) for step-by-step instructions when adding a new feature.*
