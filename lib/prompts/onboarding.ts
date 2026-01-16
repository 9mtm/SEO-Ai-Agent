
/**
 * Onboarding Prompts
 * 
 * Purpose: Analyze website content and generate initial SEO setup data
 * Version: 1.0.0
 */

export const ONBOARDING_PROMPTS_CONFIG = {
    name: 'Onboarding Analysis',
    version: '1.0.0',
    description: 'Prompts for analyzing website content and suggesting keywords/competitors during onboarding'
};

/**
 * Prompt for analyzing website content to extract business info
 */
export function generateBusinessAnalysisPrompt(content: string): { system: string, user: string } {
    const system = "You are an expert SEO Strategist and Business Analyst. Your goal is to analyze website content and extract high-quality business information for a directory listing. Respond ONLY with valid JSON.";

    const user = `Analyze the provided website content and extract the following details in JSON format:

{
  "businessName": "The official brand name of the business",
  "niche": "Impactful and specific market niche (max 3 words). Avoid generic terms (e.g. instead of 'Software', use 'AI Recruitment Platform')",
  "description": "A professional, compelling business summary (max 300 chars). Focus on the core value proposition: What they do, who they serve, and the main benefit."
}

Instructions:
- If specific info is missing, deduce the best possible answer from the context.
- Keep the 'niche' specific and SEO-friendly.
- Keep the 'description' engaging and professional.

Website Content:
${content}`;

    return { system, user };
}

/**
 * Prompt for suggesting focus keywords based on business info
 */
export function generateFocusKeywordsPrompt(businessName: string, niche: string, description: string): { system: string, user: string } {
    const system = "You are an SEO expert. Respond ONLY with valid JSON.";

    const user = `Based on this business information:
Business Name: ${businessName}
Niche: ${niche}
Description: ${description}

Generate 9 SEO focus keywords categorized by priority. Return ONLY a JSON object in this exact format:
{
  "high": ["keyword1", "keyword2", "keyword3"],
  "medium": ["keyword4", "keyword5", "keyword6"],
  "low": ["keyword7", "keyword8", "keyword9"]
}

Guidelines:
- High priority: Main commercial keywords with high search volume
- Medium priority: Supporting keywords and variations
- Low priority: Long-tail keywords and niche-specific terms
- All keywords should be relevant to the niche: "${niche}"`;

    return { system, user };
}

/**
 * Prompt for suggesting competitors based on niche
 */
export function generateCompetitorsPrompt(niche: string): { system: string, user: string } {
    const system = "You are an SEO expert. Respond ONLY with a valid JSON array of strings.";

    const user = `List 5 top real-world competitor domains for the niche: "${niche}". 
Simulate a comprehensive Google, Trustpilot, and G2 search to find the most relevant and popular active competitors.
Return ONLY a JSON array of domain names (e.g. ["competitor1.com", "example.net"]). Do not number them.`;

    return { system, user };
}
