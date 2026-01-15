
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../../../services/domains';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'react-hot-toast';
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
    PenTool,
    Globe,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Image as ImageIcon,
    Type,
    AlignLeft,
    Hash,
    Link as LinkIcon,
    UploadCloud,
    Sparkles,
    Code,
    BarChart
} from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-neutral-100 animate-pulse rounded-md" />
});

export default function ArticleWriterPage() {
    const router = useRouter();
    const { slug } = router.query;
    const { data: domainsData } = useFetchDomains(router);
    const domain = domainsData?.domains?.find((d: any) => d.slug === slug) ||
                   domainsData?.domains?.find((d: any) => d.domain === slug);

    // Redirect to correct slug if using domain name instead of slug
    useEffect(() => {
        if (slug && domain && domain.domain === slug && domain.slug !== slug) {
            router.replace(`/domain/posts/${domain.slug}`);
        }
    }, [slug, domain, router]);

    // AI Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('qwen-local');
    const [availableModels, setAvailableModels] = useState<any[]>([
        { id: 'qwen-local', name: 'Dpro', icon: '/dpro_logo.png', enabled: true }
    ]);

    // Fetch available models based on user's API keys
    useEffect(() => {
        const fetchAvailableModels = async () => {
            try {
                const response = await fetch('/api/user');
                const data = await response.json();

                if (data.success && data.user?.ai_api_keys) {
                    const keys = data.user.ai_api_keys;
                    const models = [
                        { id: 'qwen-local', name: 'Dpro', icon: '/dpro_logo.png', enabled: true }
                    ];

                    if (keys.chatgpt && keys.chatgpt.trim() !== '') {
                        models.push({ id: 'gpt-5.2', name: 'GPT-5.2', icon: '/openai-icon.png', enabled: true });
                        models.push({ id: 'gpt-5-mini', name: 'GPT-5 mini', icon: '/openai-icon.png', enabled: true });
                        models.push({ id: 'gpt-4.1', name: 'GPT-4.1', icon: '/openai-icon.png', enabled: true });
                    }
                    if (keys.claude && keys.claude.trim() !== '') {
                        models.push({ id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', icon: '/claude-icon.png', enabled: true });
                        models.push({ id: 'claude-3-opus', name: 'Claude 3 Opus', icon: '/claude-icon.png', enabled: true });
                    }
                    if (keys.gemini && keys.gemini.trim() !== '') {
                        models.push({ id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: '/gemini-icon.png', enabled: true });
                        models.push({ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', icon: '/gemini-icon.png', enabled: true });
                    }
                    if (keys.perplexity && keys.perplexity.trim() !== '') {
                        models.push({ id: 'perplexity-sonar', name: 'Sonar', icon: '/perplexity-icon.png', enabled: true });
                    }

                    setAvailableModels(models);
                }
            } catch (error) {
                console.error('Failed to fetch available models:', error);
            }
        };

        fetchAvailableModels();
    }, []);

    // Article State
    const [availableKeywords, setAvailableKeywords] = useState<{ high: string[], medium: string[], low: string[] }>({ high: [], medium: [], low: [] });

    // Load Focus Keywords from Domain Data
    useEffect(() => {
        if (domain?.focus_keywords) {
            console.log('Domain focus_keywords loaded:', domain.focus_keywords);
            setAvailableKeywords({
                high: domain.focus_keywords.high || [],
                medium: domain.focus_keywords.medium || [],
                low: domain.focus_keywords.low || []
            });
        }
    }, [domain]);

    const [isPublishing, setIsPublishing] = useState(false);
    const [showHtml, setShowHtml] = useState(false);

    // Generated Content State (Same as before)
    const [article, setArticle] = useState({
        title: '',
        content: '',
        excerpt: '',
        metaDescription: '',
        keywords: [] as string[],
        imageUrl: ''
    });

    // SEO Score Logic
    const [seoScore, setSeoScore] = useState(0);
    const [seoMetrics, setSeoMetrics] = useState({
        wordCount: 0,
        keywordDensity: 0,
        headingCount: 0,
        hasImage: false,
        hasMeta: false,
        titleLength: 0
    });

    // Calculate SEO Score whenever article changes
    useEffect(() => {
        if (!article.content) return;

        // Strip HTML tags for word count
        const textContent = article.content.replace(/<[^>]+>/g, ' ');
        const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Count headings in HTML (h1, h2, h3)
        const headings = (article.content.match(/<h[1-3][^>]*>/g) || []).length;
        const titleLength = article.title.length;

        // Check presence of ALL selected keywords
        let keywordMatches = 0;
        selectedKeywords.forEach(kw => {
            if (new RegExp(kw, "gi").test(textContent)) {
                keywordMatches++;
            }
        });

        // Simple Density Calc (Main Keyword - First one)
        const primaryKeyword = selectedKeywords[0] || '';
        const keywordCount = primaryKeyword
            ? (textContent.match(new RegExp(primaryKeyword, "gi")) || []).length
            : 0;
        const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

        // Scoring Algorithm (0-100)
        let score = 0;
        if (wordCount > 600) score += 20;
        else if (wordCount > 300) score += 10;

        if (titleLength > 10 && titleLength < 70) score += 15;

        if (keywordMatches > 0 && keywordMatches === selectedKeywords.length) score += 20; // Bonus for using all selected keywords
        else if (keywordMatches > 0) score += 10;

        if (headings > 2) score += 10;
        if (article.metaDescription) score += 10;
        if (article.imageUrl) score += 10;
        if (density >= 0.5 && density <= 2.5) score += 15;

        setSeoScore(Math.min(100, score));
        setSeoMetrics({
            wordCount,
            keywordDensity: parseFloat(density.toFixed(1)),
            headingCount: headings,
            hasImage: !!article.imageUrl,
            hasMeta: !!article.metaDescription,
            titleLength
        });

    }, [article, selectedKeywords]);

    // Handle Keyword Selection
    const toggleKeyword = (kw: string) => {
        if (!kw) return;
        if (selectedKeywords.includes(kw)) {
            setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
        } else {
            if (selectedKeywords.length < 3) {
                setSelectedKeywords([...selectedKeywords, kw]);
            } else {
                toast.error('Maximum 3 keywords allowed');
            }
        }
    };

    // Handlers
    const handleGenerate = async () => {
        if (!topic) {
            toast.error('Please enter a topic');
            return;
        }

        const keywordsString = selectedKeywords.join(', ');

        setIsGenerating(true);
        // Simulator for AI Generation (Returning HTML now to match Editor)
        setTimeout(() => {
            setArticle({
                title: `The Ultimate Guide to ${topic}`,
                content: `
                <h1>Introduction to ${topic}</h1>
                <p>${topic} has effectively transformed the way we approach modern challenges. In this comprehensive guide, we will explore the key benefits and strategies to master <strong>${topic}</strong>.</p>

                <h2>Why ${topic} Matters in 2026</h2>
                <p>The landscape of ${topic} is changing rapidly. Experts suggest that integrating <em>${keywordsString || topic}</em> into your workflow can increase efficiency by 40%.</p>

                <h3>Key Benefits</h3>
                <ul>
                    <li>Improved productivity</li>
                    <li>Better results</li>
                    <li>Cost efficiency</li>
                </ul>

                <h2>Conclusion</h2>
                <p>In conclusion, mastering ${keywordsString || topic} is essential for success.</p>
            `,
                excerpt: `Discover the ultimate secrets to mastering ${topic} in this comprehensive guide for 2026.`,
                metaDescription: `Learn everything about ${topic}. This guide covers strategies, tips, and the future of ${keywordsString || topic}.`,
                keywords: [topic, ...selectedKeywords, 'Guide', '2026 Trends'].filter(Boolean),
                imageUrl: '' // Empty provided initially
            });
            setIsGenerating(false);
            toast.success('Article generated!');
        }, 2000);
    };

    // State for tracking saved post
    const [savedPost, setSavedPost] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSavePost = async () => {
        // Validation
        if (!article.title?.trim()) {
            toast.error('Please add a title', { icon: '📝' });
            return;
        }
        if (!article.content?.trim() || article.content === '<p><br></p>') {
            toast.error('Please add content to your article', { icon: '✍️' });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain_slug: domain?.slug,
                    postData: {
                        id: savedPost?.id, // Update if exists
                        title: article.title,
                        slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), // Generate slug
                        content: article.content,
                        featured_image: article.imageUrl,
                        meta_description: article.metaDescription,
                        focus_keywords: selectedKeywords,
                        status: 'draft'
                    }
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || error.error || 'Failed to save post');
            }

            const data = await res.json();
            setSavedPost(data.post);
            toast.success(savedPost?.id ? 'Article updated successfully!' : 'Article saved successfully!', {
                icon: '✅',
                duration: 3000
            });
        } catch (error: any) {
            console.error('Save error:', error);
            if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
                toast.error('Network error. Please check your connection and try again.', {
                    duration: 5000,
                    icon: '🌐'
                });
            } else {
                toast.error(error.message || 'Failed to save post. Please try again.', {
                    duration: 5000,
                    icon: '❌'
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishToWP = async () => {
        if (!savedPost) {
            toast.error('Please save the article first', { icon: '💾' });
            return;
        }

        setIsPublishing(true);
        try {
            const res = await fetch('/api/cms/wordpress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_post',
                    domain: domain?.domain,
                    post: {
                        title: savedPost.title,
                        content: savedPost.content,
                        excerpt: savedPost.excerpt || article.excerpt,
                        status: 'publish',
                        categories: [1],
                        featured_media: savedPost.featured_image
                    }
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to publish');
            }

            const data = await res.json();

            // Show success with link to view post
            const postLink = data.link || data.url;
            if (postLink) {
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">Published successfully!</span>
                        <a
                            href={postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                        >
                            View on WordPress →
                        </a>
                    </div>,
                    { duration: 6000, icon: '🚀' }
                );
            } else {
                toast.success('Published successfully to WordPress!', {
                    icon: '✅',
                    duration: 4000
                });
            }

            // Update local post status
            setSavedPost({ ...savedPost, status: 'published' });
        } catch (error: any) {
            console.error('Publish error:', error);

            if (error.message.includes('authentication') || error.message.includes('401')) {
                toast.error('WordPress authentication failed. Please check your credentials in domain settings.', {
                    duration: 6000,
                    icon: '🔐'
                });
            } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
                toast.error('Network error. Please check your connection.', {
                    duration: 5000,
                    icon: '🌐'
                });
            } else if (error.message.includes('permission')) {
                toast.error('You don\'t have permission to publish posts. Check WordPress user permissions.', {
                    duration: 6000,
                    icon: '⚠️'
                });
            } else {
                toast.error(error.message || 'Failed to publish to WordPress. Please try again.', {
                    duration: 5000,
                    icon: '❌'
                });
            }
        } finally {
            setIsPublishing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    // Quill Toolbar Modules
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean'],
            ['code-block'] // Add code block for consistency if needed
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video', 'code-block'
    ];

    // View State: 'list' | 'editor'
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [postsList, setPostsList] = useState<any[]>([]);
    const [listFilter, setListFilter] = useState<'All' | 'Draft' | 'Published'>('All');
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    // Fetch Posts
    const fetchPosts = async () => {
        if (!domain?.slug) return;
        setIsLoadingPosts(true);
        try {
            const res = await fetch(`/api/posts?domain_slug=${domain.slug}&status=${listFilter}`);
            const data = await res.json();
            if (res.ok) {
                setPostsList(data.posts || []);
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    useEffect(() => {
        if (view === 'list' && domain?.slug) {
            fetchPosts();
        }
    }, [view, listFilter, domain?.slug]);

    const handleCreateNew = () => {
        setArticle({
            title: '',
            content: '',
            excerpt: '',
            metaDescription: '',
            keywords: [],
            imageUrl: ''
        });
        setSavedPost(null);
        setSelectedKeywords([]);
        setTopic('');
        setView('editor');
    };

    const handleEditPost = (post: any) => {
        setSavedPost(post);
        setArticle({
            title: post.title,
            content: post.content || '',
            excerpt: '', // Not stored yet
            metaDescription: post.meta_description || '',
            keywords: [], // Stored in focus_keywords
            imageUrl: post.featured_image || ''
        });
        setSelectedKeywords(post.focus_keywords || []);
        setView('editor');
    };

    // Render List View
    if (view === 'list') {
        return (
                <DashboardLayout domains={domainsData?.domains || []}>
                    <Head><title>{`Posts - ${domain?.domain || 'SEO Agent'}`}</title></Head>
                    <div className="h-full w-full p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
                                <p className="text-neutral-500">Manage and optimize your blog content.</p>
                            </div>
                            <Button onClick={handleCreateNew} className="bg-black text-white hover:bg-neutral-800">
                                <PenTool className="mr-2 h-4 w-4" /> New Article
                            </Button>
                        </div>

                        <Tabs defaultValue="All" className="w-full mb-6" onValueChange={(v) => setListFilter(v as any)}>
                            <TabsList>
                                <TabsTrigger value="All">All Posts</TabsTrigger>
                                <TabsTrigger value="Draft">Drafts</TabsTrigger>
                                <TabsTrigger value="Published">Published</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {isLoadingPosts ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-neutral-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : postsList.length === 0 ? (
                            <div className="text-center py-20 bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
                                <div className="mx-auto bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-sm">
                                    <PenTool className="h-8 w-8 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-medium text-neutral-900">No articles found</h3>
                                <p className="text-neutral-500 mb-6 max-w-sm mx-auto">Get started by creating your first AI-optimized article.</p>
                                <Button onClick={handleCreateNew} variant="outline">Create Article</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {postsList.map((post) => (
                                    <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => handleEditPost(post)}>
                                        <div className="h-40 bg-neutral-100 relative overflow-hidden">
                                            {post.featured_image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                    <ImageIcon className="h-10 w-10 opacity-20" />
                                                </div>
                                            )}
                                            <Badge className={`absolute top-3 right-3 ${post.status === 'publish' ? 'bg-green-500' : 'bg-amber-500'}`}>
                                                {post.status === 'publish' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <CardContent className="p-5">
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{post.title}</h3>
                                            <p className="text-sm text-neutral-500 line-clamp-2 mb-4 h-10">
                                                {post.meta_description || 'No description...'}
                                            </p>
                                            <div className="flex justify-between items-center text-xs text-neutral-400 pt-3 border-t">
                                                <span>{new Date(post.updated_at).toLocaleDateString()}</span>
                                                {post.wp_post_id && <span className="flex items-center text-blue-500"><Globe className="h-3 w-3 mr-1" /> WP Linked</span>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DashboardLayout>
        );
    }

    // Render Editor View
    return (
        <DashboardLayout
            domains={domainsData?.domains || []}
        >
            <Head>
                <title>{`Edit - ${article.title || 'New Post'}`}</title>
            </Head>

            <div className="h-full w-full p-6 space-y-6">
                    {/* Top Action Bar */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setView('list')} className="text-neutral-500 hover:text-neutral-900 -ml-2">
                                ← Back to Posts
                            </Button>
                            <div className="flex items-center gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-9 px-3 gap-2 hover:bg-neutral-50">
                                            <span className="text-sm font-medium">
                                                {availableModels.find(m => m.id === selectedModel)?.name || 'Dpro'}
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
                                        {availableModels.filter(m => m.id.startsWith('gpt')).length > 0 && (
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
                                        {availableModels.filter(m => m.id.startsWith('gemini')).length > 0 && (
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
                                        {availableModels.filter(m => m.id.startsWith('claude')).length > 0 && (
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
                                        {availableModels.filter(m => m.id.startsWith('perplexity')).length > 0 && (
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
                                <Button
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !topic}
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    className="bg-black hover:bg-neutral-800 text-white"
                                    onClick={handleSavePost}
                                    disabled={isSaving || !article.content}
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save{savedPost ? ' (Saved)' : ''}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{savedPost ? 'Edit Article' : 'New Article'}</h1>
                            <p className="text-neutral-500 text-sm">Generate SEO-optimized content for your blog</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                        {/* LEFT COLUMN: Editor & Inputs */}
                        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pb-20 styled-scrollbar pr-2">

                            {/* Article Editor */}
                            <Card className="flex-1 border-neutral-200 shadow-sm">
                                <CardHeader className="pb-3 border-b bg-neutral-50/50">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <PenTool className="h-4 w-4 text-neutral-500" />
                                        Content Editor
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">

                                    {/* Title Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-neutral-500 uppercase">Article Title</label>
                                            <span className={`text-xs ${
                                                article.title.length >= 50 && article.title.length <= 60
                                                    ? 'text-green-600'
                                                    : article.title.length > 0
                                                    ? 'text-amber-600'
                                                    : 'text-neutral-400'
                                            }`}>
                                                {article.title.length} / 50-60 optimal
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter your article title..."
                                            value={article.title}
                                            onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-3 text-lg font-semibold border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        {article.title.length > 0 && article.title.length < 50 && (
                                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Title is too short for optimal SEO (aim for 50-60 characters)
                                            </p>
                                        )}
                                        {article.title.length > 60 && (
                                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Title may be truncated in search results (keep it under 60 characters)
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase flex justify-between">
                                            <span>Featured Image</span>
                                            {article.imageUrl && <span className="text-green-600 text-[10px] flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</span>}
                                        </label>
                                        <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer group">
                                            {article.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={article.imageUrl} alt="Featured" className="max-h-64 rounded-md object-cover" />
                                            ) : (
                                                <>
                                                    <div className="bg-neutral-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                        <ImageIcon className="h-6 w-6 text-neutral-400" />
                                                    </div>
                                                    <p className="text-sm">AI will generate an image here</p>
                                                    <p className="text-xs text-neutral-400 mt-1">or click to upload manually</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 h-[500px] flex flex-col">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-neutral-500 uppercase">Body Content</label>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs ${
                                                    seoMetrics.wordCount >= 600
                                                        ? 'text-green-600 font-medium'
                                                        : seoMetrics.wordCount >= 300
                                                        ? 'text-amber-600'
                                                        : 'text-neutral-500'
                                                }`}>
                                                    {seoMetrics.wordCount} words {seoMetrics.wordCount >= 600 ? '✓' : ''}
                                                </span>
                                                <button
                                                    onClick={() => setShowHtml(!showHtml)}
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <Code className="h-3 w-3" />
                                                    {showHtml ? 'Switch to Visual Editor' : 'Edit Source Code'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white rounded-md overflow-hidden border border-neutral-200 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 relative">
                                            {showHtml ? (
                                                <textarea
                                                    className="w-full h-full p-4 font-mono text-xs text-neutral-800 focus:outline-none resize-none"
                                                    value={article.content}
                                                    onChange={(e) => setArticle({ ...article, content: e.target.value })}
                                                />
                                            ) : (
                                                <ReactQuill
                                                    theme="snow"
                                                    value={article.content}
                                                    onChange={(content) => setArticle({ ...article, content })}
                                                    modules={modules}
                                                    formats={formats}
                                                    className="h-[calc(100%-42px)] border-none"
                                                    placeholder="Start writing or generate content..."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: SEO Sidebar & Publishing */}
                        <div className="flex flex-col gap-6">

                            {/* SEO Score Card */}
                            <Card className="border-neutral-200 shadow-sm overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-blue-600" />
                                        SEO Score
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="relative h-44 w-44 flex items-center justify-center">
                                            {/* Circular Progress Ring - Partial Arc (270 degrees) */}
                                            <svg className="h-full w-full" viewBox="0 0 120 120" style={{ transform: 'rotate(135deg)' }}>
                                                {/* Background Arc (Light Gray) */}
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="50"
                                                    fill="none"
                                                    stroke="#F3F4F6"
                                                    strokeWidth="12"
                                                    strokeLinecap="round"
                                                    strokeDasharray="235.6 314.2"
                                                />
                                                {/* Progress Arc (Colored based on score) */}
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="50"
                                                    fill="none"
                                                    stroke={seoScore >= 80 ? '#10B981' : seoScore >= 50 ? '#60A5FA' : '#F59E0B'}
                                                    strokeWidth="12"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(seoScore / 100) * 235.6} 314.2`}
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>

                                            {/* Center Content */}
                                            <div className="absolute flex flex-col items-center justify-center">
                                                {/* Emoji Icon */}
                                                <div className="text-4xl mb-1">
                                                    {seoScore >= 80 ? '🎉' : seoScore >= 50 ? '👍' : '📝'}
                                                </div>
                                                {/* Score */}
                                                <div className="flex items-baseline">
                                                    <span className="text-4xl font-bold text-neutral-800">
                                                        {seoScore}
                                                    </span>
                                                    <span className="text-lg text-neutral-400 ml-0.5">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Labels */}
                                        <div className="flex items-center justify-between w-full max-w-[160px] mt-4">
                                            <span className="text-xs font-medium text-neutral-400">0%</span>
                                            <span className="text-xs font-medium text-neutral-400">100%</span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[11px] text-center text-neutral-400 max-w-[180px] leading-relaxed">
                                            {seoScore >= 80
                                                ? "You're doing an excellent job! Your content is well optimized"
                                                : seoScore >= 50
                                                ? "You're doing a good effort to reach your goal"
                                                : "Keep working on your content to improve your SEO score"}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Article Optimized</span>
                                            {seoScore >= 80 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-neutral-200">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-neutral-600"><AlignLeft className="h-3 w-3" /> Word Count</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-neutral-700">{seoMetrics.wordCount}</span>
                                                    <div className={`h-2 w-2 rounded-full ${seoMetrics.wordCount > 600 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-neutral-600"><Hash className="h-3 w-3" /> Keyword Density</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-neutral-700">{seoMetrics.keywordDensity}%</span>
                                                    <div className={`h-2 w-2 rounded-full ${seoMetrics.keywordDensity >= 0.5 && seoMetrics.keywordDensity <= 2.5 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-neutral-600"><Type className="h-3 w-3" /> Headings</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-neutral-700">{seoMetrics.headingCount}</span>
                                                    <div className={`h-2 w-2 rounded-full ${seoMetrics.headingCount > 2 ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-neutral-600"><ImageIcon className="h-3 w-3" /> Images</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-neutral-700">{seoMetrics.hasImage ? 1 : 0}</span>
                                                    <div className={`h-2 w-2 rounded-full ${seoMetrics.hasImage ? 'bg-green-500' : 'bg-red-500'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEO Suggestions */}
                                    {seoScore < 80 && (
                                        <div className="pt-4 border-t border-neutral-200">
                                            <h4 className="text-xs font-semibold text-neutral-700 mb-3 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                Suggestions to Improve
                                            </h4>
                                            <div className="space-y-2">
                                                {seoMetrics.wordCount < 600 && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Add <span className="font-medium text-amber-700">{600 - seoMetrics.wordCount} more words</span> to reach optimal length</span>
                                                    </div>
                                                )}
                                                {seoMetrics.keywordDensity < 0.5 && selectedKeywords.length > 0 && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Include your keywords <span className="font-medium text-amber-700">2-3 more times</span> naturally</span>
                                                    </div>
                                                )}
                                                {seoMetrics.headingCount < 3 && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Add <span className="font-medium text-amber-700">{3 - seoMetrics.headingCount} more heading(s)</span> (H2 or H3)</span>
                                                    </div>
                                                )}
                                                {!seoMetrics.hasImage && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Add a <span className="font-medium text-amber-700">featured image</span> to improve engagement</span>
                                                    </div>
                                                )}
                                                {!seoMetrics.hasMeta && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Write a <span className="font-medium text-amber-700">meta description</span> (150-160 chars)</span>
                                                    </div>
                                                )}
                                                {article.title.length > 0 && (article.title.length < 50 || article.title.length > 60) && (
                                                    <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                        <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <span>Optimize title length to <span className="font-medium text-amber-700">50-60 characters</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Article Meta Data */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Meta Data</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-neutral-500">Target Keywords ({selectedKeywords.length}/3)</label>
                                            {domain && (
                                                <Link href={`/domain/settings/${domain.slug}`} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                                                    Edit Strategy <LinkIcon className="h-2 w-2" />
                                                </Link>
                                            )}
                                        </div>

                                        {/* Strategy Keywords Selection */}
                                        <div className="flex flex-wrap gap-2 min-h-[40px]">
                                            {/* High Priority */}
                                            {availableKeywords.high.filter(k => k).map((kw, i) => (
                                                <Badge
                                                    key={`high-${i}`}
                                                    variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                                                    className={`cursor-pointer transition-all ${selectedKeywords.includes(kw) ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                                                    onClick={() => toggleKeyword(kw)}
                                                >
                                                    {kw}
                                                </Badge>
                                            ))}

                                            {/* Medium Priority */}
                                            {availableKeywords.medium.filter(k => k).map((kw, i) => (
                                                <Badge
                                                    key={`medium-${i}`}
                                                    variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                                                    className={`cursor-pointer transition-all ${selectedKeywords.includes(kw) ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500' : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'}`}
                                                    onClick={() => toggleKeyword(kw)}
                                                >
                                                    {kw}
                                                </Badge>
                                            ))}

                                            {/* Low Priority */}
                                            {availableKeywords.low.filter(k => k).map((kw, i) => (
                                                <Badge
                                                    key={`low-${i}`}
                                                    variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                                                    className={`cursor-pointer transition-all ${selectedKeywords.includes(kw) ? 'bg-blue-500 hover:bg-blue-600 border-blue-500' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                                    onClick={() => toggleKeyword(kw)}
                                                >
                                                    {kw}
                                                </Badge>
                                            ))}

                                            {(!availableKeywords.high.length && !availableKeywords.medium.length && !availableKeywords.low.length) && (
                                                <p className="text-xs text-neutral-400 italic">No keywords defined in settings.</p>
                                            )}
                                        </div>

                                        {/* Custom Keyword Input */}
                                        {selectedKeywords.length < 3 && (
                                            <div className="space-y-2 pt-3 border-t border-neutral-100">
                                                <label className="text-xs font-medium text-neutral-600">Or add custom keyword:</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter keyword..."
                                                        className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const input = e.currentTarget;
                                                                const keyword = input.value.trim();
                                                                if (keyword && !selectedKeywords.includes(keyword)) {
                                                                    if (selectedKeywords.length < 3) {
                                                                        setSelectedKeywords([...selectedKeywords, keyword]);
                                                                        input.value = '';
                                                                    } else {
                                                                        toast.error('Maximum 3 keywords allowed');
                                                                    }
                                                                } else if (selectedKeywords.includes(keyword)) {
                                                                    toast.error('Keyword already selected');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs px-3"
                                                        onClick={(e) => {
                                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                            const keyword = input.value.trim();
                                                            if (keyword && !selectedKeywords.includes(keyword)) {
                                                                if (selectedKeywords.length < 3) {
                                                                    setSelectedKeywords([...selectedKeywords, keyword]);
                                                                    input.value = '';
                                                                } else {
                                                                    toast.error('Maximum 3 keywords allowed');
                                                                }
                                                            } else if (selectedKeywords.includes(keyword)) {
                                                                toast.error('Keyword already selected');
                                                            } else {
                                                                toast.error('Please enter a keyword');
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                <p className="text-[10px] text-neutral-400">Press Enter or click Add to include a custom keyword</p>
                                            </div>
                                        )}

                                        {/* Selected Keywords Display */}
                                        {selectedKeywords.length > 0 && (
                                            <div className="space-y-2 pt-3 border-t border-neutral-100">
                                                <label className="text-xs font-medium text-neutral-600">Selected Keywords:</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedKeywords.map((kw, i) => (
                                                        <Badge
                                                            key={`selected-${i}`}
                                                            variant="default"
                                                            className="bg-green-500 hover:bg-green-600 cursor-pointer gap-1"
                                                            onClick={() => toggleKeyword(kw)}
                                                        >
                                                            {kw}
                                                            <span className="text-xs">×</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-neutral-500">Meta Description</label>
                                        <Textarea
                                            className="h-24 text-xs resize-none"
                                            placeholder="Description for search engines..."
                                            value={article.metaDescription}
                                            onChange={(e) => setArticle({ ...article, metaDescription: e.target.value })}
                                        />
                                        <div className="flex justify-end">
                                            <span className={`text-[10px] ${article.metaDescription.length > 160 ? 'text-red-500' : 'text-neutral-400'}`}>
                                                {article.metaDescription.length} / 160
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Publish Actions */}
                            {savedPost && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={handlePublishToWP}
                                            disabled={isPublishing}
                                        >
                                            {isPublishing ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Publishing...
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="mr-2 h-4 w-4" />
                                                    Publish to WordPress
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

