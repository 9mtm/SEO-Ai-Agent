# 📦 دليل نشر MCP Server على NPM

## ✅ الإعدادات الجاهزة

تم تحضير كل شيء للنشر:
- ✅ package.json محدث (version 1.1.0)
- ✅ .npmignore جاهز
- ✅ LICENSE file موجود
- ✅ README.md كامل
- ✅ TypeScript declarations (.d.ts)
- ✅ اختبار الحزمة نجح (39.7 kB)

## 📋 خطوات النشر

### 1️⃣ تسجيل الدخول في NPM

إذا لم تكن مسجل دخول:

```bash
npm login
```

سيطلب منك:
- Username
- Password
- Email
- OTP (إذا كان two-factor authentication مفعّل)

### 2️⃣ التحقق من المعلومات

```bash
npm whoami
```

يجب أن يظهر اسم المستخدم الخاص بك.

### 3️⃣ اختبار الحزمة محلياً

```bash
cd C:\MAMP\htdocs\flowxtra\hr_blogs\seo_ai_agent\mcp-server
npm pack
```

سينشئ ملف: `seo-agent-mcp-server-1.1.0.tgz`

يمكنك اختباره محلياً:

```bash
npm install -g ./seo-agent-mcp-server-1.1.0.tgz
```

### 4️⃣ النشر على NPM

**نشر عادي (public):**

```bash
npm publish --access public
```

**أو نشر كـ beta version أولاً:**

```bash
npm publish --tag beta --access public
```

### 5️⃣ التحقق من النشر

بعد النشر، تحقق من الحزمة:

```bash
npm view seo-agent-mcp-server
```

أو زر الصفحة:
https://www.npmjs.com/package/seo-agent-mcp-server

### 6️⃣ اختبار التثبيت

اختبر أن المستخدمين يمكنهم تثبيت الحزمة:

```bash
npx seo-agent-mcp-server@latest --version
```

## 🔄 تحديثات مستقبلية

عند إضافة features جديدة:

### 1. تحديث الإصدار

في `package.json`:

```json
{
  "version": "1.2.0"  // Major.Minor.Patch
}
```

**قواعد الإصدارات:**
- **Patch** (1.1.1): Bug fixes فقط
- **Minor** (1.2.0): Features جديدة (backward compatible)
- **Major** (2.0.0): Breaking changes

أو استخدم:

```bash
npm version patch  # 1.1.0 → 1.1.1
npm version minor  # 1.1.0 → 1.2.0
npm version major  # 1.1.0 → 2.0.0
```

### 2. Build وTest

```bash
npm run build
npm test
```

### 3. Commit وTag

```bash
git add .
git commit -m "Release v1.2.0: Added new features"
git tag v1.2.0
git push origin main --tags
```

### 4. النشر

```bash
npm publish --access public
```

## 📊 إحصائيات الحزمة

بعد النشر، يمكنك مراقبة:

### عدد التنزيلات:
```bash
npm view seo-agent-mcp-server downloads
```

### آخر إصدار:
```bash
npm view seo-agent-mcp-server version
```

### كل المعلومات:
```bash
npm info seo-agent-mcp-server
```

## 🔧 إلغاء النشر (Unpublish)

⚠️ **احذر**: يمكنك إلغاء النشر فقط خلال 72 ساعة من النشر.

```bash
npm unpublish seo-agent-mcp-server@1.1.0
```

أو حذف إصدار معين:

```bash
npm deprecate seo-agent-mcp-server@1.1.0 "Please use version 1.2.0 instead"
```

## 📝 Changelog

احتفظ بسجل التغييرات في `CHANGELOG.md`:

```markdown
# Changelog

## [1.1.0] - 2026-01-16

### Added
- Competitor analysis in keyword rankings
- New tool: get_keyword_rankings
- Support for competitor_positions field

### Changed
- Updated keyword endpoint to include competitor data
- Improved ranking comparison logic

### Fixed
- Field parsing for URL and history data
```

## 🌐 الترويج للحزمة

بعد النشر:

1. **أضف Badge للـ README:**
   ```markdown
   ![npm version](https://img.shields.io/npm/v/seo-agent-mcp-server)
   ![npm downloads](https://img.shields.io/npm/dm/seo-agent-mcp-server)
   ```

2. **شارك على:**
   - Twitter/X
   - Reddit (r/node, r/SEO)
   - Dev.to
   - Product Hunt

3. **أضف للموقع:**
   - https://seo-agent.net

## 🔐 الأمان

### API Keys
- ✅ `.env` files في `.npmignore`
- ✅ لا credentials في الكود
- ✅ Environment variables فقط

### Audit
```bash
npm audit
npm audit fix
```

## 📞 الدعم

إذا واجهت مشاكل:

1. **NPM Support**: support@npmjs.com
2. **Documentation**: https://docs.npmjs.com/
3. **Issues**: https://github.com/dpro-gmbh/seo-agent-mcp-server/issues

## ✅ Checklist قبل النشر

- [ ] اختبرت كل الأدوات محلياً
- [ ] README.md كامل وواضح
- [ ] package.json محدث
- [ ] LICENSE file موجود
- [ ] .npmignore يستثني الملفات غير الضرورية
- [ ] `npm pack --dry-run` يعمل بدون أخطاء
- [ ] Build نظيف (no errors)
- [ ] Git committed وpushed
- [ ] Version number صحيح

---

**Ready to publish!** 🚀

```bash
cd C:\MAMP\htdocs\flowxtra\hr_blogs\seo_ai_agent\mcp-server
npm publish --access public
```
