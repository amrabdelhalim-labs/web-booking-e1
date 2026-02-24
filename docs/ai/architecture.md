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

---

## 3. Client Architecture Details

### 3.1 Apollo Client Setup (`client/src/main.tsx` or `App.tsx`)

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

*This document is the single authoritative reference for مناسباتي architecture.*  
*See [`feature-guide.md`](./feature-guide.md) for how to add a new feature using these patterns.*
