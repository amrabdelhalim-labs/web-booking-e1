# Architecture Reference — مناسباتي (web-booking-e1)

> Read this before touching any code. The architecture is intentional and consistent —
> every new feature must follow the same patterns.

---

## 1. Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React/TypeScript)              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Pages   │  │  Components  │  │  Hooks / Context  │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                   │              │
│       └───────────────┴───────────────────┘              │
│                       │ Apollo Client                     │
│                  (HTTP + WebSocket)                       │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTP (queries/mutations)
                        │ WS  (subscriptions)
┌───────────────────────┼─────────────────────────────────┐
│                    SERVER (Node.js/TypeScript)            │
│                       │                                  │
│             ┌──────────▼──────────┐                      │
│             │   Apollo Server 4    │                      │
│             │  + Express Middleware│                      │
│             └──────────┬──────────┘                      │
│                        │ GraphQL Context (user: JwtPayload│
│              ┌─────────▼──────────┐                      │
│              │     Resolvers       │ ← combineResolvers   │
│              │  auth / event /     │   for auth guards    │
│              │  booking            │                      │
│              └────────┬────────────┘                      │
│                       │ calls validators + repos          │
│         ┌─────────────┴──────────────┐                   │
│         │                            │                    │
│  ┌──────▼──────┐          ┌──────────▼─────────┐         │
│  │  Validators  │          │  Repository Manager │         │
│  │ (GraphQLError│          │  getRepositoryMgr() │         │
│  │  + Arabic)   │          └──────────┬──────────┘         │
│  └─────────────┘                      │                   │
│                          ┌────────────┼────────────┐      │
│                   ┌──────▼──┐  ┌─────▼──┐  ┌──────▼──┐   │
│                   │  User   │  │ Event  │  │Booking  │   │
│                   │  Repo   │  │  Repo  │  │  Repo   │   │
│                   └──────┬──┘  └─────┬──┘  └──────┬──┘   │
│                          └───────────┼─────────────┘      │
│                                      │ Mongoose            │
│                             ┌────────▼─────────┐          │
│                             │     MongoDB       │          │
│                             └───────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Server Architecture Details

### 2.1 Entry Point (`server/src/index.ts`)

The server starts with this sequence:
1. Create Express app + HTTP server
2. Build GraphQL schema with `makeExecutableSchema({ typeDefs, resolvers })`
3. Create `WebSocketServer` on `/graphql` for subscription support
4. Create `ApolloServer` with drain plugins for graceful shutdown
5. Apply `expressMiddleware` with JWT context injection
6. Connect to MongoDB
7. Start HTTP listener

**JWT Context Injection Pattern:**
```typescript
// On every request, the server decodes the JWT token and injects the user:
context: async ({ req }) => {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
  if (token) {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id); // Direct model access OK in context
    return { user };
  }
  return { user: null };
}
```

### 2.2 GraphQL Schema (`server/src/schema/index.ts`)

Single file using `graphql-tag`. Pattern for adding a new type:
```typescript
export const typeDefs = gql`
  type NewEntity {
    _id: ID!
    field1: String!
    field2: Float!
    creator: User!          # ← populated reference
    createdAt: String!
  }

  input NewEntityInput {
    field1: String!
    field2: Float!
  }

  extend type Query {
    newEntities(skip: Int = 0, limit: Int = 8): [NewEntity!]
  }

  extend type Mutation {
    createNewEntity(input: NewEntityInput!): NewEntity!
  }
`;
```

### 2.3 Repository Pattern

#### Interface (`repository.interface.ts`)
```typescript
interface IRepository<T extends Document> {
  findAll(filter?, options?): Promise<T[]>
  findOne(filter, options?): Promise<T | null>
  findById(id, options?): Promise<T | null>
  findPaginated(page, limit, filter?, options?): Promise<PaginatedResult<T>>
  create(data): Promise<T>
  update(id, data): Promise<T | null>
  updateWhere(filter, data): Promise<number>
  delete(id): Promise<T | null>
  deleteWhere(filter): Promise<number>
  exists(filter): Promise<boolean>
  count(filter?): Promise<number>
}
```

#### Base Repository (`base.repository.ts`)
- `BaseRepository<T extends Document>` implements `IRepository<T>`
- Accepts `Model<T>` in constructor
- `findPaginated` uses `Promise.all([find, countDocuments])` for efficiency
- Pagination bounds: `Math.max(1, page)`, `Math.min(Math.max(1, limit), 50)`
- `getModel()` escape hatch for edge cases

#### Entity Repositories — Naming Convention

| Method category | Pattern | Example |
|-----------------|---------|---------|
| Lookup by field | `findBy{Field}` | `findByEmail()` |
| With populated refs | `findAllWith{Ref}` | `findAllWithCreator()` |
| With all refs | `findByIdWith{Details}` | `findByIdWithDetails()` |
| Existence | `{field}Exists()` | `emailExists()`, `titleExists()` |
| Create + populate | `createAnd{Action}` | `createAndPopulate()` |
| Update + return | `updateWith{Ref}` | `updateWithCreator()` |
| Targeted delete | `deleteBy{Entity}` | `deleteByUserCascade()` |
| Search | `search(term, skip, limit)` | Full text/regex search |

#### Repository Manager (`repositories/index.ts`)
```typescript
const repos = getRepositoryManager();
repos.user.findByEmail(email)
repos.event.findAllWithCreator({}, skip, limit)
repos.booking.userHasBooked(userId, eventId)
```

### 2.4 Resolvers (`server/src/resolvers/`)

**Rules:**
- No direct `import Model from '../models/...'` — always use `getRepositoryManager()`
- Auth-protected resolvers: `combineResolvers(isAuthenticated, async (..., context) => { ... })`
- Call validators before repository access
- Use `transformEvent()` and `transformBooking()` on returned data to normalize dates

**Pattern for a new protected mutation:**
```typescript
createNewEntity: combineResolvers(
  isAuthenticated,
  async (_parent, { input }, context: GraphQLContext) => {
    validateNewEntityInput(input);               // 1. Validate
    const repos = getRepositoryManager();
    const duplicate = await repos.newEntity.titleExists(input.name);
    if (duplicate) throw new GraphQLError("موجود مسبقاً", { ... });
    const entity = await repos.newEntity.create({ ...input, creator: context.user!.id });
    return transformNewEntity(entity);           // 4. Transform & return
  }
)
```

### 2.5 Validation Layer (`server/src/validators/index.ts`)

```typescript
export function validateNewEntityInput(input: NewEntityInput): void {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("الاسم مطلوب");
  else if (input.name.trim().length < 3) errors.push("الاسم يجب أن يكون 3 أحرف على الأقل");
  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}
```

**Rules:**
- Arabic error messages always
- Accumulate all errors in `string[]`, throw combined
- Update validators check only `if (input.field !== undefined)`

### 2.6 Auth Middleware (`server/src/middlewares/isAuth.ts`)

```typescript
// Used as first argument in combineResolvers:
combineResolvers(isAuthenticated, myResolver)

// isAuthenticated throws if context.user is null:
if (!context.user) throw new GraphQLError("Authentication required!", {
  extensions: { code: "UNAUTHENTICATED" },
});
```

### 2.7 Subscriptions

- Uses `PubSub` from `graphql-subscriptions`  
- Published inside mutations: `pubsub.publish("EVENT_ADDED", { eventAdded: event })`
- `eventAdded` subscription in schema returns `Event!`
- WebSocket transport via `graphql-ws` and `useServer` from `graphql-ws/lib/use/ws`

### 2.8 Transform Layer (`server/src/resolvers/transform.ts`)

Every event and booking returned from resolvers passes through `transformEvent` / `transformBooking`:
- Converts Mongoose document to plain object
- Normalizes dates to ISO strings
- Ensures `creator` is populated

### 2.9 Environment Configuration (`server/src/config/index.ts`)

**All environment variables are centralized in config/index.ts:**

```typescript
export const config = {
  port: process.env.PORT || 4000,
  
  // Database URL - supports 3 variables (checked in priority order):
  // 1. DATABASE_URL (Heroku standard)
  // 2. MONGODB_URI (MongoDB Atlas standard)  
  // 3. DB_URL (custom)
  dbUrl: process.env.DATABASE_URL || 
         process.env.MONGODB_URI || 
         process.env.DB_URL || 
         'mongodb://localhost:27017/event-booking',
  
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  
  appUrls: (process.env.APP_URLS || process.env.APP_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)
};
```

**Environment Variable Reference:**

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `4000` | Server port |
| `DATABASE_URL` | Yes* | localhost | MongoDB connection URI (Heroku standard) |
| `MONGODB_URI` | Yes* | localhost | MongoDB connection URI (Atlas standard) |
| `DB_URL` | Yes* | localhost | MongoDB connection URI (custom) |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `APP_URLS` | Yes | localhost:5173 | Allowed CORS origins (comma-separated) |

\***Only ONE database variable is needed** — they are checked in order: `DATABASE_URL` → `MONGODB_URI` → `DB_URL`

**Local Development `.env` Example:**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=mongodb://localhost:27017/event-booking
JWT_SECRET=dev-secret-change-in-production
APP_URLS=http://localhost:5173
```

**Heroku Production Config Vars:**
```env
NODE_ENV=production
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/event-booking?retryWrites=true&w=majority
JWT_SECRET=<generated-strong-secret>
APP_URLS=https://your-frontend-domain.com
```

**Rules:**
- Never import `dotenv` or call `process.env` outside `config/index.ts`
- Always import from `config` → ensures type safety and single source of truth
- Use Heroku Dashboard → Settings → Config Vars to set production values
- For MongoDB Atlas in production, ensure Network Access allows `0.0.0.0/0` (all IPs)

---

## 3. Client Architecture Details

### 3.1 Environment Configuration (`client/src/config.ts`)

**All client configuration is centralized in config.ts:**

```typescript
export const APP_DOMAIN = 
  import.meta.env.VITE_APP_DOMAIN || 'https://amrabdelhalim-labs.github.io/web-booking-e1';

export const APP_BASE_PATH = '/web-booking-e1';
export const APP_NAME = 'Event Booking';

export const GRAPHQL_HTTP_URL = 
  import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';

// Auto-derive WebSocket URL from HTTP URL
const deriveWsUrl = (httpUrl: string): string =>
  httpUrl.replace(/^https?:\/\//, match => match === 'https://' ? 'wss://' : 'ws://');

export const GRAPHQL_WS_URL = 
  import.meta.env.VITE_GRAPHQL_WS_URL || deriveWsUrl(GRAPHQL_HTTP_URL);
```

**Client Environment Variable Reference:**

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VITE_GRAPHQL_HTTP_URL` | Yes | localhost:4000 | GraphQL server HTTP endpoint |
| `VITE_GRAPHQL_WS_URL` | No | (auto-derived) | GraphQL server WebSocket endpoint |
| `VITE_APP_DOMAIN` | No | GitHub Pages URL | Public URL where frontend is hosted |
| `VITE_BASE_PATH` | No | `/` | Base path for routing (e.g., `/web-booking-e1/`) |

**Local Development `.env` or `.env.local`:**
```env
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
VITE_APP_DOMAIN=http://localhost:5173
VITE_BASE_PATH=/
```

**Production (GitHub Pages / Netlify / Vercel):**
```env
VITE_GRAPHQL_HTTP_URL=https://your-api.herokuapp.com/graphql
VITE_GRAPHQL_WS_URL=wss://your-api.herokuapp.com/graphql
VITE_APP_DOMAIN=https://your-domain.com
VITE_BASE_PATH=/
```

**Rules:**
- All Vite env variables must be prefixed with `VITE_` to be exposed to browser
- Never hardcode URLs — always import from `config.ts`
- WebSocket URL is auto-derived (http→ws, https→wss) if not explicitly set
- For GitHub Pages deployment, set `VITE_BASE_PATH` to match repository name

### 3.2 Apollo Client Setup (`client/src/main.tsx` or `App.tsx`)

- **HTTP link** → queries and mutations → `GRAPHQL_HTTP_URL`
- **WebSocket link** → subscriptions → `GRAPHQL_WS_URL`
- **Split link**: `split(isSubscription, wsLink, httpLink)`
- Auth header injected via `authLink` middleware using `localStorage.getItem("token")`

### 3.2 Auth State Flow

```
localStorage (token, userId, username)
        ↓ read on mount
AuthProvider (useState)
        ↓ provides via AuthContext
useAuth() hook
        ↓ consumed by
Pages / Components
```

**Adding a field to auth state:**
1. Add to `AuthContext` definition in `auth-context.ts`
2. Add `useState` and `localStorage` operations in `AuthProvider.tsx`
3. Update `login()` and `logout()` functions
4. The `useAuth()` hook requires no changes

### 3.3 Config Constants (`client/src/config.ts`)

All environment-aware constants live here. Pattern:
```typescript
export const MY_CONSTANT = import.meta.env.VITE_MY_VARIABLE || "default-value";
```
Never use `import.meta.env.*` directly inside components or hooks.

### 3.4 TypeScript Types (`client/src/types.ts`)

All shared interfaces live here:
```typescript
export interface NewEntityData {
  _id: string;
  field1: string;
  creator: {
    _id: string;
    username: string;
    email: string;
  };
}
```

### 3.5 GraphQL Operations (`client/src/graphql/`)

- `fragments.ts` — shared field fragments (e.g., `EVENT_FIELDS`)
- `queries.ts` — all `gql` tagged queries and mutations
- Pattern: use `...${FRAGMENT_NAME}` to compose queries

### 3.6 Date Utilities (`client/src/utils/formatDate.ts`)

| Function | Input | Output | Used In |
|----------|-------|--------|---------|
| `formatDateShort` | ISO string | `YYYY/MM/DD` | EventItem display |
| `formatDateArabic` | ISO string | Arabic locale date | Detailed views |
| `formatDateForInput` | ISO string | `YYYY-MM-DDTHH:MM:SS` | datetime-local fields |
| `formatDateFull` | ISO string | `YYYY/MM/DDTHH:MM:SS` | Full timestamp display |

---

## 4. Testing Architecture

### Server Tests

| File | Strategy | Runs against |
|------|----------|-------------|
| `repositories.test.ts` | Unit — per method | Real MongoDB (test DB) |
| `comprehensive.test.ts` | Integration — full workflow | Real MongoDB (test DB) |
| `api.test.ts` | E2E — real HTTP/GraphQL | Server started on test port 4001 |

**Test runner:** `ts-node --transpile-only` (avoids `.d.ts` resolution issues)

**Test helper pattern:**
```typescript
import { assert, logSection, logStep, printSummary } from "./test.helpers";

logSection("User Repository Tests");
logStep("1. Create user");
const user = await repos.user.create({ ... });
assert(!!user._id, "يجب أن يكون للمستخدم معرّف");
```

### Client Tests

**Framework:** Vitest + `@testing-library/react` + jsdom

**Test files** (`client/src/tests/`):
| File | What it tests |
|------|--------------|
| `config.test.ts` | All constants in `config.ts` defined and correct types |
| `types.test.ts` | TypeScript interface shapes via object assignment |
| `formatDate.test.ts` | All 4 formatDate functions with various inputs |
| `useAuth.test.tsx` | Hook state transitions: login, logout, localStorage sync |
| `graphql.test.ts` | Query strings contain required fields (fragments, variables) |

**Hook testing pattern:**
```typescript
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
const { result } = renderHook(() => useAuth(), { wrapper });
act(() => result.current.login("token", "userId", "username"));
expect(result.current.token).toBe("token");
```

---

## 5. Models Reference

### User
```typescript
{ username: String (required, min 3), email: String (required, unique), password: String (required, hashed bcrypt) }
```

### Event
```typescript
{ title: String, description: String, price: Number, date: String (ISO), creator: ObjectId → User }
```

### Booking
```typescript
{ event: ObjectId → Event, user: ObjectId → User, timestamps: true }
```

---

## 6. Data Flow for a Complete Request

```
1. Client: Apollo Client executes mutation/query
2. Client → Server: HTTP POST /graphql (with Authorization: Bearer TOKEN)
3. Server: Apollo context extracts token → decodes JWT → finds user → injects into context
4. Server: Resolver called
   a. combineResolvers checks isAuthenticated (if protected)
   b. Validator called — throws GraphQLError on invalid input
   c. getRepositoryManager() → appropriate repository method
   d. Repository → Mongoose → MongoDB
   e. transformEvent/transformBooking applied
   f. Return data
5. Server → Client: GraphQL response
6. Client: Apollo cache updated → UI re-renders via useQuery/useMutation
```

---

## 7. CI/CD Workflow

### GitHub Actions (`.github/workflows/build-and-deploy.yml`)

مهمتان متوازيتان تعملان عند Push إلى `main` أو `workflow_dispatch`:

| المهمة | الخدمات | الخطوات | هدف النشر |
|--------|---------|---------|----------|
| **deploy-server** | MongoDB 7 | `npm ci` → `npm run test:all` → `npm run build` → نشر على فرع `server` | Heroku / Render |
| **deploy-client** | — | `npm ci` → `npm test` → `npm run build` → نشر على فرع `web` | GitHub Pages / Netlify |

### آلية نشر الخادم

الخادم TypeScript — يُبنى إلى `dist/` أولاً، ثم تُنسخ الملفات المُجمَّعة فقط:

```bash
cp -r server/dist /tmp/server-deploy/
cp server/package.json /tmp/server-deploy/package.json.bak
cp server/package-lock.json /tmp/server-deploy/
```

ثم يُعدَّل `package.json` بحذف `devDependencies` وجميع scripts التطوير والاختبار قبل النشر:

```javascript
delete p.scripts.build;   // dist/ مُجمَّع مسبقاً
delete p.scripts.dev;
delete p.scripts['test'];
delete p.scripts['test:all'];
delete p.scripts['format'];
delete p.devDependencies; // TypeScript، Jest، etc. لا تُثبَّت في الإنتاج
```

### فروع النشر

- **`server`** — فرع يتيم يحتوي: `dist/`، `package.json` (dependencies فقط)، `package-lock.json`، `Procfile`
- **`web`** — فرع يتيم يحتوي محتويات `client/dist/` + `.nojekyll`
- جميع commits النشر تحمل لاحقة `[skip ci]` لمنع الحلقات اللانهائية

### القرارات التصميمية

1. **بناء TypeScript إلزامي** — الخادم لا يُنشر كـ source بل كـ `dist/` مُجمَّع
2. **حذف `devDependencies`** — TypeScript وأدوات الاختبار لا تُثبَّت في الإنتاج
3. **حذف `scripts.build`** — `dist/` جاهز، Heroku لا يحتاج إعادة البناء
4. **`cancel-in-progress: false`** — يضمن اكتمال النشر حتى لو جاء push جديد

---

*This document is the single authoritative reference for مناسباتي architecture.*  
*See [`feature-guide.md`](./feature-guide.md) for how to add a new feature using these patterns.*
