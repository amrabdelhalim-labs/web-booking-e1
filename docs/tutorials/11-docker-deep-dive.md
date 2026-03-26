# درس 11: Docker من الصفر حتى CI

> درس تعليمي مفصل يشرح كيف تم تصميم Docker في `web-booking-e1` ولماذا.

---

## هدف الدرس

بعد هذا الدرس ستفهم:

- لماذا قُسمت الصور إلى build/runtime stages
- كيف يشغل `docker-compose.yml` المنظومة كاملة مع health checks
- كيف يعمل سكربت `deliver.mjs` كنقطة تسليم مركزية
- كيف يطبق CI سياسة `build` مقابل `publish`

---

## 1) الصورة الكبيرة

```text
Local/CI runner
   |
   | docker compose build/up
   v
[mongo] <--- depends_on --- [server] <--- depends_on --- [client]
   |                           |                             |
   | healthcheck               | /health                     | /health
   v                           v                             v
Database ready             API ready                    UI ready
```

الفكرة الأساسية: لا نعتبر الخدمة "جاهزة" بمجرد تشغيل الحاوية، بل بعد نجاح health check.

---

## 2) شرح Dockerfile الخاص بالخادم

### لماذا multi-stage؟

لأننا نحتاج:

1. كل devDependencies أثناء build (`tsc`)
2. أقل حجم ممكن في runtime

### تسلسل المراحل

1. `deps`: تثبيت الحزم
2. `build`: تجميع TypeScript إلى `dist`
3. `runtime`: تشغيل Node بإعتماديات production فقط

### الفائدة

- صورة أصغر
- سطح هجوم أقل
- وقت نقل أسرع في registry

---

## 3) شرح Dockerfile الخاص بالعميل

العميل React/Vite يحتاج build-time env vars (`VITE_*`) ثم إخراج static assets.

### المراحل

1. `build` عبر Node:
   - يثبت الحزم
   - ينفذ `npm run build`
2. `runtime` عبر Nginx:
   - يخدم محتوى `dist`
   - يوفر `/health`
   - يطبق `try_files` لدعم SPA routing

### نقطة مهمة

`ARG -> ENV` يسمح بقيم افتراضية آمنة وقت البناء، مع إمكانية override عبر compose أو CI.

---

## 4) docker-compose وكيف نقرأه

`docker-compose.yml` في المشروع يطبق 5 مبادئ:

1. **Service graph واضح**: `mongo -> server -> client`
2. **Health-first startup**: `depends_on.condition: service_healthy`
3. **Port isolation**: host ports عبر env
4. **Runtime config**: متغيرات الخادم مركزية
5. **Persistent DB**: volume لـ mongo

---

## 5) لماذا `validate-docker.mjs` مهم؟

هو "Config as Test":

- يتحقق من وجود الملفات المطلوبة
- يتحقق من snippets حرجة
- يكتشف merge conflict markers مبكرًا

الفكرة: لا تنتظر فشل pipeline الطويل لاكتشاف خلل هيكلي بسيط.

---

## 6) orchestrator: `scripts/docker/deliver.mjs`

بدل منطق كبير داخل YAML، المنطق التنفيذي كله في ملف JS versioned.

### ماذا يفعل؟

1. يشغّل `validate-docker.mjs`
2. يبني الصور
3. يوسم الصور بالتاج المناسب
4. يفحص أمنيًا عبر Trivy
5. (اختياري) smoke test مع cleanup دائم
6. (عند publish) يدفع الصور

### لماذا هذا التصميم؟

- سهل الاختبار محليًا بدون CI
- قابل للتطوير بدون تعقيد YAML
- يحقق الفصل بين "تعريف pipeline" و"تنفيذ logic"

---

## 7) أمن التسليم: build vs publish

### وضع build

- مناسب لـ PR وpush التحقق
- يسمح بتحذير عند غياب Trivy محليًا
- لا يوجد push للصور

### وضع publish

- يتطلب registry prefix صحيح
- يفشل إذا فشل scan
- يتطلب login ناجح

هذا يوازن بين سرعة feedback في التطوير وضمانات الأمان قبل النشر.

---

## 8) smoke test: لماذا مع cleanup إجباري؟

المشكلة الشائعة: اختبارات infra تترك containers أو volumes وتكسر تشغيلات لاحقة.

الحل في المشروع:

- `try/finally` داخل smoke
- `docker compose down --remove-orphans -v` دائمًا

هذا يجعل تشغيل smoke آمنًا للتكرار.

---

## 9) CI policy في workflow

`docker-delivery.yml` يطبق:

- preflight gates (workflow validation + tests + docker validation)
- publish مسموح فقط عبر dispatch وعلى `main`
- login conditional
- fallback افتراضي مناسب لـ GHCR

هذا يمنع النشر العرضي، ويحافظ على قناة release واضحة.

---

## 10) سيناريو عملي كامل

### A) تشغيل محلي سريع

```bash
cp .env.docker.example .env
docker compose up --build
```

### B) فحص البنية

```bash
node scripts/infra/validate-docker.mjs
docker compose config
```

### C) تسليم build + smoke

```bash
DOCKER_DELIVERY_MODE=build DOCKER_RUN_SMOKE=1 node scripts/docker/deliver.mjs
```

### D) publish (CI)

من `workflow_dispatch` فقط، بعد ضبط secrets.

---

## 11) أخطاء شائعة وكيف نتجنبها

1. **تعارض منافذ** -> غيّر `*_HOST_PORT` في `.env`
2. **فشل build للعميل بسبب env** -> راجع `VITE_*` وقت build
3. **فشل publish بسبب registry prefix** -> تأكد أن `DOCKER_IMAGE_REGISTRY` ينتهي بـ `/`
4. **بقايا موارد بعد smoke** -> استخدم السكربت الرسمي بدل أوامر يدوية
5. **سياسات scan غير مناسبة** -> عدّل `TRIVY_SEVERITY` و flags حسب سياسة الفريق

---

## 12) خلاصة هندسية

المنظومة هنا ليست "فقط Dockerfile"، بل "سلسلة تسليم متكاملة":

- تعريف خدمة صحيح
- تحقق بنيوي مبكر
- أمان قابل للضبط
- اختبار دخان cleanup-safe
- سياسة CI تمنع النشر غير المقصود

وهذا بالضبط ما يجعلها مناسبة للتعليم والاستخدام المهني معًا.
