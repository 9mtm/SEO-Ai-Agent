# AI Prompts Library

مكتبة مركزية لجميع prompts المستخدمة في التطبيق.

## 📁 الهيكل

```
lib/prompts/
├── index.ts                    # Entry point - exports all prompts
├── types.ts                    # TypeScript type definitions
├── seo-article.ts             # SEO article generation prompts
├── content-improvement.ts      # Content improvement prompts
├── keyword-research.ts         # Keyword research prompts
└── README.md                   # Documentation (this file)
```

## 🎯 الفوائد

1. **Centralized Management**: جميع الـ prompts في مكان واحد
2. **Version Control**: تتبع التغييرات والتحسينات
3. **Type Safety**: TypeScript types لجميع parameters
4. **Reusability**: استخدام نفس الـ prompt في أماكن متعددة
5. **Easy Testing**: اختبار وتحسين الـ prompts بسهولة
6. **A/B Testing**: إمكانية تجربة نسخ مختلفة
7. **Documentation**: كل prompt موثق ومشروح

## 📖 كيفية الاستخدام

### 1. SEO Article Generation

```typescript
import { generateSEOArticlePrompt } from '@/lib/prompts';

const prompt = generateSEOArticlePrompt({
    topic: 'How to improve SEO rankings in 2026',
    primaryKeyword: 'improve SEO rankings',
    secondaryKeywords: ['SEO tips', 'search optimization'],
    targetLength: 1500,
    tone: 'conversational',
    targetAudience: 'small business owners',
    includeImages: true,
    language: 'en'
});

// استخدم الـ prompt مع AI API
const response = await fetch('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'qwen-local'
    })
});
```

### 2. Content Improvement

```typescript
import { generateContentImprovementPrompt } from '@/lib/prompts';

const prompt = generateContentImprovementPrompt({
    originalContent: '<p>Your existing content here...</p>',
    improvementGoals: ['seo', 'readability', 'engagement'],
    targetKeywords: ['keyword1', 'keyword2']
});
```

### 3. Keyword Research

```typescript
import { generateKeywordSuggestionsPrompt } from '@/lib/prompts';

const prompt = generateKeywordSuggestionsPrompt({
    topic: 'artificial intelligence',
    industry: 'technology',
    targetAudience: 'developers',
    location: 'global'
});
```

## 🔧 Prompt Variants

### Article Types

```typescript
// Short article (500-700 words)
import { generateShortArticlePrompt } from '@/lib/prompts';

// Long article (2000-3000 words)
import { generateLongArticlePrompt } from '@/lib/prompts';

// Listicle (e.g., "10 Ways to...")
import { generateListiclePrompt } from '@/lib/prompts';
const prompt = generateListiclePrompt({
    topic: 'Ways to improve productivity',
    primaryKeyword: 'productivity tips',
    listCount: 10
});

// How-to guide
import { generateHowToGuidePrompt } from '@/lib/prompts';
```

## 📝 إضافة Prompt جديد

1. أنشئ ملف جديد في `lib/prompts/` (مثلاً `social-media.ts`)
2. عرّف types في `types.ts`
3. اكتب الدوال لإنشاء الـ prompts
4. Export من `index.ts`
5. وثّق الاستخدام في README

مثال:

```typescript
// lib/prompts/social-media.ts
import { PromptConfig } from './types';

export interface SocialMediaParams {
    platform: 'twitter' | 'linkedin' | 'facebook';
    topic: string;
    tone: string;
}

export function generateSocialPostPrompt(params: SocialMediaParams): string {
    return `Generate a ${params.platform} post about ${params.topic}...`;
}
```

## 🧪 Testing Prompts

للاختبار السريع للـ prompt:

```typescript
import { generateSEOArticlePrompt } from '@/lib/prompts';

// Print the prompt to console
const prompt = generateSEOArticlePrompt({
    topic: 'Test Topic',
    primaryKeyword: 'test keyword'
});

console.log(prompt);
```

## 📊 Prompt Versions

كل prompt له version number (semantic versioning):

- **Major (2.x.x)**: تغييرات كبيرة في البنية
- **Minor (x.2.x)**: إضافة features جديدة
- **Patch (x.x.2)**: تحسينات صغيرة وإصلاحات

## 🎨 Best Practices

1. **Always use parameters**: لا تضع قيم ثابتة في الـ prompt
2. **Document changes**: اكتب changelog عند التعديل
3. **Test before deploying**: اختبر الـ prompt قبل الاستخدام
4. **Keep prompts focused**: كل prompt له هدف واحد محدد
5. **Use clear instructions**: تعليمات واضحة للـ AI
6. **Specify output format**: حدد شكل الـ output المطلوب

## 📚 Resources

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Best Practices for Prompt Engineering](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api)
