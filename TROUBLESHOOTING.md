# 🛠️ استكشاف الأخطاء وإصلاحها

## مشاكل شائعة وحلولها

### 0️⃣ **مشاكل Docker/Compose (Ports or Startup)**

**الأعراض:**
```text
Bind for 0.0.0.0:4000 failed: port is already allocated
service "server" is unhealthy
```

**الأسباب المحتملة:**
- تعارض منافذ محلية
- قيمة `APP_URLS` لا تطابق منفذ الواجهة
- MongoDB يحتاج وقت إضافي ليصبح healthy

**الحل:**
1. عدّل المنافذ في `.env`:
   ```env
   CLIENT_HOST_PORT=8081
   SERVER_HOST_PORT=4001
   MONGO_HOST_PORT=27019
   APP_URLS=http://localhost:8081
   ```
2. تحقّق من صحة compose:
   ```bash
   docker compose config
   ```
3. أعد التشغيل مع تنظيف:
   ```bash
   docker compose down --remove-orphans -v
   docker compose up --build
   ```
4. راقب الحالة:
   ```bash
   docker compose ps
   ```

---

### 1️⃣ **CORS Error - No 'Access-Control-Allow-Origin' header**

**الخطأ:**
```text
Access to fetch at 'https://your-server.herokuapp.com/graphql' from origin 'https://your-domain.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**السبب:**  
السيرفر لا يسمح بطلبات من الدومين الخاص بك.

**الحل:**

#### على Heroku:
1. افتح dashboard → اختر التطبيق → Settings → Config Vars
2. أضف أو عدّل:
   ```
   APP_URLS = https://your-domain.com
   ```
3. لو عندك أكثر من دومين (مثلاً محلي + إنتاج):
   ```
   APP_URLS = http://localhost:5173,https://your-domain.com
   ```
4. احفظ → اعمل Restart all dynos

#### على السيرفر المحلي:
في ملف `server/.env`:
```env
APP_URLS=http://localhost:5173,https://your-domain.com
```

**⚠️ مهم جداً:**
- استخدم الدومين فقط **بدون مسار فرعي**
- ✅ صحيح: `https://preview.amrabdelhalim.me`
- ❌ خطأ: `https://preview.amrabdelhalim.me/web-booking-e1/`

---

### 2️⃣ **Mixed Content - WebSocket ws:// على HTTPS**

**الخطأ:**
```text
Mixed Content: An insecure WebSocket connection may not be initiated from a page loaded over HTTPS
```

**السبب:**  
الموقع يعمل على HTTPS لكن يحاول الاتصال بـ WebSocket عبر `ws://` بدلاً من `wss://`.

**الحل:**  
✅ **تم حله تلقائياً في الكود!**  
الكود الآن يحول `ws://` إلى `wss://` تلقائياً عند الفتح على HTTPS.

لو لسه المشكلة موجودة، تأكد من:
- **GitHub Variables** تحتوي على:
  ```
  VITE_GRAPHQL_HTTP_URL = https://your-server.com/graphql
  ```
  (بـ `https` وليس `http`)

---

### 3️⃣ **404 على assets (CSS/JS) بعد refresh**

**الخطأ:**
```http
GET https://your-domain.com/assets/index-xxx.js 404 (Not Found)
```

**السبب:**  
الـ `base` path خاطئ أثناء البناء.

**الحل:**

#### إذا كنت تستخدم GitHub Pages (مع مسار فرعي):
```text
VITE_BASE_PATH = /web-booking-e1/
VITE_APP_DOMAIN = https://your-username.github.io
```

#### إذا كنت تستخدم دومين مخصص (بدون مسار فرعي):
```text
VITE_BASE_PATH = /
VITE_APP_DOMAIN = https://your-custom-domain.com
```

#### إذا كنت تستخدم دومين مخصص + مسار فرعي:
```text
VITE_BASE_PATH = /web-booking-e1/
VITE_APP_DOMAIN = https://preview.amrabdelhalim.me
```

بعد التعديل:
1. احفظ المتغيرات في GitHub → Settings → Variables
2. أعد تشغيل الـ workflow
3. انتظر اكتمال البناء

---

### 4️⃣ **Redirect للدومين بدون المسار الفرعي عند refresh**

**المشكلة:**  
عند فتح `https://domain.com/web-booking-e1/events` والضغط على Refresh، يصبح `https://domain.com/events`.

**السبب:**  
GitHub Pages يرسل 404 للمسارات الفرعية، والـ `404.html` لا يعيد توجيه بشكل صحيح.

**الحل:**  
✅ **تم حله في آخر تحديث!**  
الكود الآن يحفظ المسار الفرعي بشكل صحيح.

تأكد من:
1. الـ workflow يحتوي على `.nojekyll`
2. GitHub Pages Source = branch `web` folder `/`
3. أعد تشغيل الـ workflow

---

### 5️⃣ **vite.svg 404**

**الخطأ:**
```http
GET https://domain.com/vite.svg 404
```

**السبب:**  
الملف في `client/public/` لكن المسار في `index.html` كان مطلق.

**الحل:**  
✅ **تم حله!**  
تم تغيير `/vite.svg` إلى `./vite.svg` (نسبي).

---

### 6️⃣ **أخطاء content.js (من إضافات المتصفح)**

**الخطأ:**
```text
Cannot read properties of null (reading 'runtime')
```

**السبب:**  
هذه الأخطاء من إضافات المتصفح (extensions) وليست من مشروعك.

**الحل:**  
✅ **تجاهلها تماماً**، أو جرّب Incognito/Private mode بدون إضافات.

---

## كيف أتأكد من إعدادات CORS على السيرفر؟

### طريقة 1: افحص logs على Heroku
1. افتح dashboard → اختر التطبيق → More → View logs
2. ابحث عن سطر:
   ```
   🌐 CORS origins: https://your-domain.com
   ```
3. تأكد أن الدومين صحيح

### طريقة 2: اختبار محلي
```bash
cd server
npm run dev
```
في الكونسول، ستشاهد:
```text
🌐 CORS origins: http://localhost:5173
```

---

## GitHub Pages لا يعمل؟

### تأكد من الإعدادات:
1. GitHub → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `web` folder `/` ✅
4. انتظر دقيقة → افتح الرابط

### تأكد من الـ workflow اكتمل:
1. GitHub → Actions
2. آخر workflow يجب أن يكون ✅ أخضر
3. لو ❌ أحمر، افتحه واقرأ الأخطاء

---

## المتغيرات المطلوبة - ملخص سريع

### GitHub Variables (Settings → Variables → Actions):
```text
VITE_GRAPHQL_HTTP_URL=https://your-server.herokuapp.com/graphql
VITE_APP_DOMAIN=https://your-domain.com
VITE_BASE_PATH=/web-booking-e1/
```

### Heroku Config Vars (Settings → Config Vars):
```text
APP_URLS=https://your-domain.com
DB_URL=mongodb+srv://...
JWT_SECRET=<strong-secret>
NODE_ENV=production
```

---

## 7️⃣ **Heroku H10 Error - App Crashed (MongoDB Connection Timeout)**

**الخطأ في Heroku Logs:**
```text
heroku[web.1]: Process exited with status 1
heroku[web.1]: State changed from starting to crashed
heroku[router]: at=error code=H10 desc="App crashed"
```

**السبب:**  
اتصال MongoDB يستغرق وقت طويل أو يفشل أثناء بدء التطبيق على Heroku.

**الحل:**

### 1. **تحقق من MongoDB URI على Heroku:**

التطبيق يدعم 3 متغيرات بيئة (بالترتيب):
- `DATABASE_URL` (موصى به لـ Heroku)
- `MONGODB_URI` (MongoDB Atlas standard)
- `DB_URL` (custom)

**فحص المتغيرات الحالية:**
```bash
heroku config -a your-app-name
```

**إضافة المتغير - طريقة GUI (مُوصى بها):**
1. افتح [Heroku Dashboard](https://dashboard.heroku.com)
2. اختر التطبيق → Settings
3. Reveal Config Vars
4. أضف `DATABASE_URL` والقيمة هي MongoDB Atlas URI كاملاً
5. لا حاجة لـ restart - Heroku يعيد التشغيل تلقائياً

**إضافة المتغير - طريقة CLI (بديلة):**
```bash
heroku config:set DATABASE_URL='mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority' -a your-app-name
# استخدم single quotes لتجنب مشاكل PowerShell
```

**القيمة يجب أن تكون كاملة مثل:**
```text
mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority&appName=Cluster0
```

⚠️ **ملاحظة مهمة:** 
- لا تستخدم `DB_URL` و `DATABASE_URL` معاً - استخدم واحد فقط
- إذا وجدت متغيرات متعددة، احذف التي لا تريدها
- البيئة المحلية تستخدم `.env` - لن تتأثر بتغييرات Heroku

### 2. **أضف IP Whitelist في MongoDB Atlas:**
1. اذهب إلى [MongoDB Atlas](https://cloud.mongodb.com)
2. Select Cluster → Network Access
3. أضف IP Address:
   - للـ development: `0.0.0.0/0` (مؤقتاً للاختبار)
   - للـ production: أضف IP الخاص بـ Heroku
4. أو استخدم `Allow access from anywhere` مؤقتاً

### 3. **بدّل من `localhost` إلى MongoDB Atlas:**
في `server/.env`:
```env
DB_URL=mongodb://127.0.0.1:27017/event-booking
# ❌ لا تشتغل على Heroku (محلي فقط)

# ✅ استخدم MongoDB Atlas
DB_URL=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/event-booking?retryWrites=true&w=majority
```

### 4. **الخادم الآن يحاول الاتصال مع Retry Logic:**
- محاولات الاتصال: حتى 5 مرات
- timeout: 15 ثانية لكل محاولة
- exponential backoff: تأخير متزايد بين المحاولات
- **المهم:** السيرفر لا ينتظر MongoDB - يبدأ ويحاول الاتصال في الخلفية

### 5. **Health Check Endpoint:**
تحقق من حالة التطبيق:
```bash
curl https://your-app.herokuapp.com/health
```

**الرد الناجح:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

**الرد في الحالة المتدهورة (بدون قاعدة بيانات):**
```json
{
  "status": "degraded",
  "database": "disconnected",
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

### 6. **Restart التطبيق على Heroku:**
```bash
heroku restart -a your-app-name
```

أو من Heroku Dashboard → More → Restart all dynos

---

## مازلت تواجه مشاكل؟

1. افحص **Network tab** في DevTools → هل الطلبات تصل للسيرفر؟
2. افحص **Console tab** → ما هي الأخطاء بالضبط؟
3. جرّب **Incognito mode** لاستبعاد مشاكل الإضافات
4. تأكد من **إعادة تشغيل الـ workflow** بعد أي تغيير في المتغيرات
5. على Heroku، اعمل **Restart all dynos** بعد تعديل Config Vars

---

**آخر تحديث:** فبراير 2026
