# نشر التطبيق على Heroku — دليل شامل

> دليل خطوة بخطوة لنشر خادم مناسباتي على Heroku

---

## 📋 المتطلبات الأساسية

- حساب على [Heroku](https://heroku.com) (مجاني أو مدفوع)
- حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (مجاني)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) مثبت
- Git مثبت

---

## 🚀 خطوات النشر

### 1. إعداد MongoDB Atlas

#### أ. إنشاء Cluster
1. سجل دخول إلى [MongoDB Atlas](https://cloud.mongodb.com)
2. اختر **Create Cluster** → Free Tier (M0)
3. اختر المنطقة الأقرب لخوادم Heroku (مثل: US East)

#### ب. إنشاء Database User
1. **Database Access** → Add New Database User
2. **Authentication Method**: Password
3. اختر username وpassword قوي
4. **Database User Privileges**: Atlas admin (أو Read/Write any database)
5. احفظ Username وPassword لاحقاً

#### ج. السماح بالوصول من Heroku
1. **Network Access** → Add IP Address
2. اختر **Allow Access From Anywhere** (0.0.0.0/0)
3. أضف comment: "Heroku deployment"
4. **⚠️ مهم**: Heroku IPs ديناميكية، لذا يجب السماح لجميع IPs

#### د. الحصول على Connection String
1. في صفحة Cluster → **Connect**
2. اختر **Connect your application**
3. Driver: **Node.js**, Version: **6.8 or later**
4. انسخ Connection String:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. استبدل `<username>` و `<password>` ببياناتك
6. أضف اسم Database بعد `.net/`:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/event-booking?retryWrites=true&w=majority&appName=Cluster0
   ```

---

### 2. إعداد Heroku App

#### أ. إنشاء التطبيق
```bash
# تسجيل الدخول
heroku login

# إنشاء تطبيق جديد (اختر اسم فريد)
heroku create your-app-name
```

#### ب. إضافة المتغيرات البيئية

**الطريقة الأولى: Dashboard (موصى بها)**
1. افتح [Heroku Dashboard](https://dashboard.heroku.com)
2. اختر تطبيقك → **Settings** → **Reveal Config Vars**
3. أضف المتغيرات التالية:

| KEY | VALUE |
|-----|-------|
| `DATABASE_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/event-booking?retryWrites=true&w=majority` |
| `JWT_SECRET` | مفتاح قوي (استخدم generator أدناه) |
| `APP_URLS` | `https://your-frontend-domain.com` |
| `NODE_ENV` | `production` |

**الطريقة الثانية: CLI (بديلة)**
```bash
# استخدم single quotes لتجنب مشاكل PowerShell
heroku config:set DATABASE_URL='mongodb+srv://user:pass@...' -a your-app-name
heroku config:set JWT_SECRET='<strong-secret>' -a your-app-name
heroku config:set APP_URLS='https://your-frontend-domain.com' -a your-app-name
heroku config:set NODE_ENV='production' -a your-app-name
```

**💡 توليد JWT Secret قوي:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### ج. التحقق من المتغيرات
```bash
heroku config -a your-app-name
```

يجب أن ترى:
```
DATABASE_URL: mongodb+srv://...
JWT_SECRET:   xxxxxxxxxx
APP_URLS:     https://...
NODE_ENV:     production
```

---

### 3. نشر الكود

المشروع يستخدم **GitHub Actions** للنشر الأوتوماتيكي:

#### آلية العمل
1. عند Push إلى فرع `main`
2. GitHub Actions يبني المشروع ويختبره
3. ينسخ `server/dist/` المُجمَّع إلى فرع `server`
4. Heroku يسحب من فرع `server` ويُشغّل التطبيق

#### إعداد GitHub Actions للنشر على Heroku

**أ. احصل على Heroku API Key:**
```bash
heroku auth:token
```

**ب. أضف Secrets في GitHub:**
1. GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. أضف:
   - `HEROKU_API_KEY`: (من الخطوة السابقة)
   - `HEROKU_APP_NAME`: اسم تطبيق Heroku
   - `HEROKU_EMAIL`: email حسابك في Heroku

**ج. تفعيل Workflow:**
- Workflow موجود في `.github/workflows/build-and-deploy.yml`
- يعمل تلقائياً عند Push إلى `main`

---

### 4. النشر اليدوي (بديل لـ GitHub Actions)

#### أ. بناء المشروع
```bash
cd server
npm ci
npm run build
```

#### ب. نشر على Heroku
```bash
# إضافة Heroku Remote
heroku git:remote -a your-app-name

# نشر فرع server
git push heroku server:main

# أو نشر من main مباشرة
git subtree push --prefix server heroku main
```

---

## ✅ التحقق من النشر

### 1. فحص Logs
```bash
heroku logs --tail -a your-app-name
```

**يجب أن ترى:**
```
MongoDB connected successfully
Server started on port 4000
Apollo Server ready at /graphql
```

**إذا رأيت H10 Error:**
- أخطاء الاتصال بـ MongoDB
- راجع قسم "استكشاف الأخطاء" أدناه

### 2. اختبار Health Endpoint
```bash
curl https://your-app-name.herokuapp.com/health
```

**استجابة ناجحة:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

**استجابة فاشلة:**
```json
{
  "status": "degraded",
  "database": "disconnected",
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

### 3. اختبار GraphQL Playground
افتح: `https://your-app-name.herokuapp.com/graphql`

جرّب:
```graphql
query {
  events(limit: 5) {
    _id
    title
    creator {
      username
    }
  }
}
```

---

## 🐛 استكشاف الأخطاء

### خطأ H10: App Crashed

**السبب الشائع**: MongoDB connection timeout

**الحلول:**

#### 1. تحقق من DATABASE_URL
```bash
heroku config:get DATABASE_URL -a your-app-name
```

إذا كان فارغاً أو يشير إلى localhost:
```bash
heroku config:set DATABASE_URL='mongodb+srv://...' -a your-app-name
```

#### 2. تحقق من MongoDB Atlas Network Access
- Dashboard → Network Access
- تأكد من وجود `0.0.0.0/0`
- إذا لم يكن موجوداً، أضفه

#### 3. اختبر Connection String محلياً
```bash
cd server
# أضف DATABASE_URL في .env
npm run dev
```

إذا نجح محلياً لكن فشل على Heroku:
- المشكلة في Heroku Config Vars
- تأكد من عدم وجود أحرف خاصة غير مُرمّزة (URL-encoded)

#### 4. أعد تشغيل Dyno
```bash
heroku restart -a your-app-name
```

#### 5. فحص Build Logs
```bash
heroku builds -a your-app-name
heroku builds:output <build-id> -a your-app-name
```

### خطأ: Authentication Failed

**السبب**: Username أو Password خاطئ في MongoDB Atlas

**الحل:**
1. MongoDB Atlas → Database Access
2. تحقق من Username
3. إذا نسيت Password → Edit User → Reset Password
4. حدّث DATABASE_URL في Heroku Config Vars

### خطأ: CORS Error

**السبب**: APP_URLS لا يطابق domain الواجهة الأمامية

**الحل:**
```bash
# تحديث APP_URLS
heroku config:set APP_URLS='https://your-exact-frontend-domain.com' -a your-app-name

# لأكثر من domain (مفصولة بفاصلة)
heroku config:set APP_URLS='https://domain1.com,https://domain2.com' -a your-app-name
```

### خطأ: Connection Refused

**السبب**: Heroku يستخدم `$PORT` ديناميكياً

التطبيق يستخدم `process.env.PORT` تلقائياً - لا حاجة لتعديل

---

## 🔄 تحديث التطبيق

### عبر GitHub Actions (تلقائي)
```bash
# في المشروع المحلي
git add .
git commit -m "Update something"
git push origin main
# GitHub Actions يتولى الباقي
```

### نشر يدوي
```bash
cd server
npm run build
git add dist/
git commit -m "Build update"
git push heroku server:main
```

---

## 📊 المراقبة والأداء

### عرض Metrics
```bash
heroku logs --tail -a your-app-name
heroku ps -a your-app-name
```

### Restart Dyno
```bash
heroku restart -a your-app-name
```

### Scaling (للخطط المدفوعة)
```bash
# زيادة عدد Dynos
heroku ps:scale web=2 -a your-app-name

# تحسين نوع Dyno
heroku ps:type hobby -a your-app-name
```

---

## 🔐 الأمان والصيانة

### 1. تدوير JWT Secret دورياً
```bash
# توليد secret جديد
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# تحديثه في Heroku
heroku config:set JWT_SECRET='<new-secret>' -a your-app-name
```

**⚠️ تحذير**: هذا سيُخرج جميع المستخدمين الحاليين

### 2. مراجعة MongoDB Atlas Logs
- Dashboard → Monitoring → Logs
- تحقق من محاولات الوصول المشبوهة

### 3. Backup قاعدة البيانات
```bash
# MongoDB Atlas → Clusters → Backup
# أو استخدم mongodump محلياً
mongodump --uri="<your-mongodb-atlas-uri>" --out=./backup
```

---

## 📚 مصادر إضافية

- [Heroku Node.js Docs](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [GraphQL Deployment Guide](https://www.apollographql.com/docs/apollo-server/deployment/heroku/)
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) — حلول المشاكل الشائعة

---

## 🎯 Checklist النشر

- [ ] إنشاء MongoDB Atlas cluster
- [ ] إنشاء database user مع كلمة مرور قوية
- [ ] السماح بـ 0.0.0.0/0 في Network Access
- [ ] نسخ Connection String وإضافة اسم Database
- [ ] إنشاء Heroku app
- [ ] إضافة Config Vars: DATABASE_URL, JWT_SECRET, APP_URLS, NODE_ENV
- [ ] التحقق من Config Vars عبر `heroku config`
- [ ] نشر الكود (GitHub Actions أو يدوي)
- [ ] فحص Logs: `heroku logs --tail`
- [ ] اختبار `/health` endpoint
- [ ] اختبار `/graphql` endpoint
- [ ] تحديث Frontend environment variables (VITE_GRAPHQL_HTTP_URL)
- [ ] اختبار التطبيق end-to-end

---

**آخر تحديث:** فبراير 2026  
**المؤلف:** فريق مناسباتي
