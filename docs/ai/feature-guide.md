# Feature Development Guide — مناسباتي (web-booking-e1)

> **Purpose:** Exact steps to follow when adding a new entity or feature to this project.
> Every instruction maps directly to the existing codebase patterns.
>
> **Prerequisite:** Read [`architecture.md`](./architecture.md) first.

---

## Adding a New Server-Side Entity

This guide uses a hypothetical `Review` entity as a running example.
Adapt field names and logic to your actual entity.

### Step 1: Define the Mongoose Model

Location: `server/src/models/review.ts`

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  content: string;
  rating: number;
  event: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
}

const ReviewSchema = new Schema<IReview>(
  {
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", ReviewSchema);
```

### Step 2: Add TypeScript Interface to Types

Location: `server/src/types/index.ts`

```typescript
export interface ReviewInput {
  content: string;
  rating: number;
  eventId: string;
}

export interface UpdateReviewInput {
  content?: string;
  rating?: number;
}
```

### Step 3: Create the Repository

Location: `server/src/repositories/review.repository.ts`

**Template:**
```typescript
import { BaseRepository } from "./base.repository";
import Review from "../models/review";
import { IReview } from "../types";

class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(Review);
  }

  // ── Domain-specific methods ──────────────────────────────────────────────────

  async findByEvent(eventId: string): Promise<IReview[]> {
    return Review.find({ event: eventId }).populate("author", "username email").sort({ _id: -1 });
  }

  async findByEventPaginated(eventId: string, page: number, limit: number) {
    return this.findPaginated(page, limit, { event: eventId });
  }

  async findByAuthor(authorId: string): Promise<IReview[]> {
    return Review.find({ author: authorId }).populate("event", "title");
  }

  async authorHasReviewed(authorId: string, eventId: string): Promise<boolean> {
    return this.exists({ author: authorId, event: eventId });
  }

  async deleteByEvent(eventId: string): Promise<number> {
    return this.deleteWhere({ event: eventId });
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let instance: ReviewRepository | null = null;

export function getReviewRepository(): ReviewRepository {
  if (!instance) instance = new ReviewRepository();
  return instance;
}

export { ReviewRepository };
```

### Step 4: Add to Repository Manager

Location: `server/src/repositories/index.ts`

```typescript
// Add import:
import { getReviewRepository, ReviewRepository } from "./review.repository";

// Add to RepositoryManager class:
get review(): ReviewRepository {
  return getReviewRepository();
}

// Add to healthCheck():
try {
  await this.review.count();
  results.review = true;
} catch {
  results.review = false;
}
```

### Step 5: Add Validators

Location: `server/src/validators/index.ts`

```typescript
export function validateReviewInput(input: ReviewInput): void {
  const errors: string[] = [];
  if (!input.content?.trim()) errors.push("محتوى التقييم مطلوب");
  else if (input.content.trim().length < 10) errors.push("التقييم يجب أن يكون 10 أحرف على الأقل");
  if (!input.rating) errors.push("تقييم النجوم مطلوب");
  else if (input.rating < 1 || input.rating > 5) errors.push("التقييم يجب أن يكون بين 1 و 5");
  if (!input.eventId) errors.push("معرّف الفعالية مطلوب");
  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), { extensions: { code: "BAD_USER_INPUT", errors } });
  }
}

export function validateUpdateReviewInput(input: UpdateReviewInput): void {
  const errors: string[] = [];
  if (input.content !== undefined) {
    if (!input.content.trim()) errors.push("محتوى التقييم لا يمكن أن يكون فارغاً");
    else if (input.content.trim().length < 10) errors.push("التقييم يجب أن يكون 10 أحرف على الأقل");
  }
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    errors.push("التقييم يجب أن يكون بين 1 و 5");
  }
  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), { extensions: { code: "BAD_USER_INPUT", errors } });
  }
}
```

### Step 6: Add GraphQL Schema Types

Location: `server/src/schema/index.ts`

Add inside the `typeDefs = gql` template literal:

```graphql
type Review {
  _id: ID!
  content: String!
  rating: Int!
  event: Event!
  author: User!
  createdAt: String!
}

input ReviewInput {
  content: String!
  rating: Int!
  eventId: ID!
}

input UpdateReviewInput {
  content: String
  rating: Int
}

extend type Query {
  reviews(eventId: ID!, skip: Int = 0, limit: Int = 10): [Review!]
}

extend type Mutation {
  createReview(reviewInput: ReviewInput!): Review!
  updateReview(reviewId: ID!, input: UpdateReviewInput!): Review!
  deleteReview(reviewId: ID!): Review!
}
```

### Step 7: Create the Resolver

Location: `server/src/resolvers/review.ts`

```typescript
import { GraphQLError } from "graphql";
import { combineResolvers } from "graphql-resolvers";
import { isAuthenticated } from "../middlewares/isAuth";
import { getRepositoryManager } from "../repositories";
import { validateReviewInput, validateUpdateReviewInput } from "../validators";
import { GraphQLContext, ReviewInput, UpdateReviewInput } from "../types";

export const reviewResolver = {
  Query: {
    reviews: async (_parent: unknown, { eventId, skip = 0, limit = 10 }: { eventId: string; skip?: number; limit?: number }) => {
      const repos = getRepositoryManager();
      return repos.review.findByEvent(eventId); // Note: uses custom method, not pagination here
    },
  },

  Mutation: {
    createReview: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, { reviewInput }: { reviewInput: ReviewInput }, context: GraphQLContext) => {
        validateReviewInput(reviewInput);
        const repos = getRepositoryManager();

        const alreadyReviewed = await repos.review.authorHasReviewed(
          context.user!.id, reviewInput.eventId
        );
        if (alreadyReviewed) {
          throw new GraphQLError("لقد قمت بتقييم هذه الفعالية مسبقاً", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        const review = await repos.review.create({
          content: reviewInput.content,
          rating: reviewInput.rating,
          event: reviewInput.eventId,
          author: context.user!.id,
        });
        return review;
      }
    ),

    deleteReview: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, { reviewId }: { reviewId: string }, context: GraphQLContext) => {
        const repos = getRepositoryManager();
        const review = await repos.review.findById(reviewId);
        if (!review) throw new GraphQLError("التقييم غير موجود", { extensions: { code: "NOT_FOUND" } });
        if (String(review.author) !== context.user!.id) {
          throw new GraphQLError("غير مصرح", { extensions: { code: "FORBIDDEN" } });
        }
        return repos.review.delete(reviewId);
      }
    ),
  },
};
```

### Step 8: Register the Resolver

Location: `server/src/resolvers/index.ts`

```typescript
import { reviewResolver } from "./review";

export const resolvers = mergeResolvers([
  authResolver,
  eventResolver,
  bookingResolver,
  reviewResolver,   // ← Add here
]);
```

### Step 9: Add Tests

#### Repository tests — `server/src/tests/repositories.test.ts`

Add a new section following the existing pattern:
```typescript
logSection("Review Repository Tests");
logStep("1. Create review");
// ... test each method
```

#### Comprehensive tests — `server/src/tests/comprehensive.test.ts`

Add review steps to the user workflow:
```typescript
logStep("X. Create review for event");
const review = await repos.review.create({ ... });
assert(!!review._id, "يجب أن يكون للتقييم معرّف");
```

#### E2E tests — `server/src/tests/api.test.ts`

Add GraphQL mutation and query tests:
```typescript
logSection("Review API Tests");
const createResult = await makeRequest(`
  mutation { createReview(reviewInput: { ... }) { _id content rating } }
`, token);
assert(createResult.data?.createReview?._id, "يجب أن يُنشأ التقييم");
```

**Run all tests to verify:**
```bash
cd server && npm run test:all
```

---

## Adding a New Client-Side Feature

### Step 1: Add TypeScript Interface

Location: `client/src/types.ts`

```typescript
export interface ReviewData {
  _id: string;
  content: string;
  rating: number;
  event: { _id: string; title: string };
  author: { _id: string; username: string };
  createdAt: string;
}
```

### Step 2: Add GraphQL Operation

Location: `client/src/graphql/queries.ts`

```typescript
export const GET_REVIEWS = gql`
  query GetReviews($eventId: ID!, $skip: Int, $limit: Int) {
    reviews(eventId: $eventId, skip: $skip, limit: $limit) {
      _id
      content
      rating
      author { _id username }
      createdAt
    }
  }
`;

export const CREATE_REVIEW = gql`
  mutation CreateReview($reviewInput: ReviewInput!) {
    createReview(reviewInput: $reviewInput) {
      _id
      content
      rating
      createdAt
    }
  }
`;
```

### Step 3: Create the Component

Location: `client/src/components/ReviewItem.tsx`

```typescript
import { ReviewData } from "../types";
import { formatDateShort } from "../utils/formatDate";   // ← Always use utility

interface Props {
  review: ReviewData;
}

export default function ReviewItem({ review }: Props) {
  return (
    <div className="review-item">
      <p>{review.content}</p>
      <small>التقييم: {review.rating}/5 — {formatDateShort(review.createdAt)}</small>
    </div>
  );
}
```

### Step 4: Use in a Page or Parent Component

```typescript
import { useQuery } from "@apollo/client";
import { GET_REVIEWS } from "../graphql/queries";
import ReviewItem from "../components/ReviewItem";
import { useAuth } from "../hooks/useAuth";   // ← Always use useAuth, not useContext

function EventDetailPage() {
  const { token } = useAuth();
  const { data, loading } = useQuery(GET_REVIEWS, { variables: { eventId } });
  // ...
}
```

### Step 5: Add Client Tests

Location: `client/src/tests/`

**Type test** (in `types.test.ts`):
```typescript
it("يجب أن يحتوي ReviewData على الحقول المطلوبة", () => {
  const review: ReviewData = { _id: "1", content: "ممتاز", rating: 5,
    event: { _id: "e1", title: "حفل" }, author: { _id: "u1", username: "أحمد" },
    createdAt: "2025-01-01T00:00:00Z" };
  expect(review.rating).toBe(5);
});
```

**GraphQL operation test** (in `graphql.test.ts`):
```typescript
it("GET_REVIEWS should include rating field", () => {
  const source = GET_REVIEWS.loc?.source.body ?? "";
  expect(source).toContain("rating");
  expect(source).toContain("$eventId");
});
```

**Run client tests:**
```bash
cd client && npm run test
```

---

## Modifying Auth (Adding a Field to Auth State)

1. **Server**: Add field to `AuthData` type in `schema/index.ts` and return it from `login` / `createUser` resolvers
2. **Server**: Verify `JwtPayload` in `types/index.ts` if the field needs to be in the token
3. **Client**: Add to `AuthContextType` in `context/auth-context.ts`
4. **Client**: Add `useState` + localStorage operations in `context/AuthProvider.tsx`
5. **Client**: Update `login()` function signature and body in `AuthProvider.tsx`
6. **Client**: Update all `login()` call sites in `pages/Login.tsx` and `pages/SignUp.tsx`
7. **Tests**: Update `useAuth.test.tsx` to cover the new field

---

## Adding a Real-Time Subscription

1. **Server** — Schema (`schema/index.ts`):
```graphql
extend type Subscription {
  reviewAdded(eventId: ID!): Review!
}
```

2. **Server** — Resolver (`resolvers/review.ts`):
```typescript
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();

// In createReview mutation, after creating:
pubsub.publish(`REVIEW_ADDED_${reviewInput.eventId}`, { reviewAdded: review });

// Subscription resolver:
Subscription: {
  reviewAdded: {
    subscribe: (_parent, { eventId }) =>
      pubsub.asyncIterableIterator(`REVIEW_ADDED_${eventId}`),
  },
},
```

3. **Client** — Operation (`graphql/queries.ts`):
```typescript
export const REVIEW_ADDED = gql`
  subscription ReviewAdded($eventId: ID!) {
    reviewAdded(eventId: $eventId) { _id content rating }
  }
`;
```

4. **Client** — Use `useSubscription` from `@apollo/client`

---

## Quality Checklist Before Committing

### Server
- [ ] Mongoose model created with correct types
- [ ] Repository extends `BaseRepository<IEntity>` and uses singleton pattern
- [ ] Repository registered in `RepositoryManager` in `repositories/index.ts`
- [ ] Validator created with Arabic error messages + `BAD_USER_INPUT` code
- [ ] Schema updated with new types, inputs, queries, mutations
- [ ] Resolver uses `combineResolvers(isAuthenticated, ...)` for protected operations
- [ ] Resolver uses `getRepositoryManager()` — no direct model imports
- [ ] Tests updated + `npm run test:all` passes

### Client
- [ ] TypeScript interface added to `types.ts`
- [ ] GraphQL operation added to `graphql/queries.ts`
- [ ] Components use `useAuth()` not raw `useContext(AuthContext)`
- [ ] Date display uses `formatDate*` utilities, never `new Date(...)` inline
- [ ] Constants come from `config.ts`, never hardcoded URLs
- [ ] Client tests updated + `npm run test` passes

### Commit
```bash
# Server changes first:
git add server/ && git commit -m "feat(server): add review entity with repository + tests"
# Then client:
git add client/ && git commit -m "feat(client): add review components + graphql operations"
```

### Tagging (when applicable)

Create an annotated tag only if this commit represents a **significant milestone** — a new feature
complete with tests, or a notable improvement. Patch-level fixes (docs, renames) use `vX.Y.Z`;
new features use `vX.(Y+1).0`.

```bash
git tag -a v1.4.0 -m "v1.4.0 - Add Review System

- Review entity: model, repository, validators, resolvers
- Cascade delete from Event
- Client: ReviewList + AddReview components
- 131 → 158 tests passing"
```

See workspace tagging rules: `docs/ai-improvement-guide.md § Tagging Strategy`.

---

*Companion document: [`architecture.md`](./architecture.md)*  
*Workspace improvement guide: [`docs/ai-improvement-guide.md`](../../../../docs/ai-improvement-guide.md)
