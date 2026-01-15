import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import ChatMessage from '../../../database/models/chatMessage';
import ChatSession from '../../../database/models/chatSession';
import Setting from '../../../database/models/setting';
import User from '../../../database/models/user';
import db from '../../../database/database';

// Create an OpenAI API client (that's actually connecting to our local Qwen server)
const openai = new OpenAI({
    apiKey: 'not-needed', // Local server doesn't require a key
    baseURL: process.env.SLM_API_URL ? `${process.env.SLM_API_URL}/v1` : 'http://127.0.0.1:38474/v1',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Authenticate User
    await db.sync(); // Ensure models are synced
    const auth = verifyUser(req, res);
    const userId = auth.userId || null;

    try {
        const { messages, domain, sessionId, model } = req.body; // Added model parameter

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        const lastUserMessage = messages[messages.length - 1];
        let targetSessionId = sessionId;

        // 1.5 Ensure we have a session
        if (userId && domain && !targetSessionId) {
            // Create a default session if none provided
            const session = await ChatSession.create({
                userId,
                domain,
                title: lastUserMessage.content.substring(0, 30) + (lastUserMessage.content.length > 30 ? '...' : '')
            });
            targetSessionId = session.id;
        }

        // 2. Load System Prompt from Settings (or use default)
        let systemPrompt = `You are an expert SEO Agent for the domain: ${domain || 'General'}. 
      Analyze the user's SEO questions, suggest keywords, and provide actionable optimization advice.
      Keep answers concise and professional.
      Current Date: ${new Date().toISOString().split('T')[0]}`;

        try {
            const settingsRow = await Setting.findByPk('app_config');
            if (settingsRow) {
                const settings = JSON.parse(settingsRow.value || '{}');
                if (settings.seo_agent_system_prompt) {
                    // Allow simple template replacement
                    systemPrompt = settings.seo_agent_system_prompt
                        .replace(/{domain}/g, domain || 'General')
                        .replace(/{date}/g, new Date().toISOString().split('T')[0]);
                }
            }
        } catch (settingError) {
            console.warn('[SeoAgent] Could not load settings, using default prompt:', settingError);
            // Continue with default systemPrompt
        }

        // 3. Load Chat History from DB (Memory) for THIS session
        let historyMessages: any[] = [];
        if (userId && targetSessionId) { // Changed condition to use targetSessionId
            const history = await ChatMessage.findAll({
                where: { userId, sessionId: targetSessionId }, // Filter by sessionId
                order: [['createdAt', 'DESC']],
                limit: 15, // A bit more memory for active sessions
            });
            // Sequelize returns newest first, so reverse to chronological order
            historyMessages = history.reverse().map(msg => ({
                role: msg.role,
                content: msg.content
            }));
        }

        // 4. Save the NEW User Message to DB
        // We only save if it's a legitimate user (userId exists) and inside a domain context
        if (userId && domain && targetSessionId && lastUserMessage.role === 'user') { // Added targetSessionId to condition
            await ChatMessage.create({
                userId,
                domain,
                sessionId: targetSessionId, // Added sessionId
                role: 'user',
                content: lastUserMessage.content
            });

            // Update session title if it's the first message
            if (messages.length === 1) {
                await ChatSession.update(
                    { title: lastUserMessage.content.substring(0, 40) },
                    { where: { id: targetSessionId } }
                );
            }
        }

        // 5. Construct Final Prompt Context
        // [System, ...History, NewUserMessage]

        const finalMessages = [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: lastUserMessage.content }
        ];

        // 6. Determine which model to use and configure Client
        const selectedModel = model || 'qwen-local';
        let modelName = 'qwen2.5-3b-instruct-q4_k_m.gguf';
        let clientConfig: any = {};

        // Fetch user's API keys for external models
        let userApiKeys: any = {};
        if (selectedModel !== 'qwen-local' && userId) {
            const user = await User.findByPk(userId);
            if (user && user.ai_api_keys) {
                try {
                    userApiKeys = typeof user.ai_api_keys === 'string'
                        ? JSON.parse(user.ai_api_keys)
                        : user.ai_api_keys;
                } catch (e) {
                    console.error('Failed to parse user API keys:', e);
                }
            }
        }

        // Map model selection to actual model names and client config
        if (selectedModel === 'qwen-local') {
            modelName = 'qwen2.5-3b-instruct-q4_k_m.gguf';
            // Force connection to local server for Dpro
            clientConfig = {
                apiKey: 'not-needed',
                baseURL: process.env.SLM_API_URL ? `${process.env.SLM_API_URL}/v1` : 'http://127.0.0.1:38474/v1',
            };
        } else if (selectedModel.startsWith('gemini')) {
            // Gemini models
            const geminiModelMap: any = {
                'gemini-2.0-flash': 'gemini-2.0-flash-exp',
                'gemini-1.5-pro': 'gemini-1.5-pro'
            };
            modelName = geminiModelMap[selectedModel] || 'gemini-2.0-flash-exp';
            clientConfig = {
                apiKey: userApiKeys.gemini || process.env.GEMINI_API_KEY,
                baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
            };
        } else if (selectedModel.startsWith('perplexity')) {
            // Perplexity models
            modelName = 'sonar';
            clientConfig = {
                apiKey: userApiKeys.perplexity || process.env.PERPLEXITY_API_KEY,
                baseURL: 'https://api.perplexity.ai',
            };
        } else if (selectedModel.startsWith('gpt')) {
            // OpenAI GPT models
            const gptModelMap: any = {
                'gpt-5.2': 'gpt-5.2',
                'gpt-5-mini': 'gpt-5-mini',
                'gpt-4.1': 'gpt-4.1'
            };
            modelName = gptModelMap[selectedModel] || 'gpt-5.2';
            clientConfig = {
                apiKey: userApiKeys.chatgpt || process.env.OPENAI_API_KEY,
            };
        } else if (selectedModel.startsWith('claude')) {
            // Anthropic Claude models
            const claudeModelMap: any = {
                'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
                'claude-3-opus': 'claude-3-opus-20240229'
            };
            modelName = claudeModelMap[selectedModel] || 'claude-3-5-sonnet-20241022';
            clientConfig = {
                apiKey: userApiKeys.claude || process.env.ANTHROPIC_API_KEY,
                baseURL: 'https://api.anthropic.com/v1',
            };
        }

        const dynamicOpenAI = new OpenAI(clientConfig);

        const response = await dynamicOpenAI.chat.completions.create({
            model: modelName,
            stream: true,
            messages: finalMessages, // Use our constructed history, not just what client sent
            temperature: 0.7,
            max_tokens: 1000,
        });

        // 6. Hook into the stream to save the Assistant's response
        const stream = OpenAIStream(response as any, {
            onCompletion: async (completion) => {
                if (userId && targetSessionId) { // Changed condition to use targetSessionId
                    await ChatMessage.create({
                        userId,
                        domain,
                        sessionId: targetSessionId, // Added sessionId
                        role: 'assistant',
                        content: completion
                    });

                    // Update session updatedAt to bring it to top
                    await ChatSession.update(
                        { updatedAt: new Date() },
                        { where: { id: targetSessionId } }
                    );
                }
            }
        });

        // Respond with the stream manually for Node.js Runtime
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Session-Id': String(targetSessionId), // Pass back the session ID
        });

        const reader = stream.getReader();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        } finally {
            res.end();
        }

    } catch (error: any) {
        console.error('[SeoAgent] Error:', error);
        console.error('[SeoAgent] Error Details:', {
            message: error?.message,
            stack: error?.stack,
            response: error?.response?.data
        });

        // Check if headers were already sent
        if (res.headersSent) {
            return res.end();
        }

        return res.status(500).json({
            error: 'Failed to chat with Seo Agent.',
            details: error?.message || 'Unknown error'
        });
    }
}
