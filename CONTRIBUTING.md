# Contributing Guide — مناسباتي (web-booking-e1)

> **Read this before making any change.**  
> These rules are non-negotiable and enforced at code review. Deviations require explicit
> justification.

---

## 1. Architecture First

Before writing any code, read the AI guidance docs:

| Document | Read when |
|----------|-----------|
| [`docs/ai/README.md`](docs/ai/README.md) | Always — start here |
| [`docs/ai/architecture.md`](docs/ai/architecture.md) | Making any server or client change |
| [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md) | Adding a new entity or feature |

**Critical rules summary (full list in `docs/ai/README.md`):**
- Never import a Mongoose model directly in a resolver — use `getRepositoryManager()`
- Every mutation has a validator with Arabic error messages
- Protected resolvers use `combineResolvers(isAuthenticated, ...)` — never inline auth checks
- Client auth state via `useAuth()` — never `useContext(AuthContext)` directly
- Date formatting via `formatDate*` utilities — never inline `new Date(...)`

---

## 2. Branch Naming

```
main           ← production-ready code only; never commit directly
feat/<topic>   ← new feature (e.g., feat/event-ratings)
fix/<topic>    ← bug fix (e.g., fix/booking-date-validation)
docs/<topic>   ← documentation only (e.g., docs/update-ai-guide)
chore/<topic>  ← tooling, dependencies, config (e.g., chore/update-prettier)
refactor/<topic> ← refactor without behavior change
```

---

## 3. Commit Messages

**Format:** [Conventional Commits](https://www.conventionalcommits.org/) — English only.

```
<type>(<scope>): <short description>

<body — list of changes, one per line starting with ->

<footer — breaking changes or issue references>
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or behavior |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code restructure without behavior change |
| `chore` | Tooling, config, dependencies, CI |
| `style` | Formatting only (no logic change) |

### Scopes

| Scope | Applies to |
|-------|-----------|
| `server` | `server/` directory |
| `client` | `client/` directory |
| `docs` | `docs/` directory |
| `ci` | `.github/workflows/` |
| `ai` | `docs/ai/` specifically |

### Rules

1. **Subject line ≤ 72 characters**
2. **Subject uses imperative mood** — "add", "fix", "update", not "added", "fixed"
3. **No period at end of subject line**
4. **Body mandatory for non-trivial commits** — list each significant change
5. **Separate subject from body with a blank line**
6. **One logical change per commit** — do not mix server + client + docs in one commit

### Examples

```bash
# ✅ CORRECT
git commit -m "feat(server): add event rating repository + resolver

- Add Rating Mongoose model with ref to Event and User
- Add RatingRepository extending BaseRepository
- Register in RepositoryManager as getRatingRepository()
- Add createRating and deleteRating mutations in schema
- Add isAuthenticated guard on createRating resolver
- Cascade delete ratings when parent Event is deleted"

# ✅ CORRECT (patch)
git commit -m "fix(client): correct date display in EventCard

- Replace inline new Date().toLocaleDateString() with formatDateArabic()
- Fixes incorrect locale on Safari"

# ✅ CORRECT (docs only)
git commit -m "docs(ai): update architecture diagram with rating layer"

# ❌ WRONG — Arabic subject
git commit -m "إضافة التقييمات"

# ❌ WRONG — mixed scope
git commit -m "feat: add ratings server and client"

# ❌ WRONG — no body on non-trivial commit
git commit -m "feat(server): add repository pattern"

# ❌ WRONG — past tense
git commit -m "feat(server): added rating resolver"
```

---

## 4. Tagging Strategy

Tags mark **meaningful release milestones** — not every commit.

### When to create a tag

| Version bump | Trigger |
|---|---|
| `v1.0.0` (major) | First production-ready version, or breaking change |
| `v1.X.0` (minor) | New feature complete with tests |
| `v1.X.Y` (patch) | Documentation fix, bug fix, minor correction |

**Never tag:**
- Work-in-progress commits
- Commits with failing tests or TypeScript errors
- Individual "Finished: X page" style commits
- Every commit in a feature branch

### Tag format — annotated tags only

```bash
# Annotated tag (ALWAYS use -a flag — never lightweight tags)
git tag -a v1.4.0 -m "v1.4.0 - Add Event Rating System

- Rating model + RatingRepository (Mongoose)
- createRating / deleteRating mutations + resolvers
- Cascade delete from Event
- Client: StarRating component + useRatings hook
- Server tests: 131 → 154 passing
- Client tests: 54 → 61 passing"

# Tag on a past commit
git tag -a v1.0.0 <hash> -m "v1.0.0 - ..."
```

### Tag message rules

1. **First line:** `vX.Y.Z - Human-readable title`
2. **Body:** bullet list of the most significant changes
3. **Include test counts** if tests changed
4. **English only**

---

## 5. Code Formatting

**All code is formatted with Prettier** before every commit. No manual indentation decisions.

```bash
# Format all source files (run from project root — works on all OS)
node format.mjs

# Check without writing (used in CI)
node format.mjs --check

# Or per-package:
cd server && npm run format
cd client && npm run format
```

**Prettier config** (`.prettierrc.json` in `server/` and `client/`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Rules:**
- 2-space indentation — always, no tabs
- Single quotes for strings
- Trailing commas in multi-line structures (ES5 compatible)
- Max line width: 100 characters
- Never manually adjust whitespace — let Prettier decide

---

## 6. Pre-Commit Checklist

Run this before every `git commit`:

```bash
# 1. TypeScript compilation — server
cd server && npx tsc --noEmit

# 2. TypeScript compilation — client
cd client && npx tsc --noEmit

# 3. All server tests
cd server && npm run test:all

# 4. All client tests
cd client && npm run test

# 5. Prettier — ensure formatting is applied
node format.mjs --check
```

**All of the above must pass before committing.** A commit with compilation errors or
failing tests must never reach `main`.

---

## 7. Documentation Updates

When adding or changing a feature:

| Change type | Required doc updates |
|-------------|---------------------|
| New entity (model + repo + resolver) | `docs/ai/feature-guide.md`, `docs/ai/architecture.md`, `docs/graphql-api.md` |
| New GraphQL operation | `docs/graphql-api.md`, `docs/ai/README.md` (operations table) |
| New env var | `docs/ai/README.md` (env vars section), `README.md` |
| New test file | `docs/testing.md` |
| Auth change | `docs/ai/architecture.md` (auth section) |

**Documentation commits must be separate from code commits** (use `docs` type).

---

## 8. Testing Requirements

| Test suite | Command | Must pass before |
|-----------|---------|-----------------|
| Server repository tests | `npm run test` | Any server commit |
| Server comprehensive tests | `npm run test:comprehensive` | Any server commit |
| Server E2E API tests | `npm run test:e2e` | Any server commit |
| Client tests | npm run test` | Any client commit |

See [`docs/testing.md`](docs/testing.md) for full test documentation.
