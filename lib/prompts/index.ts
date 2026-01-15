/**
 * Centralized Prompt Library
 *
 * This file contains all AI prompts used throughout the application.
 * Benefits:
 * - Easy to maintain and update prompts
 * - Version control for prompt changes
 * - Reusable across different parts of the app
 * - A/B testing different prompt versions
 * - Consistent prompt structure
 */

// Types
export * from './types';

// Prompts
export * from './seo-article';
export * from './content-improvement';
export * from './keyword-research';

// Prompt Configurations
export { SEO_ARTICLE_CONFIG } from './seo-article';
export { CONTENT_IMPROVEMENT_CONFIG } from './content-improvement';
export { KEYWORD_RESEARCH_CONFIG } from './keyword-research';
