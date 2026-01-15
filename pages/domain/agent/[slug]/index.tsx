
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../../../services/domains';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Bot, User, Send, Plus, StopCircle, Sparkles, PenTool, Search, Zap } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const SeoAgentPage = ({ domain, initialMessages, initialSessions, initialSessionId }: any) => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [sessions, setSessions] = useState(initialSessions || []);
    const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [selectedModel, setSelectedModel] = useState('gpt-4');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, setMessages, handleInputChange, handleSubmit, isLoading, stop, reload } = useChat({
        api: '/api/agent/chat',
        body: {
            domain: domain?.domain || '',
            sessionId: currentSessionId,
            model: selectedModel
        },
        initialMessages: initialMessages || [],
        onResponse: (response) => {
            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !currentSessionId) {
                setCurrentSessionId(parseInt(newSessionId));
                fetchSessions();
            }
        }
    });

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchSessions = async () => {
        const res = await fetch(`/api/agent/sessions?domain=${domain.domain}`);
        if (res.ok) {
            const data = await res.json();
            setSessions(data);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        router.push(`/domain/agent/${domain.slug}`, undefined, { shallow: true });
    };

    const handleSwitchSession = async (sessionId: any) => {
        if (isLoading) return;
        setCurrentSessionId(sessionId);
        const res = await fetch(`/api/agent/chat/history?sessionId=${sessionId}`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
        }
        router.push(`/domain/agent/${domain.slug}?sessionId=${sessionId}`, undefined, { shallow: true });
    };

    const emptyStateCards = [
        {
            icon: <PenTool className="h-4 w-4 text-purple-500" />,
            title: "Write a Blog Post",
            prompt: "Write an SEO-optimized blog post about the latest trends in..."
        },
        {
            icon: <Search className="h-4 w-4 text-blue-500" />,
            title: "Keyword Research",
            prompt: "Find high-volume, low-difficulty keywords for..."
        },
        {
            icon: <Zap className="h-4 w-4 text-amber-500" />,
            title: "Optimize Content",
            prompt: "Analyze my current homepage content and suggest SEO improvements..."
        },
        {
            icon: <Sparkles className="h-4 w-4 text-green-500" />,
            title: "Generate Title Tags",
            prompt: "Generate 5 catchy, SEO-friendly title tags for a page about..."
        }
    ];

    return (
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={domainsData?.domains || []}>
            <Head>
                <title>{`Seo Agent - ${domain?.domain}`}</title>
            </Head>

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white -m-4 lg:-m-8">

                {/* Sidebar */}
                <div className="w-[280px] flex-none border-r bg-neutral-50/50 hidden md:flex flex-col">
                    <div className="p-4">
                        <Button
                            onClick={handleNewChat}
                            variant="outline"
                            className="w-full justify-start gap-2 h-10 bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                        >
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>

                    <div className="px-4 py-2">
                        <h3 className="text-xs font-medium text-neutral-500 mb-2 px-2">History</h3>
                        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] space-y-1 styled-scrollbar">
                            {sessions.map((s: any) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSwitchSession(s.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${currentSessionId === s.id
                                        ? 'bg-neutral-200/60 text-neutral-900 font-medium'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                >
                                    {s.title || 'New Conversation'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-14 border-b flex items-center justify-between px-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                        <div className="flex items-center gap-2">
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="w-[180px] h-8 border-none bg-transparent hover:bg-neutral-100 focus:ring-0">
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                                    <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border inline-block mb-3">
                                        <Bot className="h-8 w-8 text-neutral-800" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-neutral-900">How can I help you with {domain?.domain}?</h2>
                                    <p className="text-neutral-500">I'm your AI SEO Assistant. Ask me anything.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {emptyStateCards.map((card, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleInputChange({ target: { value: card.prompt } } as any)}
                                            className="text-left p-4 border rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                {card.icon}
                                                <span className="font-medium text-neutral-700 group-hover:text-neutral-900">{card.title}</span>
                                            </div>
                                            <p className="text-sm text-neutral-500 line-clamp-2">{card.prompt}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role !== 'user' && (
                                            <Avatar className="h-8 w-8 border bg-white">
                                                <AvatarImage src="/bot-avatar.png" />
                                                <AvatarFallback><Bot className="h-5 w-5 text-neutral-600" /></AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl shadow-sm ${m.role === 'user'
                                                ? 'bg-neutral-900 text-white rounded-br-none'
                                                : 'bg-white border border-neutral-100 rounded-tl-none'
                                                }`}>
                                                <div className={`prose prose-sm ${m.role === 'user' ? 'prose-invert' : 'prose-neutral'} max-w-none break-words`}>
                                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                            {/* Optional: Add timestamp or actions here */}
                                        </div>

                                        {m.role === 'user' && (
                                            <Avatar className="h-8 w-8 border bg-neutral-100">
                                                <AvatarFallback><User className="h-5 w-5 text-neutral-600" /></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-4">
                                        <Avatar className="h-8 w-8 border bg-white">
                                            <AvatarFallback><Bot className="h-5 w-5 text-neutral-600" /></AvatarFallback>
                                        </Avatar>
                                        <div className="bg-white border border-neutral-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                            <span className="flex gap-1">
                                                <span className="animate-bounce delay-0 w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                                <span className="animate-bounce delay-150 w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                                <span className="animate-bounce delay-300 w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Footer */}
                    <div className="p-4 md:p-6 bg-white">
                        <div className="max-w-3xl mx-auto relative group">
                            <form onSubmit={handleSubmit} className="relative">
                                <Textarea
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e as any);
                                        }
                                    }}
                                    placeholder="Message SEO Agent..."
                                    className="min-h-[50px] max-h-[200px] w-full pr-24 py-3 bg-neutral-50 border-neutral-200 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 resize-none rounded-xl shadow-sm scrollbar-hide focus-visible:ring-0 focus-visible:ring-offset-0"
                                    rows={1}
                                />
                                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                                    {isLoading ? (
                                        <Button
                                            type="button"
                                            onClick={() => stop()}
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 w-8 p-0 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                                        >
                                            <StopCircle className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={!input.trim()}
                                            className="h-8 w-8 p-0 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-neutral-400">
                                    SEO Agent can make mistakes. Consider checking important information.
                                </p>
                            </div>
                        </div>
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
