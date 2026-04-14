import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Copy, Check, Bot, Zap, Search, BarChart3, PenTool, Globe, ArrowRight, Sparkles } from 'lucide-react';
import LandingHeader from '../components/common/LandingHeader';
import Footer from '../components/common/Footer';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const SEO_SKILL_PROMPT = `You are an elite SEO strategist and consultant with 15+ years of experience. You have access to SEO Agent tools via MCP that give you real-time data about websites, keywords, rankings, and competitors.

## Your Expertise
- Technical SEO auditing (site speed, crawlability, indexation, Core Web Vitals)
- Keyword research & strategy (search intent, difficulty, opportunity scoring)
- On-page optimization (title tags, meta descriptions, headings, internal linking)
- Content strategy & creation (topic clusters, content gaps, E-E-A-T optimization)
- Competitor analysis (ranking gaps, content comparison, backlink opportunities)
- Search Console data interpretation (CTR optimization, impression trends, query analysis)
- AI search optimization (ChatGPT, Perplexity, Google SGE visibility)

## Your MCP Tools
You have these tools available — use them proactively:
- **list_domains** / **get_domain_insight** — view websites and their analytics
- **get_domain_keywords** — see Search Console keyword data
- **list_tracked_keywords** / **add_tracked_keyword** — manage keyword tracking
- **get_domain_seo_overview** — SEO health with period-over-period changes
- **find_keyword_opportunities** — discover quick-win keywords (striking distance, low CTR, rising)
- **list_domain_competitors** / **get_keyword_competitors** — competitive analysis
- **generate_content_brief** — create SEO-optimized content briefs
- **analyze_seo** — run 20+ SEO checks on content (score 0-100)
- **save_post** / **list_posts** — manage SEO-optimized articles

## How You Work
1. **Always start with data** — Before giving advice, pull real data using your tools
2. **Be specific** — Give exact recommendations with numbers, not generic tips
3. **Prioritize by impact** — Focus on changes that will move the needle most
4. **Explain the "why"** — Help users understand the reasoning behind each recommendation
5. **Action-oriented** — Every analysis ends with a clear action plan
6. **Use tables and structure** — Present data in organized, scannable formats

## Response Style
- Professional but approachable
- Data-driven with real metrics from the user's website
- Include specific keyword suggestions with search volume estimates
- Provide before/after examples when suggesting changes
- Always consider the user's business context and goals`;

const EXAMPLE_PROMPTS = {
    en: [
        { title: 'Full SEO Audit', prompt: 'Analyze my website and give me a complete SEO audit with prioritized action items.' },
        { title: 'Keyword Opportunities', prompt: 'Find keyword opportunities where I\'m ranking on page 2 that could be pushed to page 1 with small improvements.' },
        { title: 'Content Strategy', prompt: 'Based on my current keywords and competitors, create a 3-month content plan with topic clusters.' },
        { title: 'Competitor Analysis', prompt: 'Compare my website against my top competitors and show me where they\'re winning and where I have opportunities.' },
        { title: 'Write SEO Article', prompt: 'Generate a content brief for [topic] and write an SEO-optimized article targeting the best keywords.' },
        { title: 'CTR Optimization', prompt: 'Find pages with high impressions but low CTR and suggest better title tags and meta descriptions.' },
    ],
    de: [
        { title: 'Vollständiges SEO-Audit', prompt: 'Analysiere meine Website und erstelle ein vollständiges SEO-Audit mit priorisierten Maßnahmen.' },
        { title: 'Keyword-Chancen', prompt: 'Finde Keywords, bei denen ich auf Seite 2 ranke und die mit kleinen Verbesserungen auf Seite 1 gebracht werden können.' },
        { title: 'Content-Strategie', prompt: 'Erstelle basierend auf meinen Keywords und Wettbewerbern einen 3-Monats-Content-Plan mit Themen-Clustern.' },
        { title: 'Wettbewerbsanalyse', prompt: 'Vergleiche meine Website mit meinen Top-Wettbewerbern und zeige mir, wo sie gewinnen und wo ich Chancen habe.' },
        { title: 'SEO-Artikel schreiben', prompt: 'Erstelle ein Content-Briefing für [Thema] und schreibe einen SEO-optimierten Artikel.' },
        { title: 'CTR-Optimierung', prompt: 'Finde Seiten mit hohen Impressionen aber niedriger CTR und schlage bessere Titel und Meta-Beschreibungen vor.' },
    ],
    fr: [
        { title: 'Audit SEO complet', prompt: 'Analysez mon site web et donnez-moi un audit SEO complet avec des actions prioritaires.' },
        { title: 'Opportunités de mots-clés', prompt: 'Trouvez les mots-clés où je suis en page 2 et qui pourraient passer en page 1 avec de petites améliorations.' },
        { title: 'Stratégie de contenu', prompt: 'Créez un plan de contenu sur 3 mois avec des clusters thématiques basé sur mes mots-clés et concurrents.' },
        { title: 'Analyse concurrentielle', prompt: 'Comparez mon site avec mes principaux concurrents et montrez-moi où ils gagnent et où j\'ai des opportunités.' },
        { title: 'Rédiger un article SEO', prompt: 'Générez un brief de contenu pour [sujet] et rédigez un article optimisé pour le SEO.' },
        { title: 'Optimisation du CTR', prompt: 'Trouvez les pages avec beaucoup d\'impressions mais un faible CTR et suggérez de meilleurs titres et méta-descriptions.' },
    ],
};

const TEXTS = {
    en: {
        title: 'Turn Claude into Your SEO Expert',
        subtitle: 'Add this skill to Claude and connect your SEO Agent data. Get professional SEO analysis, keyword research, and content optimization — powered by your real website data.',
        step1Title: 'Step 1: Copy the SEO Expert Skill',
        step1Desc: 'Add this as Project Instructions in Claude.ai, or as Custom Instructions in Claude Desktop.',
        step2Title: 'Step 2: Connect SEO Agent MCP',
        step2Desc: 'Add this URL to Claude Desktop, Cursor, or any MCP-compatible AI client.',
        step2Note: 'Claude will open your browser to approve the connection. No tokens needed.',
        mcpName: 'MCP Server Name',
        mcpUrl: 'MCP Server URL',
        examplesTitle: 'Example Prompts to Try',
        examplesDesc: 'Once set up, try these prompts to see your SEO Expert in action:',
        howItWorksTitle: 'How It Works',
        howStep1: 'You add the skill prompt to Claude — this gives it deep SEO expertise',
        howStep2: 'You connect the MCP server — this gives Claude access to your real data',
        howStep3: 'Claude becomes your personal SEO consultant with live data from your websites',
        ctaTitle: 'Ready to supercharge your SEO?',
        ctaDesc: 'Create a free account and connect your websites to get started.',
        ctaBtn: 'Create Free Account',
        copySkill: 'Copy Skill',
        copied: 'Copied!',
        copyPrompt: 'Copy',
        learnMore: 'Learn more about MCP setup',
    },
    de: {
        title: 'Machen Sie Claude zu Ihrem SEO-Experten',
        subtitle: 'Fügen Sie diesen Skill zu Claude hinzu und verbinden Sie Ihre SEO Agent Daten. Erhalten Sie professionelle SEO-Analysen, Keyword-Recherchen und Content-Optimierung — basierend auf Ihren echten Website-Daten.',
        step1Title: 'Schritt 1: SEO-Experten-Skill kopieren',
        step1Desc: 'Fügen Sie dies als Project Instructions in Claude.ai oder als Custom Instructions in Claude Desktop hinzu.',
        step2Title: 'Schritt 2: SEO Agent MCP verbinden',
        step2Desc: 'Fügen Sie diese URL in Claude Desktop, Cursor oder einen MCP-kompatiblen AI-Client ein.',
        step2Note: 'Claude öffnet Ihren Browser zur Genehmigung der Verbindung. Keine Tokens erforderlich.',
        mcpName: 'MCP-Servername',
        mcpUrl: 'MCP-Server-URL',
        examplesTitle: 'Beispiel-Prompts zum Ausprobieren',
        examplesDesc: 'Nach der Einrichtung probieren Sie diese Prompts aus:',
        howItWorksTitle: 'So funktioniert es',
        howStep1: 'Sie fügen den Skill-Prompt zu Claude hinzu — das gibt ihm tiefes SEO-Wissen',
        howStep2: 'Sie verbinden den MCP-Server — das gibt Claude Zugriff auf Ihre echten Daten',
        howStep3: 'Claude wird Ihr persönlicher SEO-Berater mit Live-Daten Ihrer Websites',
        ctaTitle: 'Bereit, Ihr SEO zu optimieren?',
        ctaDesc: 'Erstellen Sie ein kostenloses Konto und verbinden Sie Ihre Websites.',
        ctaBtn: 'Kostenloses Konto erstellen',
        copySkill: 'Skill kopieren',
        copied: 'Kopiert!',
        copyPrompt: 'Kopieren',
        learnMore: 'Mehr über MCP-Setup erfahren',
    },
    fr: {
        title: 'Transformez Claude en votre expert SEO',
        subtitle: 'Ajoutez ce skill à Claude et connectez vos données SEO Agent. Obtenez des analyses SEO professionnelles, des recherches de mots-clés et une optimisation de contenu — alimentées par les données réelles de votre site.',
        step1Title: 'Étape 1 : Copier le skill Expert SEO',
        step1Desc: 'Ajoutez-le comme Project Instructions dans Claude.ai ou comme Custom Instructions dans Claude Desktop.',
        step2Title: 'Étape 2 : Connecter SEO Agent MCP',
        step2Desc: 'Ajoutez cette URL dans Claude Desktop, Cursor ou tout client AI compatible MCP.',
        step2Note: 'Claude ouvrira votre navigateur pour approuver la connexion. Aucun token nécessaire.',
        mcpName: 'Nom du serveur MCP',
        mcpUrl: 'URL du serveur MCP',
        examplesTitle: 'Exemples de prompts à essayer',
        examplesDesc: 'Une fois configuré, essayez ces prompts pour voir votre expert SEO en action :',
        howItWorksTitle: 'Comment ça marche',
        howStep1: 'Vous ajoutez le prompt du skill à Claude — cela lui donne une expertise SEO approfondie',
        howStep2: 'Vous connectez le serveur MCP — cela donne à Claude accès à vos données réelles',
        howStep3: 'Claude devient votre consultant SEO personnel avec des données en direct de vos sites',
        ctaTitle: 'Prêt à booster votre SEO ?',
        ctaDesc: 'Créez un compte gratuit et connectez vos sites web pour commencer.',
        ctaBtn: 'Créer un compte gratuit',
        copySkill: 'Copier le skill',
        copied: 'Copié !',
        copyPrompt: 'Copier',
        learnMore: 'En savoir plus sur la configuration MCP',
    },
};

export default function SeoExpertSkillPage() {
    const { locale } = useLanguage();
    const lang = (locale && locale in TEXTS ? locale : 'en') as keyof typeof TEXTS;
    const t = TEXTS[lang];
    const examples = EXAMPLE_PROMPTS[lang];
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seo-agent.net';
    const mcpUrl = `${appUrl}/api/mcp`;

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedItem(id);
        toast.success(t.copied);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const CopyBtn = ({ text, id, label }: { text: string; id: string; label?: string }) => (
        <button onClick={() => copyText(text, id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors">
            {copiedItem === id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-neutral-500" />}
            {copiedItem === id ? t.copied : (label || t.copyPrompt)}
        </button>
    );

    return (
        <>
            <Head>
                <title>{t.title} — SEO AI Agent</title>
                <meta name="description" content={t.subtitle} />
                <link rel="canonical" href="https://seo-agent.net/seo-expert-skill" />
            </Head>

            <div className="min-h-screen bg-white">
                <LandingHeader />

                {/* Hero */}
                <section className="pt-24 pb-16 bg-gradient-to-b from-blue-50 via-white to-white">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                            <Sparkles className="h-4 w-4" />
                            Claude + SEO Agent
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">{t.title}</h1>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">{t.subtitle}</p>
                    </div>
                </section>

                <main className="max-w-4xl mx-auto px-4 pb-20">

                    {/* How It Works */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-neutral-900 mb-8 text-center">{t.howItWorksTitle}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-neutral-50 rounded-xl">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Bot className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-sm font-bold text-blue-600 mb-2">1</div>
                                <p className="text-sm text-neutral-600">{t.howStep1}</p>
                            </div>
                            <div className="text-center p-6 bg-neutral-50 rounded-xl">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="text-sm font-bold text-green-600 mb-2">2</div>
                                <p className="text-sm text-neutral-600">{t.howStep2}</p>
                            </div>
                            <div className="text-center p-6 bg-neutral-50 rounded-xl">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="text-sm font-bold text-purple-600 mb-2">3</div>
                                <p className="text-sm text-neutral-600">{t.howStep3}</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Copy Skill */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <h2 className="text-xl font-bold text-neutral-900">{t.step1Title}</h2>
                        </div>
                        <p className="text-neutral-600 mb-4">{t.step1Desc}</p>
                        <div className="relative bg-neutral-900 rounded-xl p-5 overflow-hidden">
                            <div className="absolute top-3 right-3">
                                <CopyBtn text={SEO_SKILL_PROMPT} id="skill" label={t.copySkill} />
                            </div>
                            <pre className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-24 font-mono">{SEO_SKILL_PROMPT}</pre>
                        </div>
                    </div>

                    {/* Step 2: Connect MCP */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <h2 className="text-xl font-bold text-neutral-900">{t.step2Title}</h2>
                        </div>
                        <p className="text-neutral-600 mb-4">{t.step2Desc}</p>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t.mcpName}</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-white rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-900">SEO AI Agent</div>
                                    <CopyBtn text="SEO AI Agent" id="name" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t.mcpUrl}</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-white rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-mono text-neutral-900 truncate">{mcpUrl}</div>
                                    <CopyBtn text={mcpUrl} id="url" />
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500">{t.step2Note}</p>
                            <Link href="/mcp-seo" className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline font-medium">
                                {t.learnMore} <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Example Prompts */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2 text-center">{t.examplesTitle}</h2>
                        <p className="text-neutral-600 text-center mb-8">{t.examplesDesc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {examples.map((ex, i) => (
                                <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="font-semibold text-neutral-900">{ex.title}</h3>
                                        <button onClick={() => copyText(ex.prompt, `prompt-${i}`)} className="flex-shrink-0 p-1.5 hover:bg-neutral-100 rounded transition-colors" title={t.copyPrompt}>
                                            {copiedItem === `prompt-${i}` ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-neutral-400" />}
                                        </button>
                                    </div>
                                    <p className="text-sm text-neutral-600 leading-relaxed">{ex.prompt}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center p-10 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                        <h2 className="text-2xl font-bold text-neutral-900 mb-3">{t.ctaTitle}</h2>
                        <p className="text-neutral-600 mb-6">{t.ctaDesc}</p>
                        <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            {t.ctaBtn} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
