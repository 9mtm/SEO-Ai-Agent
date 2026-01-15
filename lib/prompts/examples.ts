/**
 * Prompt Library Usage Examples
 *
 * هذا الملف يحتوي على أمثلة على كيفية استخدام مكتبة الـ prompts
 */

import {
    generateSEOArticlePrompt,
    generateShortArticlePrompt,
    generateLongArticlePrompt,
    generateListiclePrompt,
    generateHowToGuidePrompt,
    generateContentImprovementPrompt,
    generateMetaDescriptionPrompt,
    generateExcerptPrompt,
    generateKeywordSuggestionsPrompt,
    generateContentIdeasPrompt,
    generateTitleVariationsPrompt
} from './index';

// ============================================
// Example 1: Standard SEO Article
// ============================================
export function example1_StandardArticle() {
    const prompt = generateSEOArticlePrompt({
        topic: 'How to improve website loading speed',
        primaryKeyword: 'website loading speed',
        secondaryKeywords: ['page speed optimization', 'fast website'],
        targetLength: 1500,
        tone: 'conversational',
        targetAudience: 'website owners and developers',
        includeImages: true,
        language: 'en'
    });

    console.log('=== Standard SEO Article Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 2: Short Blog Post
// ============================================
export function example2_ShortArticle() {
    const prompt = generateShortArticlePrompt({
        topic: '5 Quick SEO Tips for 2026',
        primaryKeyword: 'SEO tips 2026',
        tone: 'casual',
        targetAudience: 'beginners'
    });

    console.log('=== Short Article Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 3: Listicle Article
// ============================================
export function example3_Listicle() {
    const prompt = generateListiclePrompt({
        topic: 'AI Tools for Content Creation',
        primaryKeyword: 'AI content tools',
        secondaryKeywords: ['AI writing tools', 'content automation'],
        listCount: 10,
        tone: 'professional',
        targetAudience: 'content marketers'
    });

    console.log('=== Listicle Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 4: How-To Guide
// ============================================
export function example4_HowToGuide() {
    const prompt = generateHowToGuidePrompt({
        topic: 'How to Set Up Google Analytics 4',
        primaryKeyword: 'setup Google Analytics 4',
        secondaryKeywords: ['GA4 installation', 'Google Analytics tutorial'],
        targetLength: 2000,
        tone: 'technical',
        targetAudience: 'website administrators'
    });

    console.log('=== How-To Guide Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 5: Content Improvement
// ============================================
export function example5_ContentImprovement() {
    const originalContent = `
        <h1>My Old Article</h1>
        <p>This is some old content that needs improvement.</p>
        <p>It's not very engaging or optimized for SEO.</p>
    `;

    const prompt = generateContentImprovementPrompt({
        originalContent,
        improvementGoals: ['seo', 'readability', 'engagement'],
        targetKeywords: ['content marketing', 'SEO optimization']
    });

    console.log('=== Content Improvement Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 6: Meta Description Generation
// ============================================
export function example6_MetaDescription() {
    const articleContent = `
        <h1>Complete Guide to SEO in 2026</h1>
        <p>Learn everything about SEO including keyword research, on-page optimization, and link building.</p>
        <p>This comprehensive guide covers all aspects of modern SEO practices.</p>
    `;

    const prompt = generateMetaDescriptionPrompt(articleContent, 'SEO guide 2026');

    console.log('=== Meta Description Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 7: Keyword Research
// ============================================
export function example7_KeywordResearch() {
    const prompt = generateKeywordSuggestionsPrompt({
        topic: 'artificial intelligence in healthcare',
        industry: 'healthcare technology',
        targetAudience: 'healthcare professionals',
        location: 'global'
    });

    console.log('=== Keyword Research Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 8: Content Ideas Generation
// ============================================
export function example8_ContentIdeas() {
    const prompt = generateContentIdeasPrompt('digital marketing trends', 15);

    console.log('=== Content Ideas Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 9: Title Variations
// ============================================
export function example9_TitleVariations() {
    const prompt = generateTitleVariationsPrompt(
        'Best practices for email marketing',
        'email marketing best practices',
        10
    );

    console.log('=== Title Variations Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Example 10: Arabic Language Article
// ============================================
export function example10_ArabicArticle() {
    const prompt = generateSEOArticlePrompt({
        topic: 'كيفية تحسين محركات البحث لموقعك',
        primaryKeyword: 'تحسين محركات البحث',
        secondaryKeywords: ['SEO بالعربي', 'تحسين المواقع'],
        targetLength: 1200,
        tone: 'conversational',
        targetAudience: 'أصحاب المواقع العربية',
        includeImages: true,
        language: 'ar'
    });

    console.log('=== Arabic Article Prompt ===');
    console.log(prompt);
    return prompt;
}

// ============================================
// Run All Examples
// ============================================
export function runAllExamples() {
    console.log('\n🚀 Running All Prompt Library Examples...\n');

    example1_StandardArticle();
    console.log('\n' + '='.repeat(50) + '\n');

    example2_ShortArticle();
    console.log('\n' + '='.repeat(50) + '\n');

    example3_Listicle();
    console.log('\n' + '='.repeat(50) + '\n');

    example4_HowToGuide();
    console.log('\n' + '='.repeat(50) + '\n');

    example5_ContentImprovement();
    console.log('\n' + '='.repeat(50) + '\n');

    example6_MetaDescription();
    console.log('\n' + '='.repeat(50) + '\n');

    example7_KeywordResearch();
    console.log('\n' + '='.repeat(50) + '\n');

    example8_ContentIdeas();
    console.log('\n' + '='.repeat(50) + '\n');

    example9_TitleVariations();
    console.log('\n' + '='.repeat(50) + '\n');

    example10_ArabicArticle();

    console.log('\n✅ All examples completed!\n');
}

// Uncomment to run:
// runAllExamples();
