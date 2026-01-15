/**
 * Type definitions for prompts
 */

export interface PromptConfig {
    name: string;
    version: string;
    description: string;
    variables: string[];
}

export interface SEOArticleParams {
    topic: string;
    primaryKeyword: string;
    secondaryKeywords?: string[];
    targetLength?: number; // في كلمات
    tone?: 'professional' | 'casual' | 'technical' | 'conversational';
    targetAudience?: string;
    includeImages?: boolean;
    language?: string;
}

export interface ContentImprovementParams {
    originalContent: string;
    improvementGoals: ('seo' | 'readability' | 'engagement' | 'length')[];
    targetKeywords?: string[];
}

export interface KeywordResearchParams {
    topic: string;
    industry: string;
    targetAudience?: string;
    location?: string;
}
