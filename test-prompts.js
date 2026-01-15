/**
 * Quick test script for prompts library
 * Run with: node test-prompts.js
 */

const { generateSEOArticlePrompt } = require('./lib/prompts/seo-article');

console.log('🧪 Testing Prompt Library...\n');

const prompt = generateSEOArticlePrompt({
    topic: 'How to improve website SEO in 2026',
    primaryKeyword: 'improve website SEO',
    secondaryKeywords: ['SEO tips', 'website optimization'],
    targetLength: 1200,
    tone: 'conversational',
    targetAudience: 'small business owners',
    includeImages: true,
    language: 'en'
});

console.log('Generated Prompt:');
console.log('='.repeat(80));
console.log(prompt);
console.log('='.repeat(80));
console.log('\n✅ Test completed successfully!');
