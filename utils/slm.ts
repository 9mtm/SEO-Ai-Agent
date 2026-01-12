
type IdeaKeyword = {
    text: string,
    competition: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSPECIFIED',
    monthly_search_volume: number,
}

type SLMRequest = {
    keywords: string[],
    domain?: string,
    country?: string,
    language?: string,
}

export const getSLMKeywordIdeas = async (details: SLMRequest): Promise<IdeaKeyword[]> => {
    const { keywords, domain } = details;

    if (!process.env.SLM_API_URL) {
        console.log('[SLM] No API URL configured.');
        return [];
    }

    const prompt = `You are an SEO Expert. Generate 20 high-potential keyword ideas based on the following context.
   ${domain ? `Target Domain: ${domain}` : ''}
   ${keywords.length > 0 ? `Seed Keywords: ${keywords.join(', ')}` : ''}

   Return ONLY a raw JSON array. Do not include any markdown formatting, backticks, or explanations.
   The JSON structure must be exactly:
   [{"text": "keyword here", "competition": "HIGH"|"MEDIUM"|"LOW", "monthly_search_volume": 1000}]
   Estimate the volume and competition realistically.`;

    try {
        console.log('[SLM] Sending request to:', process.env.SLM_API_URL);

        const response = await fetch(`${process.env.SLM_API_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "qwen2.5-3b-instruct-q4_k_m.gguf", // This is ignored by some servers but good practice
                messages: [
                    { role: "system", content: "You are a helpful SEO assistant that outputs only valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                stream: false
            })
        });

        if (!response.ok) {
            console.log('[SLM] Error response:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.log('[SLM] Empty response content.');
            return [];
        }

        // Cleanup response to ensure valid JSON
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);

        if (Array.isArray(result)) {
            console.log(`[SLM] Successfully generated ${result.length} keywords.`);
            return result as IdeaKeyword[];
        }

        console.log('[SLM] Response was not an array:', result);
        return [];

    } catch (error) {
        console.log('[SLM] Request failed:', error);
        return [];
    }
};
