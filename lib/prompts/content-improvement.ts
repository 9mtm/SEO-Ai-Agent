import { ContentImprovementParams, PromptConfig } from './types';

/**
 * Content Improvement Prompts
 *
 * Purpose: Improve existing content for SEO, readability, and engagement
 * Version: 1.0.0
 * Last Updated: 2026-01-15
 */

export const CONTENT_IMPROVEMENT_CONFIG: PromptConfig = {
    name: 'Content Improver',
    version: '1.0.0',
    description: 'Improves existing content based on specific goals',
    variables: ['originalContent', 'improvementGoals', 'targetKeywords']
};

/**
 * Generate content improvement prompt
 */
export function generateContentImprovementPrompt(params: ContentImprovementParams): string {
    const { originalContent, improvementGoals, targetKeywords = [] } = params;

    const goalDescriptions = {
        seo: 'Optimize for search engines with better keyword integration and structure',
        readability: 'Improve clarity, sentence structure, and overall readability',
        engagement: 'Make content more engaging, interesting, and actionable',
        length: 'Expand content with additional valuable information and examples'
    };

    const selectedGoals = improvementGoals.map(goal => `- ${goalDescriptions[goal]}`).join('\n');

    const keywordSection = targetKeywords.length > 0
        ? `\n\nTARGET KEYWORDS: ${targetKeywords.join(', ')}\nNaturally integrate these keywords where relevant.`
        : '';

    return `Improve the following content based on these goals:

IMPROVEMENT GOALS:
${selectedGoals}${keywordSection}

ORIGINAL CONTENT:
${originalContent}

INSTRUCTIONS:
1. Maintain the original meaning and key points
2. Keep the same HTML structure and tags
3. Preserve any existing links and images
4. Make incremental improvements without completely rewriting
5. Return ONLY the improved HTML content, no explanations

IMPROVED CONTENT:`;
}

/**
 * Add meta description prompt
 */
export function generateMetaDescriptionPrompt(content: string, primaryKeyword: string): string {
    return `Based on the following article content, write a compelling meta description:

PRIMARY KEYWORD: ${primaryKeyword}

REQUIREMENTS:
- Length: 120-160 characters
- Include the primary keyword naturally
- Compelling and action-oriented
- Accurately summarize the content
- Encourage clicks from search results

ARTICLE CONTENT:
${content.substring(0, 500)}...

Write ONLY the meta description text, nothing else:`;
}

/**
 * Generate article excerpt prompt
 */
export function generateExcerptPrompt(content: string, maxLength: number = 155): string {
    return `Create a brief, engaging excerpt from this article:

REQUIREMENTS:
- Maximum ${maxLength} characters
- Capture the main value proposition
- Enticing and clear
- Complete sentences only

ARTICLE CONTENT:
${content.substring(0, 1000)}...

Write ONLY the excerpt text, nothing else:`;
}

/**
 * Suggest internal links prompt
 */
export function generateInternalLinksPrompt(
    content: string,
    availablePages: { title: string; url: string; description?: string }[]
): string {
    const pagesInfo = availablePages
        .map(page => `- ${page.title} (${page.url})${page.description ? ': ' + page.description : ''}`)
        .join('\n');

    return `Analyze this article and suggest relevant internal links:

AVAILABLE PAGES:
${pagesInfo}

ARTICLE CONTENT:
${content}

INSTRUCTIONS:
1. Identify 2-3 relevant places to add internal links
2. Match content context with available pages
3. Suggest natural anchor text (not "click here")
4. Return in JSON format:

[
  {
    "anchorText": "suggested anchor text",
    "targetUrl": "/page-url",
    "contextSentence": "The sentence where link should be added"
  }
]

Return ONLY the JSON array, nothing else:`;
}
