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
| `client/Dockerfile` | بناء الواجهة ثم تقديمها عبر Nginx |
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
- `build` stage: `npm run build` لإنتاج `dist`
- `runtime` stage: `npm ci --omit=dev --ignore-scripts` + نسخ `dist` فقط
- **HEALTHCHECK داخل الصورة:** يستدعي `fetch` على `http://127.0.0.1:4000/health` (Node مدمج) بفواصل زمنية متوافقة مع تعريف `healthcheck` في `docker-compose.yml`. الفائدة: تشغيل `docker run` أو منصات أخرى بدون Compose ما زال يعرض حالة صحّة الحاوية بشكل موحّد، وليس الاعتماد فقط على إعدادات Compose.

### client image

- build stage عبر Node
- `CYPRESS_INSTALL_BINARY=0 npm ci` لتقليل artifacts غير التشغيلية
- runtime عبر `nginx:alpine`
- `try_files ... /index.html` لدعم React Router

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
