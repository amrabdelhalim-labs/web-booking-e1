# الدرس الثاني: الاتصال بقاعدة البيانات MongoDB 🗄️

> **هدف الدرس:** فهم كيف يتصل الخادم بقاعدة بيانات MongoDB وكيف تُعرَّف الإعدادات بشكل آمن

---

## 1. لماذا نحتاج قاعدة بيانات؟

تخيّل أن التطبيق بدون قاعدة بيانات = **ذاكرة قصيرة**. كل ما تحفظه يختفي عند إعادة تشغيل الخادم!

قاعدة البيانات هي **الذاكرة الدائمة** للتطبيق — المناسبات، الحجوزات، بيانات المستخدمين، كلها تُحفظ هناك.

---

## 2. ما هو MongoDB؟

| الخاصية | الشرح |
|---------|-------|
| **نوعه** | قاعدة بيانات NoSQL (غير علائقية) |
| **التخزين** | يحفظ البيانات كـ **Documents** (وثائق) شبيهة بـ JSON |
| **المرونة** | لا يشترط نموذجاً ثابتاً كـ SQL |
| **السرعة** | سريع جداً للقراءة |
| **الاستخدام** | شائع جداً مع Node.js / JavaScript |

**مثال واضح:**
```text
  "_id": "64ab12...",
{
// بيانات مستخدم محفوظة في MongoDB
  "username": "أحمد",
  "email": "ahmed@example.com",
  "password": "$2b$12$..."
}
```

---

## 3. ما هو Mongoose؟

Mongoose هو **مكتبة وسيطة** (ODM) تجعل التعامل مع MongoDB أسهل:

```text
تطبيق Node.js  ─→  Mongoose  ─→  MongoDB
```

بدون Mongoose: تكتب استعلامات معقدة بيديك.  
مع Mongoose: تكتب كود TypeScript نظيف وسهل.

---

## 4. ملف الإعدادات `config/index.ts`

```typescript
export const config = {
  port: process.env.PORT || 4000,
  dbUrl: process.env.DB_URL || "mongodb://localhost:27017/event-booking",
  jwtSecret: process.env.JWT_SECRET || "default_secret",
  appUrls: (process.env.APP_URLS || "http://localhost:5173")
              .split(",")
              .map(url => url.trim())
              .filter(Boolean),
};
```

### شرح كل سطر:

**`process.env.PORT || 4000`**  
→ ابحث عن متغير بيئة اسمه `PORT`. إذا لم يوجد فاستخدم `4000` كافتراضي.

**`process.env.DB_URL || "mongodb://localhost:27017/event-booking"`**  
→ عنوان قاعدة البيانات. في الإنتاج يكون عنوان بعيد (Atlas مثلاً).

**`process.env.JWT_SECRET || "default_secret"`**  
→ المفتاح السري لتشفير الـ Tokens. **لا تشاركه أبداً!**

**`appUrls: (...).split(",").map(...).filter(...)`**  
→ قائمة العناوين المسموح بها لـ CORS. يقبل عناوين متعددة مفصولة بفاصلة.

---

## 5. لماذا نستخدم `process.env`؟

### المشكلة:
إذا كتبت الإعدادات مباشرة في الكود:
```typescript
const jwtSecret = "my-super-secret-key";
// ❌ خطأ - لا تفعل هذا أبداً!
```
فعند رفع الكود على GitHub، سيراه الجميع! 😱

### الحل - ملف `.env`:
```text
# .env (لا يُرفع على GitHub أبداً)
PORT=4000
DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/mydb
JWT_SECRET=my-real-secret-256-chars-long
APP_URLS=https://mysite.com,https://www.mysite.com
```

ثم في الكود: `process.env.JWT_SECRET` → يقرأ القيمة من الملف.

> **قاعدة ذهبية:** الملف `.env` لا يُرفع أبداً على Git! ولذلك نراه في `.gitignore`

---

## 6. الاتصال بـ MongoDB في `index.ts`

```typescript
await mongoose.connect(config.dbUrl);
// من ملف server/src/index.ts
```

### ماذا يحدث هنا؟

```text
3. mongoose.connect() يتصل بـ MongoDB
2. يتصل Apollo Server بالإنترنت (HTTP + WebSocket)
1. يبدأ الخادم
4. عند نجاح الاتصال → "✅ Connected to MongoDB"
5. إذا فشل  // يظهر الخطأ ويتوقف التطبيق
```

### لماذا `await`؟

الاتصال بقاعدة البيانات يستغرق وقتاً (قد يكون عبر الشبكة).  
`await` يعني: "انتظر حتى يكتمل الاتصال **قبل** أن تكمل."

بدون `await`، قد يحاول المستخدم حفظ بيانات قبل أن يكتمل الاتصال! 💥

---

## 7. نماذج البيانات (Mongoose Models)

بعد الاتصال، نستخدم النماذج للتعامل مع البيانات:

```typescript
const userSchema = new Schema({
// مثال مبسط من models/user.ts
  username: { type: String, required: true },
  email:    { type: String, required: true },
  password: { type: String, required: true },
});

const User = model("User", userSchema);
```

**كيف يُستخدم؟**
```typescript
const user = await User.create({ username: "أحمد", email: "...", password: "..." });
// إنشاء مستخدم جديد

// بحث بالبريد الإلكتروني
const user = await User.findOne({ email: "ahmed@example.com" });
```

---

## 8. ملخص رحلة الاتصال

```text
config/index.ts
    ↓ (متغيرات البيئة)
ملف .env
    ↓ (يقرأ الإعدادات)
server/src/index.ts
    ↓ (mongoose.connect)
MongoDB Database
    ↓ (يتلقى الطلبات عبر)
Mongoose Models (User, Event, Booking)
```

---

## 10. خلاصة

- **MongoDB** = قاعدة بيانات NoSQL تحفظ البيانات كوثائق JSON
- **Mongoose** = المكتبة التي تسهّل استخدام MongoDB مع TypeScript
- **config.ts** = مكان واحد لجميع إعدادات التطبيق
- **process.env** = الطريقة الآمنة لتمرير الإعدادات السرية
- **await mongoose.connect()** = ننتظر الاتصال قبل البدء باستقبال الطلبات
