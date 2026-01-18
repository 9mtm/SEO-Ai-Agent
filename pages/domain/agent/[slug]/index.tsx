
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../../../services/domains';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Bot, User, Send, Plus, StopCircle, Sparkles, PenTool, Search, Zap, FileUp, ImagePlus, BarChart, Trash2, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const SeoAgentPage = ({ domain, initialMessages, initialSessions, initialSessionId }: any) => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [sessions, setSessions] = useState(initialSessions || []);
    const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [selectedModel, setSelectedModel] = useState('qwen-local');
    const [availableModels, setAvailableModels] = useState<any[]>([
        { id: 'qwen-local', name: 'Dpro', icon: '/dpro_logo.png', enabled: true }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Delete Confirmation State
    const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // Fetch available models based on user's API keys
    useEffect(() => {
        const fetchAvailableModels = async () => {
            try {
                const response = await fetch('/api/user', {
                    headers: getAuthHeaders()
                });
                const data = await response.json();

                if (data.success && data.user?.ai_api_keys) {
                    const keys = data.user.ai_api_keys;
                    console.log('API Keys received:', keys); // Debug log

                    const models = [
                        { id: 'qwen-local', name: 'Dpro', icon: '/dpro_logo.png', enabled: true }
                    ];

                    if (keys.chatgpt && keys.chatgpt.trim() !== '') {
                        console.log('Adding GPT models'); // Debug log
                        models.push({ id: 'gpt-5.2', name: 'GPT-5.2', icon: '/openai-icon.png', enabled: true });
                        models.push({ id: 'gpt-5-mini', name: 'GPT-5 mini', icon: '/openai-icon.png', enabled: true });
                        models.push({ id: 'gpt-4.1', name: 'GPT-4.1', icon: '/openai-icon.png', enabled: true });
                    }
                    if (keys.claude && keys.claude.trim() !== '') {
                        console.log('Adding Claude models'); // Debug log
                        models.push({ id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', icon: '/claude-icon.png', enabled: true });
                        models.push({ id: 'claude-3-opus', name: 'Claude 3 Opus', icon: '/claude-icon.png', enabled: true });
                    }
                    if (keys.gemini && keys.gemini.trim() !== '') {
                        console.log('Adding Gemini models'); // Debug log
                        models.push({ id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: '/gemini-icon.png', enabled: true });
                        models.push({ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', icon: '/gemini-icon.png', enabled: true });
                    }
                    if (keys.perplexity && keys.perplexity.trim() !== '') {
                        console.log('Adding Perplexity models'); // Debug log
                        models.push({ id: 'perplexity-sonar', name: 'Sonar', icon: '/perplexity-icon.png', enabled: true });
                    }

                    console.log('Final models list:', models); // Debug log
                    setAvailableModels(models);
                }
            } catch (error) {
                console.error('Failed to fetch available models:', error);
            }
        };

        fetchAvailableModels();
    }, []);

    const { messages, input, setMessages, handleInputChange, handleSubmit, isLoading, stop, reload } = useChat({
        api: '/api/agent/chat',
        body: {
            domain: domain?.domain || '',
            sessionId: currentSessionId,
            model: selectedModel
        },
        headers: (() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        })() as any,
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
        const res = await fetch(`/api/agent/sessions?domain=${domain.domain}`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            setSessions(data);
        }
    };

    // --- Session Management ---
    const handleNewChat = () => {
        router.push(`/domain/agent/${domain?.domain}`);
    };

    const confirmDeleteSession = (sessionId: number) => {
        setSessionToDelete(sessionId);
    };

    const performDeleteSession = async () => {
        if (!sessionToDelete) return;

        try {
            const response = await fetch(`/api/agent/sessions?id=${sessionToDelete}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setSessions(sessions.filter((s: any) => s.id !== sessionToDelete));
                if (currentSessionId === sessionToDelete) {
                    handleNewChat();
                }
                toast.success('Chat deleted');
            } else {
                toast.error('Failed to delete chat');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete chat');
        } finally {
            setSessionToDelete(null);
        }
    };

    const handleSwitchSession = async (sessionId: any) => {
        if (isLoading) return;
        setCurrentSessionId(sessionId);
        const res = await fetch(`/api/agent/chat/history?sessionId=${sessionId}`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
        }
        router.push(`/domain/agent/${domain.slug}?sessionId=${sessionId}`, undefined, { shallow: true });
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = () => {
        imageInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Implement file upload to server and attach to message
            console.log('File selected:', file.name);
            // For now, just add a message indicating file was selected
            handleInputChange({ target: { value: `[File attached: ${file.name}]\n\n${input}` } } as any);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Implement image upload and preview
            console.log('Image selected:', file.name);
            handleInputChange({ target: { value: `[Image attached: ${file.name}]\n\n${input}` } } as any);
        }
    };

    const handleAccessSEOStats = async () => {
        try {
            // Fetch SEO stats for the domain
            const res = await fetch(`/api/domains/${domain.domain}/stats`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const stats = await res.json();
                const statsMessage = `Here are the current SEO statistics for ${domain.domain}:\n\n` +
                    `📊 **Total Keywords:** ${stats.totalKeywords || 'N/A'}\n` +
                    `📈 **Average Position:** ${stats.avgPosition || 'N/A'}\n` +
                    `🔍 **Total Searches:** ${stats.totalSearches || 'N/A'}\n` +
                    `👁️ **Total Impressions:** ${stats.totalImpressions || 'N/A'}\n` +
                    `🖱️ **Total Clicks:** ${stats.totalClicks || 'N/A'}\n\n` +
                    `What would you like to know about these stats?`;

                handleInputChange({ target: { value: statsMessage } } as any);
            } else {
                handleInputChange({ target: { value: `Please analyze the SEO performance for ${domain.domain}` } } as any);
            }
        } catch (error) {
            console.error('Error fetching SEO stats:', error);
            handleInputChange({ target: { value: `Please provide SEO insights for ${domain.domain}` } } as any);
        }
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
                                <div
                                    key={s.id}
                                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors ${currentSessionId === s.id
                                        ? 'bg-neutral-200/60 text-neutral-900 font-medium'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                >
                                    <button
                                        onClick={() => handleSwitchSession(s.id)}
                                        className="flex-1 text-left truncate text-sm mr-2"
                                    >
                                        {s.title || 'New Conversation'}
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDeleteSession(s.id);
                                            }}
                                            className="p-1 rounded hover:bg-red-100 text-neutral-400 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-14 border-b flex items-center justify-between px-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 px-3 gap-2 hover:bg-neutral-100">
                                        <span className="text-sm font-medium">
                                            {availableModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
                                        </span>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-50">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    {/* Dpro (Local) - Top Level */}
                                    <DropdownMenuItem onClick={() => setSelectedModel('qwen-local')} className="font-medium">
                                        Dpro
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* OpenAI Models */}
                                    {availableModels.some(m => m.id.startsWith('gpt')) && (
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>OpenAI</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {availableModels.filter(m => m.id.startsWith('gpt')).map((model) => (
                                                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)}>
                                                        {model.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    )}

                                    {/* Google Models */}
                                    {availableModels.some(m => m.id.startsWith('gemini')) && (
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>Google</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {availableModels.filter(m => m.id.startsWith('gemini')).map((model) => (
                                                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)}>
                                                        {model.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    )}

                                    {/* Anthropic Models */}
                                    {availableModels.some(m => m.id.startsWith('claude')) && (
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>Anthropic</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {availableModels.filter(m => m.id.startsWith('claude')).map((model) => (
                                                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)}>
                                                        {model.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    )}

                                    {/* Perplexity Models */}
                                    {availableModels.some(m => m.id.startsWith('perplexity')) && (
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>Perplexity</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {availableModels.filter(m => m.id.startsWith('perplexity')).map((model) => (
                                                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)}>
                                                        {model.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                                <AvatarImage src={availableModels.find(model => model.id === selectedModel)?.icon || '/dpro_logo.png'} />
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
                                    className="min-h-[50px] max-h-[200px] w-full pl-12 pr-24 py-3 bg-neutral-50 border-neutral-200 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 resize-none rounded-xl shadow-sm scrollbar-hide focus-visible:ring-0 focus-visible:ring-offset-0"
                                    rows={1}
                                />

                                {/* Attachment Button (Left) */}
                                <div className="absolute left-2 bottom-2">
                                    {/* Hidden file inputs */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.txt,.csv"
                                    />
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-200 text-neutral-600"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            <DropdownMenuItem onClick={handleFileUpload} className="gap-2 cursor-pointer">
                                                <FileUp className="h-4 w-4" />
                                                Upload File
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleImageUpload} className="gap-2 cursor-pointer">
                                                <ImagePlus className="h-4 w-4" />
                                                Upload Image
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleAccessSEOStats} className="gap-2 cursor-pointer">
                                                <BarChart className="h-4 w-4" />
                                                Access SEO Stats
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Send/Stop Button (Right) */}
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

                {/* Delete Session Dialog */}
                <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-neutral-600" />
                                Delete Chat
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this chat? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSessionToDelete(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={performDeleteSession}>
                                Delete Chat
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
