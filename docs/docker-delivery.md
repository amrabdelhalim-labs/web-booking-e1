# Docker Delivery Guide

مرجع تشغيلي رسمي لإعداد Docker في مشروع `web-booking-e1`.

---

## 1) نظرة عامة

تغليف Docker في هذا المشروع يغطي:

- تشغيل المنظومة كاملة محليًا: `client + server + mongo`
- بناء صور إنتاجية متعددة المراحل
- فحص أمني للصور عبر Trivy
- smoke test مع تنظيف إجباري للموارد
- workflow CI مخصص (`docker-delivery.yml`) بنمطي `build` و`publish`

---

## 2) الملفات الأساسية

| الملف | الدور |
|------|------|
| `docker-compose.yml` | تعريف الخدمات والاعتماديات وhealth checks |
| `server/Dockerfile` | بناء وتشغيل الخادم كصورة runtime خفيفة |
| `client/Dockerfile` | تثبيت الاعتماديات + تشغيل بناء Vite عند بدء الحاوية ثم Nginx |
| `client/docker-entrypoint.sh` | يطبّق `VITE_*` من البيئة (أو القيم الافتراضية المخبوزة) ثم `npm run build` |
| `client/nginx.conf` | SPA fallback + health endpoint |
| `scripts/infra/validate-docker.mjs` | فحص تكامل إعداد Docker قبل التسليم |
| `scripts/docker/deliver.mjs` | orchestrator للبناء/الفحص/الـ smoke/النشر |
| `.github/workflows/docker-delivery.yml` | CI pipeline لوضعي build/publish |
| `.env.docker.example` | قالب إعدادات البيئة |

---

## 3) التشغيل المحلي

### 3.1 الإعداد

```bash
cp .env.docker.example .env
```

على Windows يمكن إنشاء `.env` يدويًا بنفس القيم.

### 3.2 التشغيل

```bash
docker compose up --build
```

### 3.3 نقاط الوصول

- Client: `http://localhost:8080`
- Server GraphQL: `http://localhost:4000/graphql`
- Server health: `http://localhost:4000/health`

### 3.4 الإيقاف والتنظيف

```bash
docker compose down --remove-orphans -v
```

---

## 4) استراتيجية المنافذ

لا يتم hardcode لمنافذ host. استخدم:

- `CLIENT_HOST_PORT` (افتراضي `8080`)
- `SERVER_HOST_PORT` (افتراضي `4000`)
- `MONGO_HOST_PORT` (افتراضي `27018`)

الهدف: تقليل تعارض المنافذ محليًا وفي CI.

---

## 5) استراتيجية البناء

### server image

- `deps` stage: `npm ci --ignore-scripts`
- `build` stage: `npm run build` ثم `npm prune --omit=dev --ignore-scripts` لإزالة devDependencies من `node_modules` دون تثبيت إنتاجي ثانٍ
- `runtime` stage: نسخ `package*.json` و`node_modules` المُقلَّصة و`dist` فقط
- **HEALTHCHECK داخل الصورة:** يستدعي `fetch` على `http://127.0.0.1:4000/health` (Node مدمج) بفواصل زمنية متوافقة مع تعريف `healthcheck` في `docker-compose.yml`. الفائدة: تشغيل `docker run` أو منصات أخرى بدون Compose ما زال يعرض حالة صحّة الحاوية بشكل موحّد، وليس الاعتماد فقط على إعدادات Compose.

### client image

- `deps` stage: `CYPRESS_INSTALL_BINARY=0 npm ci` ثم نسخ المصدر (بدون بناء Vite داخل مرحلة الصورة الأولى)
- `runner`: Node + Nginx؛ عند **كل** `docker run` يشغّل `docker-entrypoint.sh` أمر `npm run build` باستخدام `VITE_*` من بيئة الحاوية، مع fallback إلى `DEFAULT_VITE_*` المخبوزة وقت `docker build` (عبر `ARG`/`ENV`)
- بعد البناء: نسخ `dist` إلى `/usr/share/nginx/html` ثم `nginx`
- `try_files ... /index.html` في `nginx.conf` لدعم React Router
- **ملاحظة:** أول تشغيل أبطأ من صورة ثابتة جاهزة؛ راجع `start_period` في Compose (120s) ومهلة smoke في `deliver.mjs`

---

## 6) التسليم المركزي

### الأمر الرئيسي

```bash
node scripts/docker/deliver.mjs <mode>
```

حيث `<mode>`:

- `build`: بناء + scan (+ smoke اختياري) بدون push
- `publish`: نفس المراحل مع push إجباري للصور

### متغيرات مهمة

| المتغير | الوصف |
|--------|------|
| `DOCKER_DELIVERY_MODE` | `build` أو `publish` |
| `DOCKER_IMAGE_TAG` | tag الصور |
| `DOCKER_IMAGE_REGISTRY` | prefix registry وينتهي بـ `/` |
| `DOCKER_RUN_SMOKE` | `1` لتفعيل smoke |
| `TRIVY_SEVERITY` | الافتراضي `HIGH,CRITICAL` |
| `TRIVY_IGNORE_STATUS_FIXED` | الافتراضي `1` |

---

## 7) الفحص الأمني (Trivy)

السلوك الحالي:

- يحاول أولًا `trivy` المحلي
- إن لم يوجد، يستخدم containerized Trivy
- في `build`: فشل توفر Trivy مسموح (تحذير)
- في `publish`: فشل الفحص أو غياب Trivy يوقف النشر

ملاحظة: تم قصر الفحص على `vuln` حسب سياسة المشروع الحالية.

---

## 8) smoke test

عند `DOCKER_RUN_SMOKE=1`:

1. `docker compose up -d --build`
2. انتظار `server` و`client` حتى `healthy`
3. `docker compose down --remove-orphans -v` دائمًا (حتى عند الفشل)

هذا يمنع ترك containers/volumes معلقة بعد الاختبارات.

---

## 9) GitHub Actions policy

workflow: `.github/workflows/docker-delivery.yml`

- `pull_request` و`push(main)` يعملان افتراضيًا على وضع `build`
- `publish` متاح فقط عبر `workflow_dispatch` وعلى `main`
- login للسجل يتم فقط عند `publish`
- fallback افتراضي لـ GHCR:
  - registry host: `ghcr.io`
  - image prefix: `ghcr.io/<owner>/`

Secrets المطلوبة عند publish:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- اختياري:
  - `DOCKER_REGISTRY_HOST`
  - `DOCKER_IMAGE_REGISTRY`

---

## 10) تعريف الجاهزية قبل الإيداع

اعتبر التهيئة "جاهزة للإيداع" إذا نجحت جميع الخطوات:

```bash
node scripts/infra/validate-docker.mjs
node validate-workflow.mjs
docker compose config
```

وللتحقق التشغيلي:

```bash
DOCKER_DELIVERY_MODE=build DOCKER_RUN_SMOKE=1 node scripts/docker/deliver.mjs
```

---

## 11) ملاحظات حوكمة

- لا تُعدّل workflow يدفع صورًا تلقائيًا على كل push دون gate
- لا تنسخ سياسات Trivy من مشاريع أخرى حرفيًا
- لا تستخدم force publish patterns خارج السياسة المحددة
- أبقِ منطق التسليم داخل السكربتات، والـ workflow رفيعًا

---

## 12) سحب الصور من GHCR وتشغيلها

### 12.1 أسماء الحزم على السجل

بعد نشر ناجح (`publish`)، تُخزَّن صورتان بأسماء تتبع المستودع:

| الصورة على GHCR | الوصف |
|-----------------|--------|
| `ghcr.io/<OWNER>/web-booking-e1-server:<tag>` | خادم GraphQL (Node) |
| `ghcr.io/<OWNER>/web-booking-e1-client:<tag>` | واجهة React المبنية (Nginx) |

استبدل `<OWNER>` بمالك المستودع على GitHub (أحرف صغيرة في عنوان الصورة)، و`<tag>` بوسم البناء (مثل `main` أو SHA أو وسم يدوي من `workflow_dispatch`).

**تسجيل الدخول (للحزم الخاصة):**

```bash
docker login ghcr.io
```

### 12.2 متغيرات التشغيل — الخادم (`server`)

يُقرأ التالي **عند التشغيل** (مرّرها بـ `-e` أو عبر منصة التنسيق):

| المتغير | مطلوب | مثال | ملاحظة |
|---------|--------|------|--------|
| `DATABASE_URL` أو `MONGODB_URI` | نعم | `mongodb://mongo:27017/event-booking` | عنوان MongoDB |
| `JWT_SECRET` | نعم (إنتاج) | سلسلة عشوائية قوية | لا تستخدم القيمة الافتراضية في الإنتاج |
| `APP_URLS` | يُفضّل | `http://localhost:8080` | أصول CORS؛ يمكن فصل عدة عناوين بفاصلة |
| `PORT` | لا | `4000` | المنفذ داخل الحاوية |

### 12.3 عميل الواجهة (`client`) وملفات Vite

تُقرأ `VITE_GRAPHQL_HTTP_URL` و`VITE_GRAPHQL_WS_URL` و`VITE_APP_DOMAIN` و`VITE_BASE_PATH` **عند بدء الحاوية** (قبل `npm run build` داخل الـ entrypoint). إن لم تُمرَّر، تُستخدم القيم المخبوزة في الصورة كـ `DEFAULT_VITE_*` (تُضبط عند `docker build` عبر `build.args` في Compose أو `--build-arg`).

- **Compose:** `docker-compose.yml` يمرّر نفس المتغيرات في `environment` وفي `build.args` (كـ `DEFAULT_VITE_*`) حتى يتطابق السلوك المحلي مع إعادة البناء عند التشغيل.
- **صورة من GHCR:** مرّر `-e VITE_*` عند `docker run` لتوجيه الواجهة لعنوان API/WS يصل إليه **المتصفح** (وليس بالضرورة اسم خدمة Docker داخليًا).

### 12.4 مثال: تشغيل الخادم مع MongoDB على شبكة Docker

```bash
docker network create booking-net

docker run -d --name booking-mongo --network booking-net -v booking_mongo:/data/db mongo:7-jammy

docker run -d --name booking-server --network booking-net -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e DATABASE_URL=mongodb://booking-mongo:27017/event-booking \
  -e JWT_SECRET=replace_with_strong_secret \
  -e APP_URLS=http://localhost:8080 \
  ghcr.io/<OWNER>/web-booking-e1-server:<tag>
```

التحقق: `curl -fsS http://localhost:4000/health`

### 12.5 مثال: تشغيل الواجهة فقط (صورة منشورة مسبقًا)

```bash
docker run -d --name booking-client -p 8080:80 \
  -e VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql \
  -e VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql \
  -e VITE_APP_DOMAIN=http://localhost:8080 \
  -e VITE_BASE_PATH=/ \
  ghcr.io/<OWNER>/web-booking-e1-client:<tag>
```

أول تشغيل يُعيد بناء الواجهة داخل الحاوية؛ انتظر حتى يصبح الـ healthcheck ناجحًا. إن لم تمرّر `-e`، تُستخدم قيم `DEFAULT_VITE_*` المخبوزة عند بناء الصورة في CI.

### 12.6 PowerShell (Windows)

لا تستخدم `\` لاستمرار السطر؛ إمّا سطر واحد لـ `docker run`، أو backtick `` ` `` في نهاية كل سطر (ما عدا الأخير).
