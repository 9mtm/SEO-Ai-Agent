
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../../../services/domains';

const SeoAgentPage = ({ domain, initialMessages, initialSessions, initialSessionId }: any) => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [sessions, setSessions] = useState(initialSessions || []);
    const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');


    const { messages, input, setMessages, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/agent/chat',
        body: {
            domain: domain?.domain || '',
            sessionId: currentSessionId,
        },
        initialMessages: initialMessages || [],
        onResponse: (response) => {
            // Check if we got a new session ID back
            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !currentSessionId) {
                setCurrentSessionId(parseInt(newSessionId));
                // Refresh session list
                fetchSessions();
            }
        }
    });

    const fetchSessions = async () => {
        const res = await fetch(`/api/agent/sessions?domain=${domain.domain}`);
        if (res.ok) {
            const data = await res.json();
            setSessions(data);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: `Hello! I'm your **SEO Agent**. 🤖\n\nI can help you analyze **${domain.domain}**, suggest keywords, or write content.\n\nType your question below!`
            }
        ]);
        // Update URL
        router.push(`/domain/agent/${domain.slug}`, undefined, { shallow: true });
    };

    const handleSwitchSession = async (sessionId: any) => {
        if (isLoading) return;
        setCurrentSessionId(sessionId);

        // Fetch messages for this session
        const res = await fetch(`/api/agent/chat/history?sessionId=${sessionId}`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.length > 0 ? data : [
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: `Continuing our conversation in this session...`
                }
            ]);
        }

        // Update URL
        router.push(`/domain/agent/${domain.slug}?sessionId=${sessionId}`, undefined, { shallow: true });
    };

    return (
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={domainsData?.domains || []}>
            <Head>
                <title>{`Seo Agent - ${domain?.domain}`}</title>
            </Head>

            <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-white border rounded-xl shadow-sm">
                {/* Sidebar - Chat History */}
                <div className="w-64 flex-none border-r bg-gray-50 flex flex-col hidden md:flex">
                    <div className="p-4 border-b">
                        <button
                            onClick={handleNewChat}
                            className="w-full py-2 px-4 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span>+</span> New Chat
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto styled-scrollbar">
                        {sessions.map((s: any) => (
                            <div
                                key={s.id}
                                onClick={() => handleSwitchSession(s.id)}
                                className={`p-4 border-b cursor-pointer hover:bg-white transition-colors text-sm truncate ${currentSessionId === s.id ? 'bg-white font-semibold border-l-4 border-l-blue-600 text-blue-700' : 'text-gray-600'}`}
                                title={s.title}
                            >
                                {s.title || 'Untitled Chat'}
                                <div className="text-xs text-gray-400 mt-1">
                                    {new Date(s.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Container */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/30">
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 styled-scrollbar">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border text-gray-800 rounded-bl-none'
                                    }`}>
                                    <div className={`prose ${m.role === 'user' ? 'prose-invert' : 'prose-neutral'} text-sm max-w-none`}>
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border text-gray-800 rounded-2xl rounded-bl-none p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t">
                        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                            <input
                                className="w-full p-4 pr-32 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 bg-white"
                                value={input}
                                placeholder="Ask anything about your SEO strategy..."
                                onChange={handleInputChange}
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className={`absolute right-2 top-2 bottom-2 px-6 rounded-lg font-bold text-white transition-all ${isLoading || !input.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md transform active:scale-95'
                                    }`}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export const getServerSideProps = async (context: any) => {
    const { getDomain } = await import('../../../../utils/domains');
    const db = (await import('../../../../database/database')).default;
    const ChatMessage = (await import('../../../../database/models/chatMessage')).default;
    const ChatSession = (await import('../../../../database/models/chatSession')).default;
    const jwt = (await import('jsonwebtoken')).default;

    await db.sync();
    const domainData = await getDomain(context.query.slug);

    if (!domainData) {
        return { notFound: true };
    }

    const cookie = context.req.cookies.token;
    let userId = null;

    if (cookie) {
        try {
            const decoded = jwt.verify(cookie, process.env.SECRET as string) as any;
            userId = decoded.userId;
        } catch (e) { }
    }

    let initialMessages: any[] = [];
    let initialSessions: any[] = [];
    let initialSessionId = context.query.sessionId ? parseInt(context.query.sessionId as string) : null;

    if (userId) {
        // Fetch sessions
        initialSessions = await ChatSession.findAll({
            where: { userId, domain: domainData.domain },
            order: [['updatedAt', 'DESC']],
            limit: 20
        });

        // If no specific session in URL, pick the most recent one
        if (!initialSessionId && initialSessions.length > 0) {
            initialSessionId = initialSessions[0].id;
        }

        // Fetch messages for active session
        if (initialSessionId) {
            const history = await ChatMessage.findAll({
                where: { userId, sessionId: initialSessionId },
                order: [['createdAt', 'ASC']],
                limit: 50
            });

            initialMessages = history.map(msg => ({
                id: msg.id.toString(),
                role: msg.role,
                content: msg.content
            }));
        }
    }

    // Default welcome message
    if (initialMessages.length === 0) {
        initialMessages.push({
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your **SEO Agent**. 🤖\n\nI can help you analyze **${domainData.domain}**, suggest keywords, or write content.\n\nType your question below!`
        });
    }

    const optimizedDomain = { domain: domainData.domain, slug: domainData.slug };

    return {
        props: {
            domain: JSON.parse(JSON.stringify(optimizedDomain)),
            initialMessages: JSON.parse(JSON.stringify(initialMessages)),
            initialSessions: JSON.parse(JSON.stringify(initialSessions)),
            initialSessionId: initialSessionId
        }
    };
}

export default SeoAgentPage;

