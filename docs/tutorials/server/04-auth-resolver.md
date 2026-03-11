# الدرس الرابع: محلّل المصادقة — التسجيل وتسجيل الدخول 🔐

> **هدف الدرس:** فهم كيف تعمل المصادقة (Authentication) عبر GraphQL Mutations

---

## 1. ما هو الـ Resolver؟

في GraphQL:
- **المخطط (Schema)** يقول: "هناك mutation اسمه `login`، يأخذ email وpassword ويُرجع AuthData"
- **الـ Resolver** يقول: "وهذا هو **الكود الفعلي** الذي ينفّذ هذه العملية"

```text
المخطط (Schema) = القائمة في المطعم
الـ Resolver = الطباخ الذي ينفّذ الطلبات
```

---

## 2. هيكل ملف `resolvers/auth.ts`

```typescript
export const authResolver = {
  Mutation: {
    login: async (...) => { ... },
    createUser: async (...) => { ... },
    updateUser: combineResolvers(isAuthenticated, async (...) => { ... }),
    deleteUser: combineResolvers(isAuthenticated, async (...) => { ... }),
  },
};
```

---

## 3. دالة `login` — تسجيل الدخول

### الكود:
```typescript
login: async (_parent, { email, password }) => {
  // خطوة 1: التحقق من صحة المدخلات
  validateLoginInput(email, password);

  // خطوة 2: البحث عن المستخدم
  const repos = getRepositoryManager();
  const user = await repos.user.findByEmail(email);
  if (!user) {
    throw new GraphQLError("هذا الحساب غير موجود لدينا!!", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // خطوة 3: مقارنة كلمة المرور
  const isEqual = await bcrypt.compare(password, user.password);
  if (!isEqual) {
    throw new GraphQLError("خطأ في البريد الإلكتروني أو كلمة المرور!!");
  }

  // خطوة 4: إنشاء Token وإرجاعه
  const token = jwt.sign({ id: user.id }, config.jwtSecret);
  return { userId: user.id, token, username: user.username };
},
```

### الرحلة خطوة بخطوة:

```text
[1] validateLoginInput: هل البريد صحيح؟ هل كلمة المرور طويلة كفاية؟
    ↓
العميل يرسل: { email: "x@x.com", password: "123456" }
    ↓
[2] repos.user.findByEmail: ابحث في MongoDB
    ↓ (وجد/لم يجد)
[3] bcrypt.compare: قارن كلمة المرور المُدخلة بالمشفرة في قاعدة البيانات
    ↓ (تطابق/لم يتطابق)
[4] jwt.sign: أنشئ Token يُثبت هوية المستخدم
    ↓
[5] أرجع { userId, token, username } للعميل
```

---

## 4. لماذا `bcrypt.compare` وليس مقارنة مباشرة؟

**المشكلة:** كلمات المرور لا تُحفظ كنص عادي في قاعدة البيانات.

```text
ما يُحفظ في DB: "$2b$12$eImiTXuWVxfM37uY4JANjQ.../..."
ما يُرسله المستخدم: "123456"
```

`bcrypt.compare` تفهم الصيغة المشفرة وتقارن بذكاء:
```typescript
// yجحص هل "123456" هي نفس الكلمة المشفرة؟
const isEqual = await bcrypt.compare("123456", "$2b$12$...");
// isEqual = true أو false
```

---

## 5. دالة `createUser` — إنشاء حساب جديد

```typescript
createUser: async (_parent, { userInput }) => {
  // [1] التحقق من صحة المدخلات
  validateUserInput(userInput);

  // [2] هل البريد مستخدم مسبقاً؟
  const repos = getRepositoryManager();
  const emailTaken = await repos.user.emailExists(userInput.email);
  if (emailTaken) {
    throw new GraphQLError("هذا الحساب موجود مسبقًا لدينا!!");
  }

  // [3] تشفير كلمة المرور (12 = قوة التشفير)
  const hashedPassword = await bcrypt.hash(userInput.password, 12);

  // [4] حفظ المستخدم في قاعدة البيانات
  const user = await repos.user.create({
    username: userInput.username,
    email: userInput.email,
    password: hashedPassword,
  });

  // [5] إنشاء Token وإرجاعه (تسجيل الدخول التلقائي)
  const token = jwt.sign({ id: user.id }, config.jwtSecret);
  return { userId: user.id, token, username: user.username };
},
```

### لماذا نُرجع Token مباشرة بعد التسجيل؟

لأننا نريد **تسجيل الدخول التلقائي** — المستخدم سجّل ووجد نفسه داخل التطبيق فوراً بدون خطوة إضافية.

---

## 6. دالة `updateUser` — تعديل الملف الشخصي

```typescript
updateUser: combineResolvers(
  isAuthenticated,   // ← حارس: يمنع غير المسجلين
  async (_parent, { updateUserInput }, context) => {
    validateUpdateUserInput(updateUserInput);

    const repos = getRepositoryManager();
    const user = await repos.user.findById(context.user!._id.toString());

    // تعديل فقط ما تم إرساله
    if (updateUserInput.username) {
      user.username = updateUserInput.username;
    }
    if (updateUserInput.password) {
      user.password = await bcrypt.hash(updateUserInput.password, 12);
    }

    await user.save();
    return user;
  }
),
```

**`combineResolvers`** = يجمع محللَين في سلسلة:
1. `isAuthenticated` يتحقق أولاً → إذا فشل، يوقف كل شيء
2. إذا نجح → ينتقل للمحلل الفعلي

---

## 7. دالة `deleteUser` — حذف الحساب (Cascade Delete)

```typescript
deleteUser: combineResolvers(
  isAuthenticated,
  async (_parent, _args, context) => {
    const repos = getRepositoryManager();
    const userId = context.user!._id.toString();

    // [1] ابحث عن كل IDs مناسبات هذا المستخدم
    const userEventIds = await repos.event.getEventIdsByCreator(userId);

    // [2] احذف كل الحجوزات المرتبطة (بالمستخدم + بمناسباته)
    await repos.booking.deleteByUserCascade(userId, userEventIds);

    // [3] احذف كل مناسبات المستخدم
    await repos.event.deleteWhere({ creator: userId });

    // [4] احذف حساب المستخدم نفسه
    await repos.user.delete(userId);

    return true;
  }
),
```

**لماذا هذا الترتيب؟**

تخيّل: حذفنا المستخدم أولاً ← الآن الحجوزات والمناسبات "أيتام" في قاعدة البيانات!

الترتيب الصحيح: احذف الأولاد قبل الأب ← البيانات المرتبطة أولاً، ثم المستخدم.

---

## 8. ما هو JWT Token؟

```typescript
const token = jwt.sign({ id: user.id }, config.jwtSecret);
```

JWT = **JSON Web Token**  
هو وثيقة رقمية مشفرة تثبت هوية المستخدم.

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YWIxMiJ9.abc123
شكل الـ Token:
|_____ الرأس (Header) _____|.___ البيانات (Payload) ___.__|__التوقيع__|
```

**الـ Payload** يحوي: `{ id: "64ab12..." }` = معرّف المستخدم  
**الـ Signature** تُثبت أن الـ Token لم يُعدَّل

---

## 9. خلاصة تدفق المصادقة

```text
Client → createUser(username, email, password)
تسجيل جديد:
    ↓ validate → check email → hash password → save → jwt.sign
Server → { userId, token, username }
Client  // يحفظ الـ token في localStorage ✓

تسجيل دخول:
Client → login(email, password)
    ↓ validate → findByEmail → bcrypt.compare → jwt.sign
Server → { userId, token, username }
Client  // يحفظ الـ token في localStorage ✓

طلب محمي (updateUser):
Client  // يُرسل token في رأس الطلب
    ↓ isAuthenticated يتحقق  // يمرر context.user
Server  // ينفّذ العملية ✓
```
