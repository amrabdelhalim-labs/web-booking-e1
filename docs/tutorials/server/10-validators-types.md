markdown
# ÇáÏÑÓ ÇáÚÇÔÑ: ÇáãÏŞŞÇÊ æÇáÃäæÇÚ æÇáÊÍæíáÇÊ ??

> **åÏİ ÇáÏÑÓ:** İåã ØÈŞÉ ÇáÊÍŞŞ ãä ÇáãÏÎáÇÊ, ÇáÃäæÇÚ ÇáãÔÊÑßÉ TypeScript, ÏæÇá ÊÍæíá ÇáÈíÇäÇÊ, æÏãÌ ÇáãÍáøáÇÊ

---

## 1. áãÇĞÇ åĞå ÇáãáİÇÊ ãåãÉ¿

| Çáãáİ | ÏæÑå |
|-------|------|
| `validators/index.ts` | íÊÍŞŞ ãä ÕÍÉ ÇáãÏÎáÇÊ ŞÈá Ãí ÚãáíÉ ŞÇÚÏÉ ÈíÇäÇÊ |
| `types/index.ts` | íõÚÑøİ ÚŞæÏ TypeScript ÇáãÔÊÑßÉ Èíä ÌãíÚ ØÈŞÇÊ ÇáÎÇÏã |
| `resolvers/transform.ts` | íõÍæøá ãÓÊäÏÇÊ Mongoose Åáì Ôßá ÕÇáÍ áÜ GraphQL |
| `resolvers/index.ts` | íÏãÌ ÌãíÚ ÇáãÍáøáÇÊ İí ßÇÆä æÇÍÏ |

---

## 2. `validators/index.ts` — ÇáÊÍŞŞ ãä ÇáãÏÎáÇÊ

### ÇáãÈÏÃ ÇáÚÇã

`typescript
// äãØ ãæÍøÏ áßá ÏÇáÉ ÊÍŞŞ:
export function validateUserInput(input: UserInput): void {
  const errors: string[] = [];

  // 1. ÇÌãÚ ßá ÇáÃÎØÇÁ İí ãÕİæİÉ
  if (!input.username || input.username.trim().length < 3) {
    errors.push('ÇÓã ÇáãÓÊÎÏã íÌÈ Ãä íßæä 3 ÃÍÑİ Úáì ÇáÃŞá');
  }
  if (!input.email || !input.email.includes('@')) {
    errors.push('ÇáÈÑíÏ ÇáÇáßÊÑæäí ÛíÑ ÕÍíÍ');
  }
  if (!input.password || input.password.trim().length < 6) {
    errors.push('ßáãÉ ÇáãÑæÑ íÌÈ Ãä Êßæä 6 ÃÍÑİ Úáì ÇáÃŞá');
  }

  // 2. ÅĞÇ æõÌÏ ÎØÃ, ÇÑãö GraphQLError æÇÍÏÇğ Èßá ÇáÃÎØÇÁ
  if (errors.length > 0) {
    throw new GraphQLError(errors.join(', '), {
      extensions: { code: 'BAD_USER_INPUT', errors },
    });
  }
}
`text

### áãÇĞÇ `GraphQLError` áÇ `throw new Error`¿

| `Error` ÇáÚÇÏí | `GraphQLError` |
|----------------|----------------|
| íõÚÇÏ ßÜ `500 Internal Server Error` | íõÚÇÏ Öãä `errors[]` İí ÑÏ GraphQL |
| áÇ íÕá ááÚãíá ÈÔßá äÙíİ | íÕá ÈÜ `code` ŞÇÈá ááãÚÇáÌÉ |
| áÇ íÏÚã ÈíÇäÇÊ ÅÖÇİíÉ | íÏÚã `extensions` ãÎÕÕÉ |

### ÇáÑÏ ÇáĞí íÕá ááÚãíá

`json
{
  "errors": [
    {
      "message": "ÇÓã ÇáãÓÊÎÏã íÌÈ Ãä íßæä 3 ÃÍÑİ Úáì ÇáÃŞá, ßáãÉ ÇáãÑæÑ íÌÈ Ãä Êßæä 6 ÃÍÑİ Úáì ÇáÃŞá",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "errors": [
          "ÇÓã ÇáãÓÊÎÏã íÌÈ Ãä íßæä 3 ÃÍÑİ Úáì ÇáÃŞá",
          "ßáãÉ ÇáãÑæÑ íÌÈ Ãä Êßæä 6 ÃÍÑİ Úáì ÇáÃŞá"
        ]
      }
    }
  ]
}
`text

### ÇáÏæÇá ÇáÎãÓ ÇáãÊÇÍÉ

`typescript
// ááÊÓÌíá ÇáÌÏíÏ — íÊÍŞŞ ãä username + email + password
validateUserInput({ username, email, password })

// áÊÍÏíË ÇáãÓÊÎÏã — ßá ÇáÍŞæá ÇÎÊíÇÑíÉ áßä æÇÍÏ Úáì ÇáÃŞá ãØáæÈ
validateUpdateUserInput({ username?, password? })

// áÊÓÌíá ÇáÏÎæá — íÊÍŞŞ ãä email + password İŞØ
validateLoginInput({ email, password })

// áÅäÔÇÁ ãäÇÓÈÉ ÌÏíÏÉ — íÊÍŞŞ ãä title + description + price + date
validateEventInput({ title, description, price, date })

// áÊÍÏíË ãäÇÓÈÉ — ßá ÇáÍŞæá ÇÎÊíÇÑíÉ
validateUpdateEventInput({ title?, description?, price?, date? })
`text

### ÇáÇÓÊÎÏÇã İí ÇáãÍáøáÇÊ

`typescript
// İí resolvers/auth.ts — íõÓÊÏÚì ŞÈá Ãí ÚãáíÉ
createUser: async (_parent, { userInput }) => {
  validateUserInput(userInput);        // ? íÑãí GraphQLError ÅĞÇ İÔá
  // ... ÇáÂä äÊÇÈÚ ÈËŞÉ
  const hashedPassword = await bcrypt.hash(userInput.password, 12);
}
`text

> **ãáÇÍÙÉ ÇáÊÕãíã:** ÇáãÍáøá íõäİóøĞ İŞØ ÅĞÇ ÇÌÊÇÒ ÇáÊÍŞŞ — áÃä `GraphQLError` íŞØÚ ÇáÊäİíĞ İæÑÇğ

---

## 3. `types/index.ts` — ÇáÃäæÇÚ ÇáãÔÊÑßÉ

### ØÈŞÇÊ ÇáÃäæÇÚ

`text
types/index.ts
??? Mongoose Document Interfaces  ? IUser, IEvent, IBooking
??? GraphQL Context               ? GraphQLContext, JwtPayload
??? Auth Types                    ? AuthData
??? Input Types                   ? UserInput, UpdateUserInput, EventInput, UpdateEventInput
`text

### æÇÌåÇÊ Mongoose

`typescript
// ÊãÊÏ ãä Document — Ãí ÃäåÇ ÊÏÚã ßá ÏæÇá Mongoose
export interface IUser extends Document {
  _doc?: any;        // ? ÇäÊÈå: ãØáæÈ ááÜ transform (ÔÑÍ áÇÍŞ)
  username: string;
  email: string;
  password: string;
}

export interface IEvent extends Document {
  _doc?: any;
  title: string;
  description: string;
  price: number;
  date: Date;
  creator: Types.ObjectId | IUser;  // ? ãÑÊÈØ Ãæ ãõæáóøÌ (populated)
}

export interface IBooking extends Document {
  _doc?: any;
  event: Types.ObjectId | IEvent;
  user: Types.ObjectId | IUser;
  createdAt: Date;   // ? ÊõÖÇİ ÊáŞÇÆíÇğ ÈÜ { timestamps: true }
  updatedAt: Date;
}
`text

### áãÇĞÇ `_doc?: any`¿

ÍŞá `_doc` ÏÇÎáí İí Mongoose íÍÊæí ÇáÈíÇäÇÊ "ÇáäŞíÉ" ÈÏæä ÇáÏæÇá ÇáãÖÇİÉ:

`typescript
// ÇáãÓÊäÏ ÇáßÇãá (ãÚ ÏæÇá Mongoose):
event = { title, price, date, save(), populate(), ... }

// event._doc (ÇáÈíÇäÇÊ İŞØ):
event._doc = { title, price, date }
`text

åĞÇ ÖÑæÑí İí `transformEvent` (ÔÑÍ İí ÇáŞÓã ÇáÊÇáí).

### ÓíÇŞ GraphQL

`typescript
export interface JwtPayload {
  id: string;   // ? userId ÇáãÔİøÑ İí ÇáÜ token
  iat?: number; // ? æŞÊ ÇáÅÕÏÇÑ (issued at)
  exp?: number; // ? æŞÊ ÇáÇäÊåÇÁ (expiration)
}

export interface GraphQLContext {
  user?: IUser | null;  // ? null ÅĞÇ áã íõÓÌóøá ÏÎæá, IUser ÅĞÇ ÓõÌöøá
}
`text

### ßíİ íõÍŞä `GraphQLContext`¿

`typescript
// İí server/src/index.ts:
context: async ({ req }) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('jwt ')) return {};

  const token = auth.slice(4);          // ÃÒá "jwt "
  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  const user = await User.findById(decoded.id);

  return { user };   // ? íõÕÈÍ ãÊÇÍÇğ İí ßá resolver ßÜ context.user
}
`text

### ÃäæÇÚ ÇáãÏÎáÇÊ

`typescript
export interface UserInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
}

export interface EventInput {
  title: string;
  description: string;
  price: number;
  date: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  price?: number;
  date?: string;
}
`text

> åĞå ÇáÃäæÇÚ ÊõÓÊÎÏã İí ÇáãÍáøáÇÊ æÇáãÏŞŞÇÊ ãÚÇğ — ãÕÏÑ ÍŞíŞÉ æÇÍÏ (Single Source of Truth)

---

## 4. `resolvers/transform.ts` — ÊÍæíá ÇáÈíÇäÇÊ

### ÇáãÔßáÉ: İÌæÉ ÇáÃäæÇÚ

MongoDB ÊõÚíÏ `Date` objects, áßä GraphQL Schema ÊÊæŞÚ `String`:

`graphql
# İí Schema:
type Event {
  date: String!   # ? GraphQL íÑíÏ äÕÇğ
}
`text

`typescript
// ãÇ íÚíÏå Mongoose:
event.date = Date object  // ? áíÓ äÕÇğ!
`text

### ÇáÍá: `transformEvent`

`typescript
export const transformEvent = (event: IEvent) => ({
  ...event._doc,                                         // [1] ÇäÔÑ ßá ÍŞæá ÇáãÓÊäÏ
  date: new Date(event.date).toISOString().replace(/T/, " "), // [2] Íæøá ÇáÊÇÑíÎ
});
`text

**ÊİÕíá ßá ÎØæÉ:**

`text
1. ...event._doc
   ? íäÔÑ ÇáÈíÇäÇÊ ÇáäŞíÉ (ÈÏæä ÏæÇá Mongoose)
   { _id, title, description, price, date, creator }

2. date: new Date(event.date).toISOString().replace(/T/, " ")
   ? Date object ? "2024-01-15T18:30:00.000Z" ? "2024-01-15 18:30:00.000Z"
`text

> **áãÇĞÇ `_doc` æáíÓ `event` ãÈÇÔÑÉ¿**
> áÃä ÇäÊÔÇÑ `event` íÔãá ÏæÇá Mongoose ãËá `save()` æ`populate()`. ÃãÇ `_doc` İíÍÊæí ÇáÈíÇäÇÊ İŞØ.

### `transformBooking`

`typescript
export const transformBooking = (booking: IBooking) => ({
  ...booking._doc,
  createdAt: new Date(booking.createdAt).toISOString().replace(/T/, " "),
  updatedAt: new Date(booking.updatedAt).toISOString().replace(/T/, " "),
});
`text

`Booking` áå ÊÇÑíÎÇä (`createdAt` æ`updatedAt`) áÃäå íÓÊÎÏã `{ timestamps: true }` İí ÇáäãæĞÌ.

### ãËÇá Úáì ÇáãÎÑÌÇÊ

`typescript
// ÇáÅÏÎÇá (ãä Mongoose):
{
  _id: ObjectId("..."),
  title: "ÍİáÉ ãæÓíŞíÉ",
  price: 150,
  date: Date("2024-06-15T18:30:00.000Z"),
  creator: { username: "ÃÍãÏ" }
}

// ÇáÅÎÑÇÌ (ÈÚÏ transformEvent):
{
  _id: "...",
  title: "ÍİáÉ ãæÓíŞíÉ",
  price: 150,
  date: "2024-06-15 18:30:00.000Z",  // ? äÕ ÇáÂä
  creator: { username: "ÃÍãÏ" }
}
`text

---

## 5. `resolvers/index.ts` — ÏãÌ ÇáãÍáøáÇÊ

### ÇáãÔßáÉ: ãÍáøáÇÊ ãäİÕáÉ

ßá domain áå ãáİ ãÍáøáÇÊ ãÓÊŞá:

`text
resolvers/
??? auth.ts      ? { Query: {}, Mutation: { createUser, login, updateUser, deleteUser } }
??? event.ts     ? { Query: { events, getUserEvents }, Mutation: { createEvent, ... } }
??? booking.ts   ? { Query: { bookings }, Mutation: { bookEvent, cancelBooking } }
`text

áßä Apollo Server íÊæŞÚ **ßÇÆäÇğ æÇÍÏÇğ** Èßá ÇáãÍáøáÇÊ.

### ÇáÍá: `lodash.merge`

`typescript
import { merge } from 'lodash';
import authResolver from './auth';
import bookingResolver from './booking';
import eventResolver from './event';

const resolvers = merge(authResolver, bookingResolver, eventResolver);
export default resolvers;
`text

### áãÇĞÇ `merge` æáíÓ `Object.assign` Ãæ `{...spread}`¿

`typescript
// ÇáãÔßáÉ ãÚ spread:
const merged = { ...authResolver, ...eventResolver };
// ÅĞÇ ßÇä áÏíåãÇ äİÓ ÇáãİÊÇÍ (ãËá Query):
// ? eventResolver.Query ÓíÍá ãÍá authResolver.Query ßÇãáÇğ!

// ÇáÍá ãÚ lodash.merge:
const merged = merge(authResolver, eventResolver);
// ? íÏãÌ Query ãä Çáãáİíä ãÚÇğ ÈÏáÇğ ãä ÇÓÊÈÏÇá ÃÍÏåãÇ
`text

**ãËÇá ÇáİÑŞ:**

`typescript
// authResolver:
{ Query: { getUserEvents: fn }, Mutation: { createUser: fn } }

// eventResolver:
{ Query: { events: fn }, Mutation: { createEvent: fn } }

// ÈÜ merge:
{
  Query: { getUserEvents: fn, events: fn },     // ? ãÏãÌÇä
  Mutation: { createUser: fn, createEvent: fn } // ? ãÏãÌÇä
}

// ÈÜ spread (? ÎØÃ):
{
  Query: { events: fn },       // ? İŞØ ãä eventResolver!
  Mutation: { createEvent: fn }
}
`text

---

## 6. ÊÏİŞ ÇáØáÈ ÇáßÇãá (ãÚ åĞå ÇáØÈŞÇÊ)

`text
GraphQL Request
      ?
      ?
[Apollo Server] íÓÊŞÈá ÇáØáÈ
      ?
      ?
[index.ts context] íÍŞä user ãä JWT
      ?
      ?
[resolvers/index.ts] íõÍÏÏ ÇáãÍáøá ÇáÕÍíÍ
      ?
      ?
[isAuthenticated] (ÅĞÇ ßÇäÊ ÇáÚãáíÉ ãÍãíÉ)
      ?
      ?
[validators/index.ts] íÊÍŞŞ ãä ÇáãÏÎáÇÊ
      ?
      ?
[Repository] íõäİĞ ÚãáíÉ ŞÇÚÏÉ ÇáÈíÇäÇÊ
      ?
      ?
[resolvers/transform.ts] íõÍæøá ÇáÈíÇäÇÊ
      ?
      ?
[Apollo Server] íõÚíÏ ÇáÑÏ ááÚãíá
`text

---

## 7. ÎáÇÕÉ

| Çáãİåæã | ÇáÊØÈíŞ |
|---------|---------|
| ÇáÊÍŞŞ ãÈßÑÇğ | `validateInput()` Ãæá ÓØÑ İí ßá Mutation |
| ÃÎØÇÁ æÇÖÍÉ | `GraphQLError` ãÚ `code: 'BAD_USER_INPUT'` æÃÎØÇÁ ÚÑÈíÉ |
| ÃäæÇÚ ãÑßÒíÉ | `types/index.ts` ? ãÕÏÑ ÍŞíŞÉ æÇÍÏ |
| ÊÍæíá ÇáÈíÇäÇÊ | `transform.ts` ÌÓÑ Èíä Mongoose æGraphQL |
| ÏãÌ Âãä | `lodash.merge` íÌãÚ ÇáãÍáøáÇÊ ÈÏæä ÊÚÇÑÖ |

> **ÃİÖá ããÇÑÓÉ:** ÃÖİ ÇáÊÍŞŞ ÏÇÆãÇğ İí ØÈŞÉ ÇáãÍáøá, áÇ İí ÇáãÓÊæÏÚ — ÇáãÓÊæÏÚ ãÓÄæá İŞØ Úä ŞÇÚÏÉ ÇáÈíÇäÇÊ
