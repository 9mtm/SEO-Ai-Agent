
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import TableSkeleton from '../../../../components/common/TableSkeleton';
import { generateSEOArticlePrompt } from '@/lib/prompts';
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
const ReactQuill = dynamic(() => import('react-quill').then((mod) => {
    const Quill = mod.default.Quill;

    // Extend Image format to support alt attribute
    const ImageBlot = Quill.import('formats/image');
    class CustomImage extends ImageBlot {
        static create(value: any) {
            const node = super.create(value);
            if (typeof value === 'object') {
                node.setAttribute('src', value.src || value);
                if (value.alt) {
                    node.setAttribute('alt', value.alt);
                }
            } else {
                node.setAttribute('src', value);
            }
            return node;
        }

        static formats(domNode: HTMLElement) {
            return {
                src: domNode.getAttribute('src'),
                alt: domNode.getAttribute('alt')
            };
        }

        static value(domNode: HTMLElement) {
            return {
                src: domNode.getAttribute('src'),
                alt: domNode.getAttribute('alt')
            };
        }
    }
    CustomImage.blotName = 'image';
    CustomImage.tagName = 'IMG';
    Quill.register(CustomImage, true);

    // Extend Link format to support title attribute
    const LinkBlot = Quill.import('formats/link');
    class CustomLink extends LinkBlot {
        static create(value: any) {
            const node = super.create(value);
            if (typeof value === 'object') {
                node.setAttribute('href', value.href || value);
                if (value.title) {
                    node.setAttribute('title', value.title);
                }
            }
            return node;
        }

        static formats(domNode: HTMLElement) {
            return {
                href: domNode.getAttribute('href'),
                title: domNode.getAttribute('title')
            };
        }
    }
    CustomLink.blotName = 'link';
    CustomLink.tagName = 'A';
    Quill.register(CustomLink, true);

    return mod.default;
}), {
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
    const [editorKey, setEditorKey] = useState(0); // Force re-render of editor

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
        h1Count: 0, // عدد H1 (يجب أن يكون 1 فقط)
        h2Count: 0, // عدد H2 (المثالي: 3-6)
        h3Count: 0, // عدد H3 (المثالي: 6-12)
        hasImage: false,
        hasMeta: false,
        titleLength: 0,
        keywordsInContent: 0, // عدد الكلمات المفتاحية الموجودة في المحتوى
        keywordInTitle: false, // هل الكلمة المفتاحية الرئيسية في العنوان؟
        keywordInMeta: false, // هل الكلمة المفتاحية في meta description؟
        internalLinks: 0, // عدد الروابط الداخلية
        externalLinks: 0, // عدد الروابط الخارجية
        imagesInContent: 0, // عدد الصور داخل المحتوى
        imagesWithAlt: 0 // عدد الصور التي تحتوي على alt text
    });

    // Calculate SEO Score whenever article changes
    useEffect(() => {
        if (!article.content) return;

        // Strip HTML tags for word count
        const textContent = article.content.replace(/<[^>]+>/g, ' ');
        const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Count headings in HTML - فحص احترافي لكل نوع بشكل منفصل
        const h1Count = (article.content.match(/<h1[^>]*>/gi) || []).length;
        const h2Count = (article.content.match(/<h2[^>]*>/gi) || []).length;
        const h3Count = (article.content.match(/<h3[^>]*>/gi) || []).length;
        const headings = h1Count + h2Count + h3Count; // إجمالي العناوين
        const titleLength = article.title.length;

        // Check presence of ALL selected keywords in content
        let keywordMatches = 0;
        selectedKeywords.forEach(kw => {
            if (new RegExp(kw, "gi").test(textContent)) {
                keywordMatches++;
            }
        });

        // Check if primary keyword is in title
        const primaryKeyword = selectedKeywords[0] || '';
        const keywordInTitle = primaryKeyword ? new RegExp(primaryKeyword, "gi").test(article.title) : false;

        // Check if primary keyword is in meta description
        const keywordInMeta = primaryKeyword ? new RegExp(primaryKeyword, "gi").test(article.metaDescription) : false;

        // Simple Density Calc (Main Keyword - First one)
        const keywordCount = primaryKeyword
            ? (textContent.match(new RegExp(primaryKeyword, "gi")) || []).length
            : 0;
        const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

        // Count internal and external links
        const allLinks = article.content.match(/<a [^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
        let internalLinks = 0;
        let externalLinks = 0;

        allLinks.forEach(link => {
            const hrefMatch = link.match(/href=["']([^"']+)["']/i);
            if (hrefMatch && hrefMatch[1]) {
                const url = hrefMatch[1];
                // Check if it's an internal link (relative or same domain)
                if (url.startsWith('/') || url.startsWith('#') || url.startsWith('./') ||
                    (domain && url.includes(domain.domain))) {
                    internalLinks++;
                } else if (url.startsWith('http')) {
                    externalLinks++;
                }
            }
        });

        // فحص الصور داخل المحتوى وال alt text
        const imgTags = article.content.match(/<img[^>]*>/gi) || [];
        const imagesInContent = imgTags.length;
        let imagesWithAlt = 0;

        imgTags.forEach(img => {
            // Check if image has alt attribute with non-empty value
            const altMatch = img.match(/alt\s*=\s*["']([^"']+)["']/i);
            if (altMatch && altMatch[1] && altMatch[1].trim().length > 0) {
                imagesWithAlt++;
            }
        });

        // Scoring Algorithm (0-100) - محسّن للـ SEO الاحترافي
        let score = 0;

        // Word Count (20 points max)
        if (wordCount > 600) score += 20;
        else if (wordCount > 300) score += 10;

        // Title Length (10 points)
        if (titleLength >= 50 && titleLength <= 60) score += 10;
        else if (titleLength >= 40 && titleLength < 70) score += 5;

        // Keywords in content (15 points)
        if (keywordMatches > 0 && keywordMatches === selectedKeywords.length) score += 15;
        else if (keywordMatches > 0) score += 8;

        // Primary keyword in title (10 points) - مهم جداً للـ SEO
        if (keywordInTitle) score += 10;

        // Primary keyword in meta description (8 points)
        if (keywordInMeta) score += 8;

        // Headings Structure (8 points) - فحص احترافي للبنية الهرمية
        // المثالي: H1=1, H2=3-6, H3=6-12
        let headingScore = 0;
        if (h1Count === 1) headingScore += 2; // H1 واحد فقط (مثالي)
        else if (h1Count === 0) headingScore += 0; // لا يوجد H1 (سيء)
        else headingScore -= 1; // أكثر من H1 (سيء للـ SEO)

        if (h2Count >= 3 && h2Count <= 6) headingScore += 3; // H2 مثالي
        else if (h2Count >= 2 && h2Count <= 8) headingScore += 2; // H2 مقبول
        else if (h2Count > 0) headingScore += 1; // H2 موجود على الأقل

        if (h3Count >= 6 && h3Count <= 12) headingScore += 3; // H3 مثالي
        else if (h3Count >= 3 && h3Count <= 15) headingScore += 2; // H3 مقبول
        else if (h3Count > 0) headingScore += 1; // H3 موجود على الأقل

        score += Math.max(0, headingScore); // لا تسمح بنقاط سالبة

        // Meta description (7 points)
        if (article.metaDescription && article.metaDescription.length >= 120 && article.metaDescription.length <= 160) score += 7;
        else if (article.metaDescription) score += 3;

        // Featured image (7 points)
        if (article.imageUrl) score += 7;

        // Keyword density (8 points)
        if (density >= 0.5 && density <= 2.5) score += 8;
        else if (density > 0) score += 3;

        // Internal links (7 points) - مهم للـ SEO
        if (internalLinks >= 2) score += 7;
        else if (internalLinks >= 1) score += 3;

        // Images in content with alt text (5 points) - مهم للـ accessibility والـ SEO
        if (imagesInContent > 0 && imagesWithAlt === imagesInContent) score += 5; // جميع الصور بها alt text
        else if (imagesWithAlt > 0) score += 2; // بعض الصور بها alt text

        setSeoScore(Math.min(100, score));
        setSeoMetrics({
            wordCount,
            keywordDensity: parseFloat(density.toFixed(1)),
            headingCount: headings,
            h1Count,
            h2Count,
            h3Count,
            hasImage: !!article.imageUrl,
            hasMeta: !!article.metaDescription,
            titleLength,
            keywordsInContent: keywordMatches,
            keywordInTitle,
            keywordInMeta,
            internalLinks,
            externalLinks,
            imagesInContent,
            imagesWithAlt
        });

    }, [article, selectedKeywords, domain]);

    // Add event listeners to images and links in the editor
    useEffect(() => {
        const timer = setTimeout(() => {
            const editorContainer = document.querySelector('.ql-editor');
            if (!editorContainer) {
                console.log('⚠️ Editor container not found');
                return;
            }

            // Add click listeners to all images
            const images = editorContainer.querySelectorAll('img');
            console.log(`📸 Found ${images.length} images in editor`);

            images.forEach((img, index) => {
                const imgSrc = img.getAttribute('src');
                const imgAlt = img.alt;
                console.log(`Image ${index + 1}:`, { src: imgSrc, alt: imgAlt });

                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalSrc = img.getAttribute('src') || img.src;
                    console.log('🖱️ Image clicked:', originalSrc);
                    setCurrentImageData({
                        src: originalSrc,
                        alt: img.alt || '',
                        index: -1
                    });
                    setShowImageEditor(true);
                };
            });

            // Add click listeners to all links
            const links = editorContainer.querySelectorAll('a');
            links.forEach(link => {
                link.style.cursor = 'pointer';
                link.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentLinkData({
                        href: link.getAttribute('href') || '',
                        title: link.title || '',
                        text: link.textContent || '',
                        index: -1
                    });
                    setShowLinkEditor(true);
                };
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [article.content, showHtml]);

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

        if (selectedKeywords.length === 0) {
            toast.error('Please select at least one keyword');
            return;
        }

        setIsGenerating(true);

        try {
            // استخدام Prompt Library لإنشاء prompt احترافي
            const primaryKeyword = selectedKeywords[0];
            const secondaryKeywords = selectedKeywords.slice(1);

            const professionalPrompt = generateSEOArticlePrompt({
                topic,
                primaryKeyword,
                secondaryKeywords,
                targetLength: 1200,
                tone: 'conversational',
                targetAudience: 'general readers',
                includeImages: true,
                language: 'en'
            });

            console.log('📝 Using Prompt Library v2.0.0');

            // استدعاء API مع dpro model
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: professionalPrompt }
                    ],
                    domain: domain?.domain || 'general',
                    model: selectedModel || 'qwen-local', // استخدام الموديل المختار أو dpro
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate article');
            }

            // قراءة الاستجابة كـ stream من OpenAI-compatible API
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // تحليل SSE format: كل سطر بصيغة 0:"token"
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            // استخراج النص من صيغة 0:"text"
                            const match = line.match(/0:"(.*)"/);
                            if (match && match[1]) {
                                // فك escape sequences
                                let token = match[1]
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\');
                                fullResponse += token;
                            }
                        }
                    }
                }
            }

            // تحليل الاستجابة - محاولة ذكية لاستخراج المحتوى
            console.log('Full AI Response:', fullResponse.substring(0, 500)); // للتشخيص

            let articleGenerated = false;

            // محاولة 1: البحث عن JSON كامل
            try {
                const jsonMatch = fullResponse.match(/\{[\s\S]*?"title"[\s\S]*?"content"[\s\S]*?\}/);
                if (jsonMatch) {
                    const articleData = JSON.parse(jsonMatch[0]);

                    setArticle({
                        title: articleData.title || topic,
                        content: articleData.content || '<p>Generated content...</p>',
                        excerpt: articleData.excerpt || '',
                        metaDescription: articleData.metaDescription || '',
                        keywords: selectedKeywords,
                        imageUrl: ''
                    });

                    toast.success('Article generated successfully!', { duration: 3000 });
                    articleGenerated = true;
                }
            } catch (e) {
                console.log('JSON parsing failed, trying alternative methods...');
            }

            // محاولة 2: إذا فشل JSON، استخدم النص مباشرة كمحتوى HTML
            if (!articleGenerated) {
                // تنظيف النص من markdown أو أي رموز غير ضرورية
                let cleanedContent = fullResponse
                    .replace(/```json/g, '')
                    .replace(/```html/g, '')
                    .replace(/```/g, '')
                    .replace(/^\s*\{[\s\S]*?\}\s*$/gm, '') // إزالة محاولات JSON فاشلة
                    .trim();

                // استخراج Title من H1 إذا موجود
                let extractedTitle = topic;
                const h1Match = cleanedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
                if (h1Match && h1Match[1]) {
                    extractedTitle = h1Match[1].replace(/<[^>]+>/g, '').trim(); // إزالة أي HTML tags داخل H1
                    // تأكد أن الطول مثالي (50-60 حرف)
                    if (extractedTitle.length > 60) {
                        extractedTitle = extractedTitle.substring(0, 57) + '...';
                    }
                }

                // إذا لم يحتوي على HTML tags، قم بتحويله
                if (!cleanedContent.includes('<h1>') && !cleanedContent.includes('<h2>')) {
                    // تحويل النص العادي إلى HTML
                    const lines = cleanedContent.split('\n');
                    let htmlContent = '';
                    let firstHeading = true;

                    for (let line of lines) {
                        line = line.trim();
                        if (!line) continue;

                        // تحديد نوع السطر
                        if (line.startsWith('# ')) {
                            const heading = line.substring(2);
                            htmlContent += `<h1>${heading}</h1>\n`;
                            if (firstHeading) {
                                extractedTitle = heading.substring(0, 60);
                                firstHeading = false;
                            }
                        } else if (line.startsWith('## ')) {
                            htmlContent += `<h2>${line.substring(3)}</h2>\n`;
                        } else if (line.startsWith('### ')) {
                            htmlContent += `<h3>${line.substring(4)}</h3>\n`;
                        } else if (line.startsWith('- ') || line.startsWith('* ')) {
                            htmlContent += `<li>${line.substring(2)}</li>\n`;
                        } else {
                            htmlContent += `<p>${line}</p>\n`;
                        }
                    }

                    // إذا لم يتم إيجاد H1، أضف واحد في البداية
                    if (!htmlContent.includes('<h1>')) {
                        htmlContent = `<h1>${extractedTitle}</h1>\n\n` + htmlContent;
                    }

                    cleanedContent = htmlContent;
                } else if (!cleanedContent.includes('<h1>')) {
                    // إضافة H1 إذا لم يكن موجوداً
                    cleanedContent = `<h1>${extractedTitle}</h1>\n\n` + cleanedContent;
                }

                // استخراج أول فقرتين كـ excerpt و meta description
                const paragraphs = cleanedContent.match(/<p>(.*?)<\/p>/g);
                let excerpt = '';
                let metaDescription = '';

                if (paragraphs && paragraphs.length > 0) {
                    // جمع أول فقرتين
                    let combinedText = '';
                    for (let i = 0; i < Math.min(2, paragraphs.length); i++) {
                        const text = paragraphs[i].replace(/<[^>]+>/g, '').trim();
                        combinedText += text + ' ';
                    }

                    // Excerpt: 160 حرف
                    excerpt = combinedText.substring(0, 160).trim();
                    if (combinedText.length > 160) excerpt += '...';

                    // Meta Description: 150-160 حرف مع الكلمة المفتاحية
                    const primaryKeyword = selectedKeywords[0];
                    if (combinedText.includes(primaryKeyword)) {
                        // إذا الكلمة موجودة، استخدم النص كما هو
                        metaDescription = combinedText.substring(0, 157).trim() + '...';
                    } else {
                        // إذا الكلمة غير موجودة، أضفها في البداية
                        metaDescription = `${primaryKeyword}: ${combinedText.substring(0, 150 - primaryKeyword.length)}...`;
                    }
                } else {
                    // fallback إذا لم توجد فقرات
                    excerpt = `Learn about ${extractedTitle}`;
                    metaDescription = `Discover everything about ${primaryKeyword}. ${extractedTitle.substring(0, 100)}`;
                }

                setArticle({
                    title: extractedTitle,
                    content: cleanedContent,
                    excerpt: excerpt,
                    metaDescription: metaDescription.substring(0, 160), // تأكد من الحد الأقصى
                    keywords: selectedKeywords,
                    imageUrl: ''
                });

                toast.success('Article generated! Title and meta description extracted.', { duration: 3000 });
            }

        } catch (error: any) {
            console.error('Error generating article:', error);
            toast.error(error.message || 'Failed to generate article. Please try again.', { duration: 5000 });
        } finally {
            setIsGenerating(false);
        }
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
                        status: 'draft',
                        seo_score: seoScore // حفظ نتيجة SEO
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

    // Handle Image Upload/Input
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Image/Link Editor Modals
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [showLinkEditor, setShowLinkEditor] = useState(false);
    const [currentImageData, setCurrentImageData] = useState<{ src: string, alt: string, index: number } | null>(null);
    const [currentLinkData, setCurrentLinkData] = useState<{ href: string, title: string, text: string, index: number } | null>(null);
    const handleImageInput = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            // Validate
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }

            setIsUploadingImage(true);
            try {
                // For now, use local data URL (or implement upload API later)
                const reader = new FileReader();
                reader.onloadend = () => {
                    setArticle(prev => ({ ...prev, imageUrl: reader.result as string }));
                    toast.success('Image added! (Local preview)');
                    setIsUploadingImage(false);
                };
                reader.readAsDataURL(file);
            } catch (error: any) {
                console.error('Error handling image:', error);
                toast.error('Failed to add image');
                setIsUploadingImage(false);
            }
        };
        input.click();
    };

    // Update image alt text
    const handleUpdateImageAlt = () => {
        if (!currentImageData) return;

        console.log('=== UPDATE IMAGE ALT TEXT ===');
        console.log('Current image data:', currentImageData);

        let content = article.content;
        console.log('Content BEFORE update:', content);

        // Find the exact image tag by src
        const escapedSrc = currentImageData.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        console.log('Escaped src:', escapedSrc);

        const imgRegex = new RegExp(`<img[^>]*src\\s*=\\s*["']${escapedSrc}["'][^>]*>`, 'gi');
        const matches = content.match(imgRegex);

        console.log('Regex matches:', matches);

        if (!matches || matches.length === 0) {
            console.error('❌ Image not found in content!');
            toast.error('Image not found in content');
            return;
        }

        const oldImgTag = matches[0];
        console.log('Old img tag:', oldImgTag);

        // Create new image tag with updated alt
        let newImgTag;
        if (oldImgTag.includes('alt=') || oldImgTag.includes('alt =')) {
            // Replace existing alt attribute
            newImgTag = oldImgTag.replace(/alt\s*=\s*["'][^"']*["']/i, `alt="${currentImageData.alt}"`);
            console.log('Replacing existing alt');
        } else {
            // Add new alt attribute after src
            newImgTag = oldImgTag.replace(/(<img[^>]*src\s*=\s*["'][^"']*["'])/, `$1 alt="${currentImageData.alt}"`);
            console.log('Adding new alt');
        }

        console.log('New img tag:', newImgTag);

        // Replace in content
        content = content.replace(oldImgTag, newImgTag);
        console.log('Content AFTER update:', content);

        setArticle(prev => ({ ...prev, content }));
        console.log('✅ Article state updated');

        // Force re-render of ReactQuill to preserve alt attribute
        setEditorKey(prev => prev + 1);
        console.log('🔄 Editor re-render triggered');

        setShowImageEditor(false);
        setCurrentImageData(null);
        toast.success('Image alt text updated!');
    };

    // Update link title
    const handleUpdateLinkTitle = () => {
        if (!currentLinkData) return;

        let content = article.content;
        const linkTags = content.match(/<a [^>]*>.*?<\/a>/gi) || [];

        // Find the exact link tag
        const oldLinkTag = linkTags.find(tag =>
            tag.includes(currentLinkData.href) && tag.includes(currentLinkData.text)
        );
        if (!oldLinkTag) return;

        // Create new link tag with updated title
        const newLinkTag = oldLinkTag.includes('title=')
            ? oldLinkTag.replace(/title\s*=\s*["'][^"']*["']/i, `title="${currentLinkData.title}"`)
            : oldLinkTag.replace(/<a /, `<a title="${currentLinkData.title}" `);

        // Replace in content
        content = content.replace(oldLinkTag, newLinkTag);
        setArticle(prev => ({ ...prev, content }));

        // Force re-render of ReactQuill
        setEditorKey(prev => prev + 1);

        setShowLinkEditor(false);
        setCurrentLinkData(null);
        toast.success('Link title updated!');
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
                        <TableSkeleton rows={5} />
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
                        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-neutral-50 font-medium text-sm text-neutral-500">
                                <div className="col-span-12 lg:col-span-6">Article</div>
                                <div className="col-span-2 hidden lg:block">Status</div>
                                <div className="col-span-2 hidden lg:block">Last Updated</div>
                                <div className="col-span-2 hidden lg:block text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {postsList.map((post) => (
                                    <div key={post.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-neutral-50 transition-colors group">
                                        {/* Article Info */}
                                        <div className="col-span-9 lg:col-span-6 flex items-center gap-4 cursor-pointer" onClick={() => handleEditPost(post)}>
                                            <div className="h-12 w-16 bg-neutral-100 rounded-md overflow-hidden relative shrink-0 border border-neutral-200">
                                                {post.featured_image ? (
                                                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                        <ImageIcon className="h-5 w-5 opacity-30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-neutral-900 truncate group-hover:text-blue-600 transition-colors" title={post.title}>{post.title}</h3>
                                                <p className="text-xs text-neutral-500 truncate max-w-[300px]">{post.meta_description || 'No description'}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-3 lg:col-span-2 flex items-center">
                                            <Badge className={`px-2.5 py-0.5 rounded-full font-normal shadow-none ${post.status === 'publish' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'}`}>
                                                {post.status === 'publish' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-2 hidden lg:flex flex-col justify-center text-sm text-neutral-500">
                                            <span suppressHydrationWarning>{new Date(post.updated_at).toLocaleDateString()}</span>
                                            {post.wp_post_id && <span className="text-[10px] text-blue-500 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-1"><Globe className="h-3 w-3" /> WordPress</span>}
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-2 hidden lg:flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleEditPost(post)} className="h-8 w-8 p-0 hover:bg-neutral-100">
                                                <PenTool className="h-4 w-4 text-neutral-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

                                {/* Topic Input - for AI Generation */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Article Topic/Idea</label>
                                        {topic && <span className="text-xs text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</span>}
                                    </div>
                                    <Textarea
                                        placeholder="Enter your article topic or main idea... e.g., 'How to improve SEO rankings in 2026'"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="min-h-[80px] text-sm"
                                    />
                                    <p className="text-xs text-neutral-500">
                                        This will be used by AI to generate your article. Be specific for better results.
                                    </p>
                                </div>

                                {/* Title Input */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Article Title</label>
                                        <span className={`text-xs ${article.title.length >= 50 && article.title.length <= 60
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
                                    <div
                                        onClick={handleImageInput}
                                        className="border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:border-blue-400 transition-colors cursor-pointer group relative"
                                    >
                                        {isUploadingImage && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                        {article.imageUrl ? (
                                            <div className="relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={article.imageUrl} alt="Featured" className="max-h-64 rounded-md object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                    <p className="text-white text-sm">Click to change</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-neutral-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="h-6 w-6 text-neutral-400" />
                                                </div>
                                                <p className="text-sm font-medium">Click to upload image</p>
                                                <p className="text-xs text-neutral-400 mt-1">or AI will generate one (coming soon)</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 h-[500px] flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Body Content</label>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs ${seoMetrics.wordCount >= 600
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
                                                key={editorKey}
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
                                            {/* Score */}
                                            <div className="flex items-baseline">
                                                <span className="text-5xl font-bold text-neutral-800">
                                                    {seoScore}
                                                </span>
                                                <span className="text-xl text-neutral-400 ml-1">%</span>
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
                                            <span className="flex items-center gap-2 text-neutral-600"><Type className="h-3 w-3" /> Heading Structure</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-neutral-600">
                                                    H1:<span className={`font-semibold ml-0.5 ${seoMetrics.h1Count === 1 ? 'text-green-600' : 'text-red-600'}`}>{seoMetrics.h1Count}</span>
                                                    <span className="mx-1.5 text-neutral-300">|</span>
                                                    H2:<span className={`font-semibold ml-0.5 ${seoMetrics.h2Count >= 3 && seoMetrics.h2Count <= 6 ? 'text-green-600' : seoMetrics.h2Count >= 2 && seoMetrics.h2Count <= 8 ? 'text-amber-600' : 'text-red-600'}`}>{seoMetrics.h2Count}</span>
                                                    <span className="mx-1.5 text-neutral-300">|</span>
                                                    H3:<span className={`font-semibold ml-0.5 ${seoMetrics.h3Count >= 6 && seoMetrics.h3Count <= 12 ? 'text-green-600' : seoMetrics.h3Count >= 3 && seoMetrics.h3Count <= 15 ? 'text-amber-600' : seoMetrics.h3Count > 0 ? 'text-blue-600' : 'text-red-600'}`}>{seoMetrics.h3Count}</span>
                                                </span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.h1Count === 1 && seoMetrics.h2Count >= 3 && seoMetrics.h2Count <= 6 && seoMetrics.h3Count >= 6 && seoMetrics.h3Count <= 12
                                                    ? 'bg-green-500'
                                                    : seoMetrics.headingCount > 2 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><ImageIcon className="h-3 w-3" /> Images</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.hasImage ? 1 : 0}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.hasImage ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>

                                        {/* New Professional SEO Metrics */}
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-100">
                                            <span className="flex items-center gap-2 text-neutral-600"><Hash className="h-3 w-3" /> Keywords in Content</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.keywordsInContent}/{selectedKeywords.length}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.keywordsInContent === selectedKeywords.length && selectedKeywords.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><CheckCircle2 className="h-3 w-3" /> Keyword in Title</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.keywordInTitle ? 'Yes' : 'No'}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.keywordInTitle ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><CheckCircle2 className="h-3 w-3" /> Keyword in Meta</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.keywordInMeta ? 'Yes' : 'No'}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.keywordInMeta ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><LinkIcon className="h-3 w-3" /> Internal Links</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.internalLinks}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.internalLinks >= 2 ? 'bg-green-500' : seoMetrics.internalLinks >= 1 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><Globe className="h-3 w-3" /> External Links</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.externalLinks}</span>
                                                <div className={`h-2 w-2 rounded-full bg-blue-400`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-neutral-600"><ImageIcon className="h-3 w-3" /> Images in Content</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-neutral-700">{seoMetrics.imagesInContent}</span>
                                                <div className={`h-2 w-2 rounded-full ${seoMetrics.imagesInContent > 0 ? 'bg-green-500' : 'bg-neutral-300'}`} />
                                            </div>
                                        </div>
                                        {seoMetrics.imagesInContent > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-neutral-600 pl-4">
                                                    <CheckCircle2 className="h-3 w-3" /> With Alt Text
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-neutral-700">
                                                        {seoMetrics.imagesWithAlt}/{seoMetrics.imagesInContent}
                                                    </span>
                                                    <div className={`h-2 w-2 rounded-full ${seoMetrics.imagesWithAlt === seoMetrics.imagesInContent
                                                        ? 'bg-green-500'
                                                        : seoMetrics.imagesWithAlt > 0
                                                            ? 'bg-amber-500'
                                                            : 'bg-red-500'
                                                        }`} />
                                                </div>
                                            </div>
                                        )}
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

                                            {/* New Professional SEO Suggestions */}
                                            {selectedKeywords.length > 0 && seoMetrics.keywordsInContent < selectedKeywords.length && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Include <span className="font-medium text-red-700">all selected keywords</span> in your content ({seoMetrics.keywordsInContent}/{selectedKeywords.length} found)</span>
                                                </div>
                                            )}
                                            {selectedKeywords.length > 0 && !seoMetrics.keywordInTitle && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add your <span className="font-medium text-red-700">primary keyword</span> "{selectedKeywords[0]}" to the title</span>
                                                </div>
                                            )}
                                            {selectedKeywords.length > 0 && article.metaDescription && !seoMetrics.keywordInMeta && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <span>Include <span className="font-medium text-amber-700">primary keyword</span> in meta description</span>
                                                </div>
                                            )}
                                            {seoMetrics.internalLinks === 0 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add at least <span className="font-medium text-red-700">2-3 internal links</span> to other pages on your site</span>
                                                </div>
                                            )}
                                            {seoMetrics.internalLinks === 1 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add <span className="font-medium text-amber-700">1-2 more internal links</span> to improve SEO</span>
                                                </div>
                                            )}

                                            {/* Images Alt Text Suggestions */}
                                            {seoMetrics.imagesInContent > 0 && seoMetrics.imagesWithAlt === 0 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add <span className="font-medium text-red-700">alt text</span> to all {seoMetrics.imagesInContent} images for better SEO and accessibility</span>
                                                </div>
                                            )}
                                            {seoMetrics.imagesInContent > 0 && seoMetrics.imagesWithAlt > 0 && seoMetrics.imagesWithAlt < seoMetrics.imagesInContent && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add <span className="font-medium text-amber-700">alt text</span> to the remaining {seoMetrics.imagesInContent - seoMetrics.imagesWithAlt} images</span>
                                                </div>
                                            )}

                                            {/* Heading Structure Suggestions */}
                                            {seoMetrics.h1Count === 0 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add <span className="font-medium text-red-700">one H1 heading</span> as the main article title</span>
                                                </div>
                                            )}
                                            {seoMetrics.h1Count > 1 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-red-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Use only <span className="font-medium text-red-700">one H1 heading</span> (currently: {seoMetrics.h1Count}). Multiple H1s hurt SEO</span>
                                                </div>
                                            )}
                                            {seoMetrics.h2Count < 3 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add <span className="font-medium text-amber-700">{3 - seoMetrics.h2Count} more H2 headings</span> to structure content (optimal: 3-6)</span>
                                                </div>
                                            )}
                                            {seoMetrics.h3Count < 6 && seoMetrics.h2Count >= 3 && (
                                                <div className="text-xs text-neutral-600 flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                                                    <AlertCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <span>Consider adding <span className="font-medium text-blue-700">{6 - seoMetrics.h3Count} more H3 sub-headings</span> for better content hierarchy (optimal: 6-12)</span>
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

            {/* Image Alt Text Editor Modal */}
            {showImageEditor && currentImageData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageEditor(false)}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Image Alt Text</h3>
                            <button
                                onClick={() => setShowImageEditor(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <img
                                    src={currentImageData.src}
                                    alt={currentImageData.alt}
                                    className="w-full h-48 object-cover rounded-md border border-neutral-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Alt Text (for SEO & Accessibility)
                                </label>
                                <input
                                    type="text"
                                    value={currentImageData.alt}
                                    onChange={(e) => setCurrentImageData({ ...currentImageData, alt: e.target.value })}
                                    placeholder="Describe the image..."
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    Describe what's in the image for screen readers and search engines
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowImageEditor(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateImageAlt}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Update Alt Text
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Title Editor Modal */}
            {showLinkEditor && currentLinkData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkEditor(false)}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Link Title</h3>
                            <button
                                onClick={() => setShowLinkEditor(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Link Text
                                </label>
                                <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                                    {currentLinkData.text}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Link URL
                                </label>
                                <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700 truncate">
                                    {currentLinkData.href}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Link Title (Tooltip)
                                </label>
                                <input
                                    type="text"
                                    value={currentLinkData.title}
                                    onChange={(e) => setCurrentLinkData({ ...currentLinkData, title: e.target.value })}
                                    placeholder="Add a descriptive title..."
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    This appears when users hover over the link
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLinkEditor(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateLinkTitle}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Update Title
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

