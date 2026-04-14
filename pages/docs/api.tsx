import Head from 'next/head';
import Link from 'next/link';
import { Book, Key, Shield } from 'lucide-react';
import LandingHeader from '../../components/common/LandingHeader';
import Footer from '../../components/common/Footer';
import DocsSidebar from '../../components/docs/DocsSidebar';
import EndpointBlock from '../../components/docs/EndpointBlock';

const BASE = 'https://seo-agent.net/api';
const H = `Authorization: Bearer YOUR_API_KEY`;

const curl = (method: string, path: string, body?: string) =>
    `curl -X ${method} "${BASE}${path}" \\\n  -H "${H}"${body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'` : ''}`;
const js = (method: string, path: string, body?: string) =>
    `const res = await fetch('${BASE}${path}', {\n  method: '${method}',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY'${body ? `,\n    'Content-Type': 'application/json'` : ''}\n  }${body ? `,\n  body: JSON.stringify(${body})` : ''}\n});\nconst data = await res.json();`;
const py = (method: string, path: string, body?: string) =>
    `import requests\n\nres = requests.${method.toLowerCase()}(\n    '${BASE}${path}',\n    headers={'Authorization': 'Bearer YOUR_API_KEY'}${body ? `,\n    json=${body.replace(/"/g, "'")}` : ''}\n)\ndata = res.json()`;
const ex = (m: string, p: string, b?: string) => [{ label: 'cURL', code: curl(m, p, b) }, { label: 'JavaScript', code: js(m, p, b) }, { label: 'Python', code: py(m, p, b) }];

const SECTIONS = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'authentication', title: 'Authentication' },
    { id: 'domains', title: 'Domains', items: [
        { id: 'list-domains', title: 'List Domains', method: 'GET' },
        { id: 'add-domain', title: 'Add Domain', method: 'POST' },
        { id: 'delete-domain', title: 'Delete Domain', method: 'DELETE' },
    ]},
    { id: 'keywords', title: 'Keywords', items: [
        { id: 'list-keywords', title: 'List Keywords', method: 'GET' },
        { id: 'add-keyword', title: 'Add Keyword', method: 'POST' },
    ]},
    { id: 'insights', title: 'Search Console & Insights', items: [
        { id: 'gsc-sites', title: 'List GSC Sites', method: 'GET' },
        { id: 'domain-insight', title: 'Domain Insight', method: 'GET' },
        { id: 'domain-keywords', title: 'Domain Keywords', method: 'GET' },
        { id: 'seo-overview', title: 'SEO Overview', method: 'GET' },
        { id: 'keyword-opportunities', title: 'Keyword Opportunities', method: 'GET' },
    ]},
    { id: 'competitors', title: 'Competitors', items: [
        { id: 'list-competitors', title: 'List Competitors', method: 'GET' },
        { id: 'update-competitors', title: 'Update Competitors', method: 'PUT' },
    ]},
    { id: 'seo-analysis', title: 'SEO Analysis', items: [
        { id: 'analyze-seo', title: 'Analyze Content', method: 'POST' },
    ]},
    { id: 'posts', title: 'Posts', items: [
        { id: 'list-posts', title: 'List Posts', method: 'GET' },
        { id: 'save-post', title: 'Create/Update Post', method: 'POST' },
        { id: 'delete-post', title: 'Delete Post', method: 'DELETE' },
    ]},
    { id: 'mcp', title: 'MCP Integration' },
    { id: 'errors', title: 'Error Codes' },
];

export default function ApiDocsPage() {
    return (
        <>
            <Head>
                <title>API Documentation — SEO AI Agent</title>
                <meta name="description" content="Complete API reference for SEO AI Agent. Manage domains, keywords, SEO analysis, and content programmatically." />
                <link rel="canonical" href="https://seo-agent.net/docs/api" />
            </Head>

            <div className="min-h-screen bg-white">
                <LandingHeader />

                <div className="max-w-7xl mx-auto px-4 pt-24 pb-20">
                    <div className="flex gap-8">
                        <DocsSidebar sections={SECTIONS} />

                        <div className="flex-1 min-w-0 max-w-4xl">
                            {/* Introduction */}
                            <section id="introduction" className="scroll-mt-24 mb-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <Book className="h-8 w-8 text-blue-600" />
                                    <h1 className="text-3xl font-bold text-neutral-900">API Documentation</h1>
                                </div>
                                <p className="text-neutral-600 mb-4">
                                    The SEO AI Agent API lets you programmatically manage domains, track keywords, analyze SEO performance, and generate optimized content. All endpoints return JSON.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-neutral-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-sm text-neutral-900 mb-1">Base URL</h4>
                                        <code className="text-sm text-blue-700 font-mono">https://seo-agent.net/api</code>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-sm text-neutral-900 mb-1">Rate Limit</h4>
                                        <span className="text-sm text-neutral-600">100 requests / minute</span>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-sm text-neutral-900 mb-1">Format</h4>
                                        <span className="text-sm text-neutral-600">JSON (UTF-8)</span>
                                    </div>
                                </div>
                            </section>

                            {/* Authentication */}
                            <section id="authentication" className="scroll-mt-24 mb-12 pb-10 border-b">
                                <div className="flex items-center gap-3 mb-4">
                                    <Key className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-2xl font-bold text-neutral-900">Authentication</h2>
                                </div>
                                <p className="text-neutral-600 mb-4">
                                    All API requests require authentication via Bearer token. Include your API key in the <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Authorization</code> header.
                                </p>
                                <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                                    <code className="text-sm text-green-400 font-mono">Authorization: Bearer YOUR_API_KEY</code>
                                </div>
                                <p className="text-sm text-neutral-600 mb-4">
                                    Get your API key from <Link href="/profile/oauth-apps" className="text-blue-600 hover:underline font-medium">Profile → Connected Apps</Link>. The API also supports OAuth 2.0 for MCP clients.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <strong>Keep your API key secret.</strong> Do not share it in client-side code, public repositories, or URLs. If compromised, regenerate it immediately from your profile settings.
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Domains */}
                            <section id="domains" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Domains</h2>

                                <EndpointBlock id="list-domains" method="GET" path="/domains" title="List Domains"
                                    description="Returns all domains in your active workspace with optional statistics."
                                    params={[{ name: 'withstats', type: 'boolean', description: 'Include keyword count and analytics' }]}
                                    responseExample={`{\n  "domains": [\n    {\n      "ID": 1,\n      "domain": "example.com",\n      "slug": "example_com",\n      "niche": "Technology",\n      "keywordCount": 25,\n      "workspace_id": 1\n    }\n  ]\n}`}
                                    codeExamples={ex('GET', '/domains?withstats=true')}
                                />

                                <EndpointBlock id="add-domain" method="POST" path="/domains" title="Add Domain"
                                    description="Add one or more domains to your workspace."
                                    params={[{ name: 'domains', type: 'string[]', required: true, description: 'Array of domain names to add' }]}
                                    responseExample={`{\n  "domains": [\n    { "ID": 2, "domain": "newsite.com", "slug": "newsite_com" }\n  ]\n}`}
                                    codeExamples={ex('POST', '/domains', '{"domains": ["newsite.com"]}')}
                                />

                                <EndpointBlock id="delete-domain" method="DELETE" path="/domains?id={id}" title="Delete Domain"
                                    description="Permanently delete a domain and all its tracked keywords, posts, and analytics data."
                                    params={[{ name: 'id', type: 'integer', required: true, description: 'Domain ID' }]}
                                    responseExample={`{ "success": true }`}
                                    codeExamples={ex('DELETE', '/domains?id=2')}
                                />
                            </section>

                            {/* Keywords */}
                            <section id="keywords" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Keywords</h2>

                                <EndpointBlock id="list-keywords" method="GET" path="/keywords?domain={slug}" title="List Tracked Keywords"
                                    description="Returns all tracked keywords for a domain with position history."
                                    params={[{ name: 'domain', type: 'string', required: true, description: 'Domain slug (e.g. example_com)' }]}
                                    responseExample={`{\n  "keywords": [\n    {\n      "ID": 1,\n      "keyword": "seo tools",\n      "position": 12,\n      "country": "US",\n      "device": "desktop",\n      "url": "https://example.com/tools",\n      "lastUpdated": "2026-04-14T10:00:00Z"\n    }\n  ]\n}`}
                                    codeExamples={ex('GET', '/keywords?domain=example_com')}
                                />

                                <EndpointBlock id="add-keyword" method="POST" path="/keywords" title="Add Keyword"
                                    description="Add a keyword to track for a specific domain."
                                    params={[
                                        { name: 'keyword', type: 'string', required: true, description: 'Keyword to track' },
                                        { name: 'domain', type: 'string', required: true, description: 'Domain name' },
                                        { name: 'country', type: 'string', description: 'Country code (default: US)' },
                                        { name: 'device', type: 'string', description: 'desktop or mobile (default: desktop)' },
                                    ]}
                                    responseExample={`{ "keyword": { "ID": 5, "keyword": "best seo tool", "position": 0 } }`}
                                    codeExamples={ex('POST', '/keywords', '{"keyword": "best seo tool", "domain": "example.com", "country": "US"}')}
                                />
                            </section>

                            {/* Insights */}
                            <section id="insights" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Search Console & Insights</h2>

                                <EndpointBlock id="gsc-sites" method="GET" path="/gsc/sites" title="List GSC Sites"
                                    description="Returns all verified sites from the user's connected Google Search Console account."
                                    responseExample={`{\n  "sites": [\n    { "siteUrl": "https://example.com/", "permissionLevel": "siteOwner" },\n    { "siteUrl": "sc-domain:example.com", "permissionLevel": "siteOwner" }\n  ]\n}`}
                                    codeExamples={ex('GET', '/gsc/sites')}
                                />

                                <EndpointBlock id="domain-insight" method="GET" path="/domain-insight?domain={slug}" title="Domain Insight"
                                    description="Get Search Console analytics: top keywords, pages, countries, and aggregate stats (clicks, impressions, CTR, position)."
                                    params={[
                                        { name: 'domain', type: 'string', required: true, description: 'Domain slug' },
                                        { name: 'days', type: 'integer', description: 'Date range in days (default: 30)' },
                                    ]}
                                    responseExample={`{\n  "stats": { "clicks": 1250, "impressions": 45000, "ctr": 2.78, "position": 18.5 },\n  "keywords": [...],\n  "pages": [...],\n  "countries": [...]\n}`}
                                    codeExamples={ex('GET', '/domain-insight?domain=example_com&days=30')}
                                />

                                <EndpointBlock id="domain-keywords" method="GET" path="/domain-keywords?domain={slug}" title="Domain Keywords (GSC)"
                                    description="Get all Search Console keyword data for a domain."
                                    params={[{ name: 'domain', type: 'string', required: true, description: 'Domain slug' }]}
                                    codeExamples={ex('GET', '/domain-keywords?domain=example_com')}
                                />

                                <EndpointBlock id="seo-overview" method="GET" path="/seo-overview?domain={slug}" title="SEO Overview"
                                    description="SEO health overview with period-over-period comparison."
                                    params={[
                                        { name: 'domain', type: 'string', required: true, description: 'Domain slug' },
                                        { name: 'days', type: 'integer', description: 'Date range (default: 30)' },
                                    ]}
                                    codeExamples={ex('GET', '/seo-overview?domain=example_com')}
                                />

                                <EndpointBlock id="keyword-opportunities" method="GET" path="/keyword-opportunities?domain={slug}" title="Keyword Opportunities"
                                    description="Find quick-win keywords: striking distance (positions 5-20), low CTR, rising trends, and zero-click opportunities."
                                    params={[
                                        { name: 'domain', type: 'string', required: true, description: 'Domain slug' },
                                        { name: 'days', type: 'integer', description: 'Date range (default: 30)' },
                                        { name: 'limit', type: 'integer', description: 'Max results (default: 20)' },
                                    ]}
                                    codeExamples={ex('GET', '/keyword-opportunities?domain=example_com&limit=20')}
                                />
                            </section>

                            {/* Competitors */}
                            <section id="competitors" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Competitors</h2>

                                <EndpointBlock id="list-competitors" method="GET" path="/competitors?domain={slug}" title="List Competitors"
                                    description="Get the list of competitor domains configured for a domain."
                                    params={[{ name: 'domain', type: 'string', required: true, description: 'Domain slug' }]}
                                    codeExamples={ex('GET', '/competitors?domain=example_com')}
                                />

                                <EndpointBlock id="update-competitors" method="PUT" path="/competitors" title="Update Competitors"
                                    description="Replace the competitor list for a domain."
                                    params={[
                                        { name: 'domain', type: 'string', required: true, description: 'Domain slug' },
                                        { name: 'competitors', type: 'string[]', required: true, description: 'Array of competitor domain names' },
                                    ]}
                                    codeExamples={ex('PUT', '/competitors', '{"domain": "example_com", "competitors": ["competitor1.com", "competitor2.com"]}')}
                                />
                            </section>

                            {/* SEO Analysis */}
                            <section id="seo-analysis" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">SEO Analysis</h2>

                                <EndpointBlock id="analyze-seo" method="POST" path="/seo/analyze" title="Analyze Content"
                                    description="Run 20+ SEO checks on content and get a score from 0-100 with detailed suggestions."
                                    params={[
                                        { name: 'title', type: 'string', required: true, description: 'Page title' },
                                        { name: 'content', type: 'string', required: true, description: 'HTML content body' },
                                        { name: 'meta_description', type: 'string', description: 'Meta description' },
                                        { name: 'slug', type: 'string', description: 'URL slug' },
                                        { name: 'focus_keywords', type: 'string[]', description: 'Target keywords' },
                                    ]}
                                    responseExample={`{\n  "score": 78,\n  "checks": [\n    { "name": "Title Length", "pass": true, "message": "Title is 55 characters (recommended: 30-70)" },\n    { "name": "Meta Description", "pass": false, "message": "Missing meta description" }\n  ],\n  "suggestions": ["Add a meta description (150-160 chars)", "Add more internal links"]\n}`}
                                    codeExamples={ex('POST', '/seo/analyze', '{"title": "Best SEO Tools 2026", "content": "<h1>Best SEO Tools</h1><p>...</p>", "focus_keywords": ["seo tools"]}')}
                                />
                            </section>

                            {/* Posts */}
                            <section id="posts" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Posts</h2>

                                <EndpointBlock id="list-posts" method="GET" path="/posts?domain={slug}" title="List Posts"
                                    description="Get all posts for a domain."
                                    params={[{ name: 'domain', type: 'string', required: true, description: 'Domain slug' }]}
                                    codeExamples={ex('GET', '/posts?domain=example_com')}
                                />

                                <EndpointBlock id="save-post" method="POST" path="/posts" title="Create or Update Post"
                                    description="Create a new post or update an existing one. Automatically runs SEO analysis and calculates score."
                                    params={[
                                        { name: 'domain', type: 'string', required: true, description: 'Domain name' },
                                        { name: 'title', type: 'string', required: true, description: 'Post title' },
                                        { name: 'content', type: 'string', required: true, description: 'HTML content' },
                                        { name: 'id', type: 'integer', description: 'Post ID (for updates)' },
                                        { name: 'slug', type: 'string', description: 'URL slug (auto-generated if empty)' },
                                        { name: 'status', type: 'string', description: 'draft or published (default: draft)' },
                                        { name: 'focus_keywords', type: 'string[]', description: 'Target keywords for SEO scoring' },
                                    ]}
                                    codeExamples={ex('POST', '/posts', '{"domain": "example.com", "title": "My Article", "content": "<p>Content here</p>", "status": "draft"}')}
                                />

                                <EndpointBlock id="delete-post" method="DELETE" path="/posts?id={id}" title="Delete Post"
                                    description="Permanently delete a post."
                                    params={[{ name: 'id', type: 'integer', required: true, description: 'Post ID' }]}
                                    codeExamples={ex('DELETE', '/posts?id=5')}
                                />
                            </section>

                            {/* MCP */}
                            <section id="mcp" className="scroll-mt-24 mb-12 pb-10 border-b">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-4">MCP Integration</h2>
                                <p className="text-neutral-600 mb-4">
                                    SEO Agent provides a <strong>Model Context Protocol (MCP)</strong> endpoint for AI assistants like Claude, Cursor, and ChatGPT. The MCP server exposes 19 tools that AI can use to analyze your websites.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <div className="font-semibold text-sm text-blue-900 mb-2">MCP Endpoint</div>
                                    <code className="text-sm font-mono text-blue-700">POST https://seo-agent.net/api/mcp</code>
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-3">Available Tools (19)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                    {[
                                        ['get_profile', 'Get authenticated user profile'],
                                        ['get_current_workspace', 'Get active workspace info'],
                                        ['list_domains', 'List all domains'],
                                        ['get_domain_insight', 'Domain analytics & stats'],
                                        ['get_domain_keywords', 'Search Console keywords'],
                                        ['get_domain_seo_overview', 'SEO health overview'],
                                        ['list_tracked_keywords', 'List tracked keywords'],
                                        ['add_tracked_keyword', 'Add keyword to tracking'],
                                        ['find_keyword_opportunities', 'Quick-win keywords'],
                                        ['list_domain_competitors', 'List competitors'],
                                        ['update_domain_competitors', 'Update competitor list'],
                                        ['get_keyword_competitors', 'Competitor rankings'],
                                        ['get_competitor_history', 'Competitor rank history'],
                                        ['generate_content_brief', 'SEO content brief'],
                                        ['analyze_seo', 'Content SEO analysis'],
                                        ['list_posts', 'List domain posts'],
                                        ['get_post', 'Get single post'],
                                        ['save_post', 'Create/update post'],
                                        ['delete_post', 'Delete post'],
                                    ].map(([name, desc]) => (
                                        <div key={name} className="flex items-start gap-2 text-sm p-2 bg-neutral-50 rounded">
                                            <code className="text-blue-700 font-mono text-xs flex-shrink-0">{name}</code>
                                            <span className="text-neutral-500">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-neutral-600">
                                    For setup instructions, see the <Link href="/mcp-seo" className="text-blue-600 hover:underline font-medium">MCP Integration Guide</Link> or the <Link href="/seo-expert-skill" className="text-blue-600 hover:underline font-medium">SEO Expert Skill</Link> page.
                                </p>
                            </section>

                            {/* Error Codes */}
                            <section id="errors" className="scroll-mt-24 mb-12">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Error Codes</h2>
                                <p className="text-neutral-600 mb-4">All errors return a JSON object with an <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">error</code> field.</p>
                                <div className="bg-neutral-900 rounded-lg p-4 mb-6">
                                    <pre className="text-sm text-neutral-300 font-mono">{`{ "error": "Unauthorized" }`}</pre>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Code</th>
                                                <th className="px-4 py-3 text-left font-medium text-neutral-600">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {[
                                                ['200', 'OK — Request succeeded'],
                                                ['201', 'Created — Resource created successfully'],
                                                ['400', 'Bad Request — Invalid parameters or missing required fields'],
                                                ['401', 'Unauthorized — Missing or invalid API key'],
                                                ['403', 'Forbidden — Insufficient permissions (plan limit or role)'],
                                                ['404', 'Not Found — Resource does not exist'],
                                                ['405', 'Method Not Allowed — Wrong HTTP method'],
                                                ['422', 'Validation Error — Input failed validation'],
                                                ['429', 'Rate Limited — Too many requests (wait and retry)'],
                                                ['500', 'Internal Error — Server error (contact support)'],
                                            ].map(([code, desc], i) => (
                                                <tr key={code} className={i % 2 === 1 ? 'bg-neutral-50' : ''}>
                                                    <td className="px-4 py-2.5 font-mono font-bold text-neutral-900">{code}</td>
                                                    <td className="px-4 py-2.5 text-neutral-600">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </>
    );
}
