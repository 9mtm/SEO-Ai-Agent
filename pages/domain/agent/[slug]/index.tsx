
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useChat } from '@ai-sdk/react';
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

const SeoAgentPage = ({ domain }: any) => {
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');

    return (
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={[]}>
            <Head>
                <title>{`Seo Agent - ${domain?.domain}`}</title>
            </Head>

            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-neutral-50 -m-4 lg:-m-8">
                <div className="text-center max-w-md px-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border inline-block mb-6">
                        <Bot className="h-12 w-12 text-neutral-800" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">AI SEO Agent</h2>
                    <p className="text-neutral-500 mb-8">
                        The AI Agent feature is currently disabled for maintenance.
                        Please check back later for advanced SEO insights and automation.
                    </p>
                    <div className="flex justify-center gap-2">
                        <span className="px-3 py-1 bg-neutral-200 text-neutral-600 rounded-full text-xs font-medium">Coming Soon</span>
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
