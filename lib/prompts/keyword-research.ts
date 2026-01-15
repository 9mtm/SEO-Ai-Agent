import { KeywordResearchParams, PromptConfig } from './types';

/**
 * Keyword Research Prompts
 *
 * Purpose: Generate keyword suggestions and content ideas
 * Version: 1.0.0
 * Last Updated: 2026-01-15
 */

export const KEYWORD_RESEARCH_CONFIG: PromptConfig = {
    name: 'Keyword Research',
    version: '1.0.0',
    description: 'Generates keyword suggestions and content ideas',
    variables: ['topic', 'industry', 'targetAudience', 'location']
};

/**
 * Generate keyword suggestions prompt
 */
export function generateKeywordSuggestionsPrompt(params: KeywordResearchParams): string {
    const {
        topic,
        industry,
        targetAudience = 'general audience',
        location = 'global'
    } = params;

    return `Generate keyword suggestions for SEO content planning:

TOPIC: ${topic}
INDUSTRY: ${industry}
TARGET AUDIENCE: ${targetAudience}
LOCATION: ${location}

TASK:
Generate a comprehensive list of relevant keywords categorized by search intent.

Return in JSON format:
{
  "primary": ["main high-value keyword"],
  "secondary": ["supporting keyword 1", "supporting keyword 2", "..."],
  "longTail": ["specific long-tail keyword 1", "..."],
  "questions": ["what is...", "how to...", "why..."],
  "related": ["related topic 1", "related topic 2", "..."]
}

CRITERIA:
- Primary: 1 main keyword with high search volume and relevance
- Secondary: 5-8 supporting keywords
- Long-tail: 8-12 specific 3-4 word phrases
- Questions: 5-10 common questions people ask
- Related: 5-8 related topics for content expansion

Return ONLY the JSON object, nothing else:`;
}

/**
 * Generate content ideas prompt
 */
export function generateContentIdeasPrompt(keyword: string, count: number = 10): string {
    return `Generate ${count} unique blog article ideas for the keyword: "${keyword}"

REQUIREMENTS:
- SEO-friendly titles (50-60 characters)
- Diverse content types (how-to, listicle, guide, comparison, etc.)
- Search intent focused
- Actionable and specific
- Include the keyword naturally

Return in JSON format:
[
  {
    "title": "Article Title Here",
    "type": "how-to|listicle|guide|comparison|review",
    "description": "Brief description of the article angle",
    "estimatedLength": "500-700|1000-1500|2000+"
  }
]

Return ONLY the JSON array, nothing else:`;
}

/**
 * Generate SEO title variations prompt
 */
export function generateTitleVariationsPrompt(
    topic: string,
    primaryKeyword: string,
    count: number = 5
): string {
    return `Generate ${count} SEO-optimized title variations for:

TOPIC: ${topic}
PRIMARY KEYWORD: ${primaryKeyword}

REQUIREMENTS:
- 50-60 characters each
- Include the primary keyword
- Different angles and hooks
- Compelling and click-worthy
- SEO best practices

Return in JSON format:
[
  {
    "title": "Title text here",
    "length": 55,
    "hook": "question|number|how-to|guide|comparison"
  }
]

Return ONLY the JSON array, nothing else:`;
}
