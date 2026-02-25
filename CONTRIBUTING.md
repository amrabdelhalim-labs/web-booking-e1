# دليل المساهمة — مناسباتي (web-booking-e1)

> **اقرأ هذا الملف قبل إجراء أي تغيير.**
> هذه القواعد غير قابلة للتفاوض وتُطبَّق عند مراجعة الكود. أي انحراف يتطلب مبرراً صريحاً.

---

## 1. المعمارية أولاً

قبل كتابة أي كود، اقرأ توثيق توجيهات AI:

| الملف | اقرأه عند |
|-------|---------|
| [`docs/ai/README.md`](docs/ai/README.md) | دائماً — ابدأ من هنا |
| [`docs/ai/architecture.md`](docs/ai/architecture.md) | إجراء أي تغيير في الخادم أو العميل |
| [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md) | إضافة كيان أو ميزة جديدة |

**ملخص القواعد الحرجة (القائمة الكاملة في `docs/ai/README.md`):**
- لا تستورد نموذج Mongoose مباشرة في المحلِّل (resolver) — جميع الوصول عبر `getRepositoryManager()`
- كل mutation لها محقق يستخدم رسائل خطأ عربية
- المحققون يرمون `GraphQLError` مع `extensions.code: "BAD_USER_INPUT"`
- المحلِّلات المحمية تستخدم `combineResolvers(isAuthenticated, ...)` — لا تضع فحوصات المصادقة inline
- جميع repositories هي singletons — استخدم دوالّ `get{Entity}Repository()`
- حالة المصادق في العميل عبر `useAuth()` — لا `useContext(AuthContext)` مباشرة
- تنسيق التواريخ عبر `formatDate*` utilities من `formatDate.ts` — لا inline `new Date(...)`

---

## 2. أسماء الفروع

```
main             ← كود جاهز للإنتاج فقط؛ لا تُودِع مباشرة
feat/<topic>     ← ميزة جديدة (مثال: feat/event-ratings)
fix/<topic>      ← إصلاح خطأ (مثال: fix/booking-date-validation)
docs/<topic>     ← توثيق فقط (مثال: docs/update-ai-guide)
chore/<topic>    ← أدوات، اعتماديات، إعداد (مثال: chore/update-prettier)
refactor/<topic> ← إعادة هيكلة بدون تغيير في السلوك
```

---

## 3. رسائل الإيداع (Commit Messages)

**الصيغة:** [Conventional Commits](https://www.conventionalcommits.org/) — **بالإنجليزية فقط**.

```
<type>(<scope>): <short description>

<body — list of changes, one per line starting with ->

<footer — breaking changes or issue references>
```

### الأنواع (Types)

| النوع | متى تستخدمه |
|-------|------------|
| `feat` | ميزة أو سلوك جديد |
| `fix` | إصلاح خطأ |
| `docs` | تغييرات في التوثيق فقط |
| `test` | إضافة أو تحديث اختبارات |
| `refactor` | إعادة هيكلة بدون تغيير في السلوك |
| `chore` | أدوات، إعداد، اعتماديات، CI |
| `style` | تنسيق فقط (بدون تغيير منطقي) |

### النطاقات (Scopes)

| النطاق | ينطبق على |
|--------|----------|
| `server` | مجلد `server/` |
| `client` | مجلد `client/` |
| `docs` | مجلد `docs/` |
| `ci` | `.github/workflows/` |
| `ai` | `docs/ai/` تحديداً |

### قواعد الإيداع

1. **سطر الموضوع ≤ 72 حرفاً**
2. **الموضوع يستخدم صيغة الأمر** — "add"، "fix"، "update"، ليس "added"، "fixed"
3. **لا نقطة في نهاية سطر الموضوع**
4. **النص الأساسي إلزامي للإيداعات غير التافهة** — اذكر كل تغيير مهم
5. **افصل الموضوع عن النص بسطر فارغ**
6. **تغيير منطقي واحد لكل إيداع** — لا تخلط server + client + docs في إيداع واحد

### أمثلة

```bash
# ✅ صحيح
git commit -m "feat(server): add event rating repository + resolver

- Add Rating Mongoose model with ref to Event and User
- Add RatingRepository extending BaseRepository
- Register in RepositoryManager as getRatingRepository()
- Add createRating and deleteRating mutations in schema
- Add isAuthenticated guard on createRating resolver
- Cascade delete ratings when parent Event is deleted"

# ✅ صحيح (patch)
git commit -m "fix(client): correct date display in EventCard

- Replace inline new Date().toLocaleDateString() with formatDateArabic()
- Fixes incorrect locale on Safari"

# ✅ صحيح (توثيق فقط)
git commit -m "docs(ai): update architecture diagram with rating layer"

# ❌ خاطئ — موضوع عربي
git commit -m "إضافة التقييمات"

# ❌ خاطئ — نطاق مختلط
git commit -m "feat: add ratings server and client"

# ❌ خاطئ — لا نص في إيداع غير تافه
git commit -m "feat(server): add repository pattern"

# ❌ خاطئ — صيغة الماضي
git commit -m "feat(server): added rating resolver"
```

---

## 4. استراتيجية التاجات (Tagging Strategy)

تُحدِّد التاجات **معالم الإصدار المهمة** — ليس كل إيداع.

### متى تنشئ تاجاً

| رفع الإصدار | المحفّز |
|------------|---------|
| `v1.0.0` (major) | أول إصدار جاهز للإنتاج، أو تغيير جذري (breaking change) |
| `v1.X.0` (minor) | ميزة جديدة مكتملة مع الاختبارات |
| `v1.X.Y` (patch) | إصلاح توثيق، إصلاح خطأ، أو تصحيح ثانوي |

**لا تضع تاجاً أبداً على:**
- إيداعات في منتصف العمل (work-in-progress)
- إيداعات بها اختبارات فاشلة أو أخطاء TypeScript
- إيداعات من نوع "Finished: X page"
- كل إيداع في فرع الميزة

### صيغة التاج — annotated tags حصراً

```bash
# تاج موصوف (استخدم دائماً -a — لا lightweight tags)
git tag -a v1.4.0 -m "v1.4.0 - Add Event Rating System

- Rating Mongoose model with refs to Event and User
- RatingRepository extending BaseRepository
- createRating / deleteRating mutations + resolvers
- isAuthenticated guard on createRating
- Cascade delete from Event
- Client: StarRating component + useRatings hook
- Server tests: 131 → 154 passing
- Client tests: 54 → 61 passing"

# تاج على إيداع سابق
git tag -a v1.0.0 <hash> -m "v1.0.0 - ..."

# رفع التاج إلى GitHub
git push origin v1.4.0
```

### قواعد رسالة التاج

1. **السطر الأول:** `vX.Y.Z - عنوان بشري واضح`
2. **النص:** قائمة بأهم التغييرات
3. **اذكر أعداد الاختبارات** عند تغييرها (قبل → بعد)
4. **بالإنجليزية فقط**

---

## 5. تنسيق الكود

**جميع الكود منسّق بـ Prettier** قبل كل إيداع. لا قرارات مسافات يدوية.

```bash
# تنسيق جميع الملفات (من جذر المشروع — يعمل على جميع الأنظمة)
node format.mjs

# التحقق بدون كتابة (CI — يخرج 1 إذا كان غير منسّق)
node format.mjs --check

# أو لكل حزمة:
cd server && npm run format
cd client && npm run format
```

**إعداد Prettier** (`.prettierrc.json` في `server/` و`client/`):
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

**القواعد:**
- مسافة بادئة 2 فراغ — دائماً، لا tabs
- علامات اقتباس مفردة للسلاسل النصية
- فواصل trailing في الهياكل متعددة الأسطر (متوافق مع ES5)
- أقصى عرض للسطر: 100 حرف
- لا تُعدِّل المسافات يدوياً — دع Prettier يقرر

---

## 6. قائمة التحقق قبل الإيداع

شغّل هذا قبل كل `git commit`:

```bash
# 1. فحص TypeScript — الخادم
cd server && npx tsc --noEmit

# 2. فحص TypeScript — العميل
cd client && npx tsc --noEmit

# 3. جميع اختبارات الخادم
cd server && npm run test:all

# 4. جميع اختبارات العميل
cd client && npm run test

# 5. Prettier — تأكد من تطبيق التنسيق
node format.mjs --check
```

**يجب أن ينجح كل ما سبق قبل الإيداع.** إيداع بأخطاء تجميع أو اختبارات فاشلة يجب ألا يصل إلى `main`.

---

## 7. تحديثات التوثيق

عند إضافة ميزة أو تغييرها:

| نوع التغيير | تحديثات التوثيق المطلوبة |
|------------|------------------------|
| كيان جديد (model + repo + resolver) | `docs/ai/feature-guide.md`، `docs/ai/architecture.md`، `docs/graphql-api.md` |
| عملية GraphQL جديدة | `docs/graphql-api.md`، `docs/ai/README.md` (جدول العمليات) |
| متغير بيئة جديد | `docs/ai/README.md` (قسم المتغيرات)، `README.md` |
| ملف اختبار جديد | `docs/testing.md` |
| تغيير في المصادقة | `docs/ai/architecture.md` (قسم المصادقة) |

**إيداعات التوثيق يجب أن تكون منفصلة عن إيداعات الكود** (استخدم النوع `docs`).

---

## 8. متطلبات الاختبار

| مجموعة الاختبار | الأمر | يجب أن تنجح قبل |
|----------------|-------|----------------|
| repositories الخادم | `cd server && npm run test` | أي إيداع على الخادم |
| الاختبارات الشاملة | `cd server && npm run test:comprehensive` | أي إيداع على الخادم |
| E2E API | `cd server && npm run test:e2e` | أي إيداع على الخادم |
| اختبارات العميل | `cd client && npm run test` | أي إيداع على العميل |

راجع [`docs/testing.md`](docs/testing.md) للتوثيق الكامل للاختبارات.
