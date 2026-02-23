# شرح إعداد الخادم الرئيسي (index.ts)

## 📋 نظرة عامة

ملف `index.ts` في المشروع هو **نقطة البداية الرئيسية** للخادم. يحتوي على إعداد Apollo Server مع Express و WebSockets.

---

##  الكود الرئيسي

### الاستيرادات الأساسية

```typescript
import express from "express";
import { createServer } from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import mongoose from "mongoose";

import { config } from "./config";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
```

### الشرح:

| المكتبة | الدور |
|--------|-------|
| `express` | إطار العمل للخادم |
| `http.createServer` | إنشاء خادم HTTP |
| `cors` | السماح بطلبات CORS |
| `jwt` | إدارة التوكنات |
| `@apollo/server` | خادم GraphQL |
| `GraphQL-tools` | بناء schema GraphQL |
| `ws` | WebSocket للـ Subscriptions |
| `mongoose` | الاتصال بـ MongoDB |

---

## 🚀 عملية الإعداد

### 1️⃣ **إنشاء الخادم**

```typescript
const app = express();
const httpServer = createServer(app);
```

**الشرح**:
- `app` = تطبيق Express
- `httpServer` = خادم HTTP (يدعم WebSockets)

---

### 2️⃣ **إنشاء Schema GraphQL**

```typescript
const schema = makeExecutableSchema({ typeDefs, resolvers });
```

**ما هو Schema؟**
- تعريف جميع الأنواع والعمليات المتاحة في GraphQL
- مثل "الخريطة" التي تخبر العميل ماذا يستطيع طلبه

**مثال بسيط**:
```graphql
type Query {
  users: [User]
  getUser(id: ID!): User
}

type User {
  id: ID!
  username: String!
  email: String!
}
```

---

### 3️⃣ **إعداد WebSockets**

```typescript
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);
```

**الشرح**:
- **WebSocket** = اتصال من طرفين (real-time)
- **الفائدة**: يمكن للخادم أن يرسل بيانات للعميل مباشرة بدون طلب!

**الحالات الاستخدام**:
- 🔔 إشعارات فورية
- 💬 الرسائل الحية (Live Messaging)
- 📊 تحديثات البيانات الفورية

---

### 4️⃣ **إنشاء Apollo Server**

```typescript
const server = new ApolloServer<GraphQLContext>({
  schema,
  plugins: [
    {
      async requestDidStart(requestContext) {
        const { operationName, query } = requestContext.request;
        if (query && operationName !== "IntrospectionQuery") {
          console.log(`📨 GraphQL (${operationName}):\n${query}`);
        }
      },
    },
  ],
});
```

**الشرح**:
- `server` = محرك GraphQL
- `TypeGenerics<GraphQLContext>` = نوع السياق (Context)
- **Plugins** = إضافات تراقب حياة الطلب

**Context** = بيانات مشتركة لكل الـ Resolvers مثل:
- معلومات المستخدم المصرح
- قاعدة البيانات

---

### 5️⃣ **بدء الخادم**

```typescript
await server.start();
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      // استخراج التوكن من Header
      const token = req.headers.authorization?.split(" ")[1];
      let userId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          userId = decoded.id;
        } catch {
          // توكن غير صالح
        }
      }

      return { userId, token };
    },
  })
);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
});
```

**الخطوات**:

#### أ. تشغيل Apollo Server
```typescript
await server.start();
```

#### ب. إضافة Middleware
```typescript
app.use("/graphql", cors(), express.json(), expressMiddleware(...))
```

#### ج. إنشاء Context
```typescript
context: async ({ req, res }) => {
  const token = req.headers.authorization?.split(" ")[1];
  // معالجة التوكن وإرجاع السياق
}
```

**ما هو Context؟**
- بيانات متاحة لجميع الـ Resolvers
- مثل: `userId` إذا كان المستخدم مصرح

#### د. بدء الاستماع
```typescript
httpServer.listen(PORT)
```

---

## 🔐 آلية المصادقة

```typescript
const token = req.headers.authorization?.split(" ")[1];
// Authorization: "Bearer eyJhbGc..."
//                        ↑ [0]  ↑ [1]
```

**التدفق**:
1. العميل يرسل: `Authorization: Bearer TOKEN`
2. الخادم يستخرج الـ TOKEN من الـ Header
3. التحقق من صحة التوكن باستخدام `jwt.verify()`
4. إذا صحيح → إضافة `userId` للـ context
5. الـ Resolvers تستخدم `userId` من context

---

## 💡 أمثلة عملية

### مثال 1: Resolver بسيط

```typescript
// في resolvers/event.ts
Query: {
  getEvents: async (_, __, context) => {
    // context.userId = معرف المستخدم
    // يمكنني استخدامه هنا
    const events = await Event.find();
    return events;
  }
}
```

### مثال 2: Resolver محمي (يحتاج مصادقة)

```typescript
Mutation: {
  createEvent: async (_, { eventData }, context) => {
    if (!context.userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const event = new Event({
      ...eventData,
      creatorId: context.userId,
    });
    return await event.save();
  }
}
```

---

## 🔄 تدفق طلب GraphQL

```
1. العميل يرسل Query
   ↓
2. Middleware CORS و JSON
   ↓
3. استخراج التوكن من Header
   ↓
4. التحقق من التوكن
   ↓
5. إنشاء Context
   ↓
6. استدعاء الـ Resolver المناسب
   ↓
7. الـ Resolver يستخدم Context و Database
   ↓
8. إرجاع النتيجة
   ↓
9. تحويل النتيجة حسب Schema
   ↓
10. إرسال JSON للعميل
```

---

## ⚙️ الخيارات المتقدمة

### 1. **CORS Middleware**

```typescript
cors<cors.CorsRequest>()
```

يسمح للتطبيقات الأخرى (مثل `localhost:5173`) بالوصول للخادم.

### 2. **JSON Parser**

```typescript
express.json()
```

تحويل JSON في جسم الطلب إلى كائن JavaScript.

### 3. **Error Handling**

```typescript
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await server.stop();
  process.exit(0);
});
```

إغلاق الخادم بشكل آمن.

---

## ❓ أسئلة شائعة

### س1: ما الفرق بين GraphQL و REST؟

| GraphQL | REST |
|---------|------|
| نقطة نهاية واحدة `/graphql` | نقاط نهاية متعددة `/api/users`, `/api/events` |
| العميل يطلب ما يريده فقط | الخادم يحدد ما يُرجع |
| تحديث فوري (Subscriptions) | Polling فقط |

### س2: لماذا WebSockets؟

**بدون WebSocket** (HTTP العادي):
```
العميل: هل هناك إشعارات جديدة؟ (كل ثانية)
الخادم: لا
الخادم: لا
الخادم: نعم!
```

**مع WebSocket**:
```
الخادم: لديك إشعار جديد! 🔔 (فوري)
```

### س3: ما هو Context؟

**Context** = حقيبة معلومات متاحة لكل الـ Resolvers:

```typescript
context = {
  userId: "123",
  token: "...",
  database: db,
}

// في أي Resolver
resolver(_, args, context) {
  console.log(context.userId);
}
```

---

## 🎯 النقاط المهمة

✅ **index.ts** هو نقطة البداية الرئيسية  
✅ **Apollo Server** يدير GraphQL  
✅ **WebSockets** لـ Subscriptions (الاشتراكات الفورية)  
✅ **Context** يحمل بيانات المستخدم  
✅ **JWT** للمصادقة والتحقق  

---

**📖 الخطوة التالية**: [اتصال MongoDB وقاعدة البيانات](./02-mongodb-connection.md)
