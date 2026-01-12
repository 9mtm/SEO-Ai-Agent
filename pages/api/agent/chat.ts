import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import ChatMessage from '../../../database/models/chatMessage';
import ChatSession from '../../../database/models/chatSession';
import Setting from '../../../database/models/setting';
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
        const { messages, domain, sessionId } = req.body; // Added sessionId

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
        const settingsRow = await Setting.findByPk('app_config');
        let systemPrompt = `You are an expert SEO Agent for the domain: ${domain || 'General'}. 
      Analyze the user's SEO questions, suggest keywords, and provide actionable optimization advice.
      Keep answers concise and professional.
      Current Date: ${new Date().toISOString().split('T')[0]}`;

        if (settingsRow) {
            const settings = JSON.parse(settingsRow.value || '{}');
            if (settings.seo_agent_system_prompt) {
                // Allow simple template replacement
                systemPrompt = settings.seo_agent_system_prompt
                    .replace(/{domain}/g, domain || 'General')
                    .replace(/{date}/g, new Date().toISOString().split('T')[0]);
            }
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

        const response = await openai.chat.completions.create({
            model: 'qwen2.5-3b-instruct-q4_k_m.gguf',
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

    } catch (error) {
        console.error('[SeoAgent] Error:', error);
        return res.status(500).json({ error: 'Failed to chat with Seo Agent.' });
    }
}
