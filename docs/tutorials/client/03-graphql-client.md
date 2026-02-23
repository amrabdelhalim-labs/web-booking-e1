# الدرس الثالث (العميل): Apollo GraphQL Client — الرابط بين الواجهة والخادم 🔗

> **هدف الدرس:** فهم كيف يُضبط Apollo Client للتواصل مع GraphQL عبر HTTP وWebSocket

---

## 1. ما هو Apollo Client؟

Apollo Client = **مكتبة** تتولى:
- إرسال استعلامات GraphQL للخادم
- إدارة الـ Cache (تخزين النتائج مؤقتاً)
- حقن الـ Token في كل طلب تلقائياً
- التعامل مع WebSocket للـ Subscriptions

```
مكوّن React
    ↓ [useQuery / useMutation]
Apollo Client
    ├── HTTP  → queries + mutations
    └── WS    → subscriptions
```

---

## 2. طبقات الـ Link

Apollo Client يُنجز العمل عبر "روابط" (Links) متسلسلة:

```
طلب GraphQL
    ↓
[authLink]   ← أضف Token للـ headers
    ↓
[splitLink]  ← هل هو subscription؟
    ├── نعم → [wsLink]   ← أرسل عبر WebSocket
    └── لا  → [httpLink] ← أرسل عبر HTTP
```

---

## 3. HTTP Link

```typescript
const httpLink = createHttpLink({
  uri: GRAPHQL_HTTP_URL,
  // مثال: "http://localhost:4000/graphql"
  credentials: "same-origin",
});
```

يُرسل الطلبات العادية (Queries & Mutations) عبر HTTP POST.  
كل الطلبات تذهب لنفس مسار `/graphql`.

---

## 4. WebSocket Link

```typescript
const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_URL,
    // مثال: "ws://localhost:4000/graphql"
    connectionParams: () => ({
      authToken: localStorage.getItem("token"),
    }),
  })
);
```

يُنشئ اتصالاً دائماً (Persistent) مع الخادم عبر WebSocket.  
يُستخدم فقط لـ **Subscriptions** — التحديثات الفورية.

**`connectionParams`**: يُرسل الـ Token عند بدء الاتصال (لأن WS لا يدعم headers بنفس الطريقة).

---

## 5. Auth Link — حقن الـ Token

```typescript
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,  // ← احتفظ بالـ headers الموجودة
      authorization: token ? `JWT ${token}` : "",
      //                      ↑ "JWT " + الـ Token
    },
  };
});
```

**هذا يُشرح "السر العجيب" في الخادم!**

العميل يُرسل: `Authorization: "JWT eyJhbGci..."`  
الخادم يزيل أول 4 أحرف `"jwt "`: `auth.slice(4)` = الـ Token الصافي

> **ملاحظة:** نستخدم `JWT` (بحروف كبيرة) في العميل.  
> `auth.slice(4)` يزيل 4 أحرف: "J" + "W" + "T" + " " (مسافة) = 4 أحرف ✓

---

## 6. Split Link — توجيه الطلبات

```typescript
const splitLink = split(
  // شرط التفريق:
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"  // ← هل هو Subscription؟
    );
  },
  wsLink,              // ← إذا نعم: WebSocket
  authLink.concat(httpLink) // ← إذا لا: Auth + HTTP
);
```

**`split`** = محوّل ذكي:

```
Subscription?
    ├── نعم → wsLink (WebSocket)
    └── لا  → authLink → httpLink (HTTP + Token)
```

---

## 7. Apollo Client الكامل

```typescript
const client = new ApolloClient({
  link: splitLink,        // ← الروابط المتسلسلة
  cache: new InMemoryCache(), // ← الـ Cache في الذاكرة
});
```

**`InMemoryCache`:** Apollo يحفظ نتائج الاستعلامات تلقائياً.  
إذا طلبنا نفس البيانات مرتين، يُرجع من الـ Cache بدون طلب شبكي جديد. ⚡

---

## 8. إعدادات الـ URLs في `config.ts`

```typescript
// عنوان HTTP
export const GRAPHQL_HTTP_URL =
  import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql";

// تحويل http:// إلى ws:// (و https:// إلى wss://)
const deriveWsUrl = (httpUrl: string): string =>
  httpUrl.replace(/^https?:\/\//, (match) =>
    match === "https://" ? "wss://" : "ws://"
  );

export const GRAPHQL_WS_URL = normalizeWsUrl(rawWsUrl);
```

**مثال التحويل:**
```
"http://localhost:4000/graphql"  → "ws://localhost:4000/graphql"
"https://api.mysite.com/graphql" → "wss://api.mysite.com/graphql"
```

---

## 9. خلاصة

```
Apollo Client = قلب الاتصال في العميل

    ┌─────────────────────────────┐
    │      Apollo Client           │
    │  ┌────────────────────────┐ │
    │  │    InMemoryCache        │ │ ← تخزين النتائج
    │  └────────────────────────┘ │
    │  ┌────────────────────────┐ │
    │  │      splitLink          │ │ ← توجيه الطلبات
    │  │  ┌──────────────────┐  │ │
    │  │  │ Subscription?    │  │ │
    │  │  │ نعم → wsLink     │  │ │
    │  │  │ لا   → authLink  │  │ │
    │  │  │        → httpLink│  │ │
    │  │  └──────────────────┘  │ │
    │  └────────────────────────┘ │
    └─────────────────────────────┘
```
