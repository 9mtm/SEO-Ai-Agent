import { SEOArticleParams, PromptConfig } from './types';

/**
 * SEO Article Generation Prompts
 *
 * Purpose: Generate SEO-optimized blog articles
 * Version: 2.0.0
 * Last Updated: 2026-01-15
 */

export const SEO_ARTICLE_CONFIG: PromptConfig = {
    name: 'SEO Article Generator',
    version: '2.0.0',
    description: 'Generates comprehensive SEO-optimized blog articles with proper structure',
    variables: ['topic', 'primaryKeyword', 'secondaryKeywords', 'targetLength', 'tone']
};

/**
 * Generate SEO-optimized article prompt
 *
 * @param params - Article generation parameters
 * @returns Formatted prompt string
 */
export function generateSEOArticlePrompt(params: SEOArticleParams): string {
    const {
        topic,
        primaryKeyword,
        secondaryKeywords = [],
        targetLength = 1200,
        tone = 'conversational',
        targetAudience = 'general readers',
        includeImages = true,
        language = 'en'
    } = params;

    const secondaryKeywordsStr = secondaryKeywords.length > 0
        ? `, ${secondaryKeywords.join(', ')}`
        : '';

    const toneDescriptions = {
        professional: 'formal, authoritative, and expert-level',
        casual: 'friendly, approachable, and easy-going',
        technical: 'detailed, precise, and technically accurate',
        conversational: 'engaging, natural, and reader-friendly'
    };

    const prompt = `Write a comprehensive SEO-optimized blog article about: ${topic}

TARGET AUDIENCE: ${targetAudience}
TONE: ${toneDescriptions[tone]}
LANGUAGE: ${language}

TARGET KEYWORDS: ${primaryKeyword}${secondaryKeywordsStr}

SEO REQUIREMENTS:
1. Title (H1): 50-60 characters, must include keyword "${primaryKeyword}"
2. Structure:
   - ONE <h1> tag (main title)
   - 4-6 <h2> tags (main sections)
   - 8-12 <h3> tags (subsections)
3. Length: ${Math.floor(targetLength * 0.8)}-${Math.ceil(targetLength * 1.2)} words
4. Keyword density: 1-2% (use "${primaryKeyword}" naturally 3-5 times)
5. Internal linking: Include 2-3 relevant internal links with descriptive anchor text
6. Meta description: Create a compelling 120-160 character summary

CONTENT REQUIREMENTS:
- Opening hook: Start with an engaging question or statistic
- Clear value proposition: Explain what readers will learn
- Actionable insights: Include practical tips and examples
- Data-driven: Use statistics and facts where relevant
- User-focused: Address reader pain points and solutions
- Call-to-action: End with a clear next step${includeImages ? '\n- Visual content: Suggest 2-3 relevant image placements with descriptive alt text' : ''}

HTML FORMAT:
- Use <h1> for the main title
- Use <h2> for major sections
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <strong> for important emphasis
- Use <a href="/relevant-page" title="Descriptive title">anchor text</a> for internal links
- Use <ul> and <li> for bullet lists
- Use <ol> and <li> for numbered lists${includeImages ? '\n- Use <img src="placeholder.jpg" alt="Descriptive alt text"> for images' : ''}

IMPORTANT: Write ONLY the article content in HTML format. Do not include any meta-commentary, explanations, or wrapper tags like <html>, <body>, or <article>.

Start writing the article now:`;

    return prompt;
}

/**
 * Short-form article prompt (500-700 words)
 */
export function generateShortArticlePrompt(params: Omit<SEOArticleParams, 'targetLength'>): string {
    return generateSEOArticlePrompt({
        ...params,
        targetLength: 600
    });
}

/**
 * Long-form article prompt (2000-3000 words)
 */
export function generateLongArticlePrompt(params: Omit<SEOArticleParams, 'targetLength'>): string {
    return generateSEOArticlePrompt({
        ...params,
        targetLength: 2500
    });
}

/**
 * Listicle article prompt (e.g., "10 Ways to...")
 */
export function generateListiclePrompt(params: SEOArticleParams & { listCount: number }): string {
    const { listCount, ...restParams } = params;

    const basePrompt = generateSEOArticlePrompt(restParams);

    return basePrompt.replace(
        'Write a comprehensive SEO-optimized blog article',
        `Write a listicle-style article with exactly ${listCount} actionable points`
    );
}

/**
 * How-to guide prompt
 */
export function generateHowToGuidePrompt(params: SEOArticleParams): string {
    const basePrompt = generateSEOArticlePrompt({
        ...params,
        tone: 'conversational'
    });

    return basePrompt.replace(
        'CONTENT REQUIREMENTS:',
        `GUIDE STRUCTURE:
- Introduction: Explain the problem and why this guide matters
- Prerequisites: List any requirements or tools needed
- Step-by-step instructions: Clear, numbered steps with explanations
- Tips and warnings: Highlight important notes
- Conclusion: Summary and next steps

CONTENT REQUIREMENTS:`
    );
}
