# 🚀 النشر على Vercel (مع قاعدة بيانات cPanel)

لقد اخترت الطريقة الأسرع والأفضل! سيتم استضافة التطبيق على **Vercel** (سرعة فائقة)، وقاعدة البيانات ستبقى على **استضافتك الحالية** (توفير التكلفة).

---

## 📋 الخطوة 1: تفعيل الاتصال بقاعدة البيانات (Remote MySQL)

1. اذهب إلى **cPanel** الخاص بموقعك.
2. ابحث عن **Remote MySQL**.
3. في خانة **Host**، أضف الرمز: `%`
   *(هذا يسمح لسيرفرات Vercel بالاتصال)*.
4. اضغط **Add Host**.

---

## 📋 الخطوة 2: رفع الكود إلى GitHub (أو GitLab/Bitbucket)

تأكد من رفع التعديلات الأخيرة:
```bash
git add .
git commit -m "Optimize for Vercel deployment"
git push origin main
```

---

## 📋 الخطوة 3: الإعداد في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new).
2. اختر مشروعك من GitHub واضغط **Import**.
3. في صفحة **Configure Project**، انزل إلى **Environment Variables**.
4. أضف المتغيرات التالية (انسخها من هنا):

### 🔑 متغيرات قاعدة البيانات (من cPanel):
| الاسم | القيمة |
|-------|--------|
| `DB_DIALECT` | `mysql` |
| `DB_HOST` | `192.250.229.32` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `seoagent_seoagent_db` (تأكد من الاسم في cPanel) |
| `DB_USER` | `seoagent_seoagent_user` (تأكد من الاسم في cPanel) |
| `DB_PASSWORD` | *(كلمة مرور المستخدم)* |

### 🔑 متغيرات التطبيق:
| الاسم | القيمة |
|-------|--------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | اتركه فارغاً أو ضع `https://your-project.vercel.app` لاحقاً |
| `SECRET` | *(أي نص طويل وعشوائي للتشويش)* |

### 🔑 متغيرات إضافية (اختيارية حسب استخدامك):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (لتسجيل الدخول بجوجل)
- `STRIPE_SECRET_KEY` (للمدفوعات)
- `SMTP_HOST`... (للبريد)

---

## 📋 الخطوة 4: اضغط Deploy 🚀

1. اضغط **Deploy**.
2. انتظر دقيقة أو دقيقتين.
3. مبروك! موقعك الآن يعمل على Vercel.

---

## ✅ بعد النشر:

1. انسخ رابط الموقع الجديد (مثلاً: `https://seo-agent-xyz.vercel.app`).
2. اذهب إلى **Settings -> Environment Variables** في Vercel.
3. أضف/عدّل `NEXT_PUBLIC_APP_URL` ليكون الرابط الجديد.
4. اذهب إلى **Deployments** واعمل **Redeploy** لتفعيل التغيير.

---

**ملاحظة:** إذا واجهت خطأ "Database Error" في Vercel، تأكد 100% أنك أضفت `%` في Remote MySQL في cPanel، وأن كلمة المرور صحيحة.
