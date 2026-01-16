import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'https://seo-agent.net';
const API_KEY = process.env.SEO_API_KEY;

if (!API_KEY) {
    throw new Error('SEO_API_KEY environment variable is required');
}

// Helper function to make authenticated API requests
async function apiRequest(endpoint: string, options: any = {}) {
    try {
        const response = await axios({
            url: `${API_BASE_URL}${endpoint}`,
            ...options,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        return response.data;
    } catch (error: any) {
        console.error(`API request failed: ${error.message}`);
        throw new Error(`API request failed: ${error.response?.data?.error || error.message}`);
    }
}

export function createServer() {
    const server = new Server(
        {
            name: 'seo-agent',
            version: '1.0.0',
        },
        {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
            },
        }
    );

    // LIST RESOURCES
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: 'seo://domains',
                    name: 'All Domains',
                    description: 'List all your SEO domains',
                    mimeType: 'application/json',
                },
                {
                    uri: 'seo://keywords',
                    name: 'Tracked Keyword Rankings',
                    description: 'View all tracked keywords with their Google search rankings, positions, ranking history, position changes, search volume, countries, devices, and URLs. Shows both ranked and unranked keywords.',
                    mimeType: 'application/json',
                },
                {
                    uri: 'seo://posts',
                    name: 'All Posts',
                    description: 'List all blog posts',
                    mimeType: 'application/json',
                },
                {
                    uri: 'seo://gsc',
                    name: 'Google Search Console Data',
                    description: 'Access Google Search Console analytics data',
                    mimeType: 'application/json',
                },
            ],
        };
    });

    // READ RESOURCE
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;

        if (uri === 'seo://domains') {
            const data = await apiRequest('/api/mcp/domains');
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        }

        if (uri === 'seo://keywords') {
            const data = await apiRequest('/api/mcp/keywords');
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        }

        if (uri === 'seo://posts') {
            const data = await apiRequest('/api/mcp/posts');
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown resource: ${uri}`);
    });

    // LIST TOOLS
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'create_post',
                    description: 'Create a new blog post',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                            title: {
                                type: 'string',
                                description: 'Post title',
                            },
                            content: {
                                type: 'string',
                                description: 'Post content (HTML or Markdown)',
                            },
                            meta_description: {
                                type: 'string',
                                description: 'SEO meta description',
                            },
                            focus_keyword: {
                                type: 'string',
                                description: 'Primary focus keyword',
                            },
                        },
                        required: ['domain_id', 'title', 'content'],
                    },
                },
                {
                    name: 'add_keyword',
                    description: 'Start tracking a new keyword for Google Ranking in a specific location',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                            keyword: {
                                type: 'string',
                                description: 'Keyword to track',
                            },
                            location: {
                                type: 'string',
                                description: 'Target location (e.g., "United States")',
                            },
                        },
                        required: ['domain_id', 'keyword'],
                    },
                },
                {
                    name: 'get_domain_stats',
                    description: 'Get SEO statistics for a domain',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                        },
                        required: ['domain_id'],
                    },
                },
                {
                    name: 'get_gsc_data',
                    description: 'Get Google Search Console data for a domain',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                            start_date: {
                                type: 'string',
                                description: 'Start date (YYYY-MM-DD), defaults to 30 days ago',
                            },
                            end_date: {
                                type: 'string',
                                description: 'End date (YYYY-MM-DD), defaults to today',
                            },
                        },
                        required: ['domain_id'],
                    },
                },
                {
                    name: 'get_keyword_rankings',
                    description: 'Get keyword rankings with competitor analysis. Shows your Google rankings alongside competitor positions for each keyword. Compare your performance vs competitors, track ranking changes, and identify opportunities.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID (optional - if not provided, returns keywords for all domains)',
                            },
                        },
                        required: [],
                    },
                },
                {
                    name: 'get_gsc_insight',
                    description: 'Get comprehensive Google Search Console Insight data with 4 views: Stats (overview with charts), Keywords (performance by keyword), Countries (geographic breakdown), and Pages (performance by page). Includes 30-day historical data with trends, top performers, and detailed metrics (visits, impressions, positions, CTR).',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                        },
                        required: ['domain_id'],
                    },
                },
                {
                    name: 'get_gsc_keywords',
                    description: 'Get detailed Google Search Console keywords data with filtering options. Shows all keywords from GSC (last 30 days) with position, clicks, impressions, and CTR. Filter by device (desktop/mobile/tablet) and country. Includes summary statistics and aggregated metrics.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                            device: {
                                type: 'string',
                                description: 'Filter by device type: desktop, mobile, or tablet (optional)',
                            },
                            country: {
                                type: 'string',
                                description: 'Filter by country code (e.g., "usa", "deu") (optional)',
                            },
                        },
                        required: ['domain_id'],
                    },
                },
            ],
        };
    });

    // CALL TOOL
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        if (name === 'create_post') {
            const result = await apiRequest('/api/mcp/posts', {
                method: 'POST',
                data: args,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Post created successfully! ID: ${result.post?.id}`,
                    },
                ],
            };
        }

        if (name === 'add_keyword') {
            const result = await apiRequest('/api/mcp/keywords', {
                method: 'POST',
                data: args,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Keyword "${args?.keyword || 'unknown'}" added successfully!`,
                    },
                ],
            };
        }

        if (name === 'get_domain_stats') {
            const domainId = args?.domain_id || '';
            const result = await apiRequest(`/api/mcp/stats?domain_id=${domainId}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'get_gsc_data') {
            const domainId = args?.domain_id || '';
            const startDate = args?.start_date || '';
            const endDate = args?.end_date || '';

            let url = `/api/mcp/gsc?domain_id=${domainId}`;
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;

            const result = await apiRequest(url);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'get_keyword_rankings') {
            const domainId = args?.domain_id || '';
            let url = '/api/mcp/keywords';
            if (domainId) {
                url += `?domain_id=${domainId}`;
            }

            const result = await apiRequest(url);

            // Format the response in a more readable way
            const keywords = result.keywords || [];
            const total = result.total || 0;

            if (keywords.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No tracked keywords found.',
                        },
                    ],
                };
            }

            // Group keywords by position status
            const ranked = keywords.filter((k: any) => k.position > 0);
            const notRanked = keywords.filter((k: any) => k.position === 0);
            const withCompetitors = keywords.filter((k: any) => k.competitor_positions && Object.keys(k.competitor_positions).length > 0);

            let summary = `📊 Keyword Rankings Summary\n\n`;
            summary += `Total Keywords: ${total}\n`;
            summary += `Ranked in Google: ${ranked.length}\n`;
            summary += `Not yet ranked: ${notRanked.length}\n`;
            summary += `With competitor tracking: ${withCompetitors.length}\n\n`;

            if (ranked.length > 0) {
                summary += `🏆 Top Rankings:\n`;
                ranked
                    .sort((a: any, b: any) => a.position - b.position)
                    .slice(0, 10)
                    .forEach((kw: any) => {
                        const change = kw.positionChange > 0 ? `📈 +${kw.positionChange}` :
                                     kw.positionChange < 0 ? `📉 ${kw.positionChange}` : '';
                        summary += `  #${kw.position} - "${kw.keyword}" (${kw.country}, ${kw.device}) ${change}\n`;
                        if (kw.url && typeof kw.url === 'string') {
                            summary += `      URL: ${kw.url}\n`;
                        }
                        // Show competitor positions if available
                        if (kw.competitor_positions && Object.keys(kw.competitor_positions).length > 0) {
                            summary += `      Competitors: `;
                            const compList = Object.entries(kw.competitor_positions)
                                .map(([name, pos]: [string, any]) => `${name} (#${pos || 'N/A'})`)
                                .join(', ');
                            summary += `${compList}\n`;
                        }
                    });
            }

            // Show competitor analysis
            if (withCompetitors.length > 0) {
                summary += `\n🎯 Competitor Analysis:\n`;
                withCompetitors
                    .slice(0, 5)
                    .forEach((kw: any) => {
                        summary += `  "${kw.keyword}" - You: #${kw.position || 'N/A'}\n`;
                        if (kw.competitor_positions) {
                            Object.entries(kw.competitor_positions).forEach(([name, pos]: [string, any]) => {
                                const diff = kw.position > 0 && pos > 0 ?
                                    (pos - kw.position > 0 ? `(+${pos - kw.position} ahead)` : `(${pos - kw.position} behind)`) : '';
                                summary += `    - ${name}: #${pos || 'N/A'} ${diff}\n`;
                            });
                        }
                    });
            }

            summary += `\n📋 Full data available in JSON below.\n`;

            return {
                content: [
                    {
                        type: 'text',
                        text: summary,
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'get_gsc_insight') {
            const domainId = args?.domain_id || '';
            const result = await apiRequest(`/api/mcp/insight?domain_id=${domainId}`);

            if (result.error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${result.error}`,
                        },
                    ],
                };
            }

            const { insight, domain } = result;

            // Format summary
            let summary = `📊 Google Search Console Insight - ${domain?.domain || 'Unknown'}\n\n`;

            // Stats overview
            if (insight.stats && insight.stats.length > 0) {
                const totalStats = insight.stats.reduce((acc: any, stat: any) => ({
                    clicks: acc.clicks + stat.clicks,
                    impressions: acc.impressions + stat.impressions,
                    position: acc.position + stat.position,
                }), { clicks: 0, impressions: 0, position: 0 });

                const avgPosition = Math.round(totalStats.position / insight.stats.length);
                const ctr = totalStats.impressions > 0 ? ((totalStats.clicks / totalStats.impressions) * 100).toFixed(2) : 0;

                summary += `📈 30-Day Overview:\n`;
                summary += `  Visits: ${totalStats.clicks.toLocaleString()}\n`;
                summary += `  Impressions: ${totalStats.impressions.toLocaleString()}\n`;
                summary += `  Avg Position: ${avgPosition}\n`;
                summary += `  Avg CTR: ${ctr}%\n`;
                summary += `  Date Range: ${insight.stats.length} days\n\n`;
            }

            // Keywords stats
            if (insight.keywords && insight.keywords.length > 0) {
                summary += `🔑 Keywords: ${insight.keywords.length} unique keywords\n`;
                const topKeywords = insight.keywords
                    .sort((a: any, b: any) => b.clicks - a.clicks)
                    .slice(0, 5);
                summary += `  Top 5 by Visits:\n`;
                topKeywords.forEach((kw: any) => {
                    summary += `    "${kw.keyword}" - #${Math.round(kw.position)} (${kw.clicks} visits)\n`;
                });
                summary += `\n`;
            }

            // Countries stats
            if (insight.countries && insight.countries.length > 0) {
                summary += `🌍 Countries: ${insight.countries.length} countries\n`;
                const topCountries = insight.countries
                    .sort((a: any, b: any) => b.clicks - a.clicks)
                    .slice(0, 5);
                summary += `  Top 5 by Visits:\n`;
                topCountries.forEach((c: any) => {
                    summary += `    ${c.country} - ${c.clicks} visits (${c.keywords} keywords)\n`;
                });
                summary += `\n`;
            }

            // Pages stats
            if (insight.pages && insight.pages.length > 0) {
                summary += `📄 Pages: ${insight.pages.length} indexed pages\n`;
                const topPages = insight.pages
                    .sort((a: any, b: any) => b.clicks - a.clicks)
                    .slice(0, 5);
                summary += `  Top 5 by Visits:\n`;
                topPages.forEach((p: any) => {
                    const shortUrl = p.page.length > 60 ? p.page.substring(0, 60) + '...' : p.page;
                    summary += `    ${shortUrl} - ${p.clicks} visits\n`;
                });
                summary += `\n`;
            }

            summary += `📋 Full detailed data available in JSON below.\n`;

            return {
                content: [
                    {
                        type: 'text',
                        text: summary,
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'get_gsc_keywords') {
            const domainId = args?.domain_id || '';
            const device = args?.device || '';
            const country = args?.country || '';

            let url = `/api/mcp/sc-keywords?domain_id=${domainId}`;
            if (device) url += `&device=${device}`;
            if (country) url += `&country=${country}`;

            const result = await apiRequest(url);

            if (result.error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${result.error}`,
                        },
                    ],
                };
            }

            const { keywords, summary: stats, domain } = result;

            if (!keywords || keywords.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No keywords found for domain ${domain?.domain || 'Unknown'}`,
                        },
                    ],
                };
            }

            // Format summary
            let summary = `🔍 Google Search Console Keywords - ${domain?.domain || 'Unknown'}\n\n`;

            // Filters applied
            const filters = [];
            if (device) filters.push(`Device: ${device}`);
            if (country) filters.push(`Country: ${country}`);
            if (filters.length > 0) {
                summary += `📌 Filters: ${filters.join(', ')}\n\n`;
            }

            // Summary stats
            summary += `📊 Summary:\n`;
            summary += `  Total Keywords: ${stats.total}\n`;
            summary += `  Total Visits: ${stats.totalClicks.toLocaleString()}\n`;
            summary += `  Total Impressions: ${stats.totalImpressions.toLocaleString()}\n`;
            summary += `  Avg Position: ${stats.avgPosition}\n`;
            summary += `  Avg CTR: ${stats.avgCTR.toFixed(2)}%\n\n`;

            // Device breakdown
            if (!device) {
                summary += `📱 By Device:\n`;
                summary += `  Desktop: ${stats.byDevice.desktop}\n`;
                summary += `  Mobile: ${stats.byDevice.mobile}\n`;
                summary += `  Tablet: ${stats.byDevice.tablet}\n\n`;
            }

            // Country breakdown
            if (!country && Object.keys(stats.byCountry).length > 0) {
                summary += `🌍 Top Countries:\n`;
                const topCountries = Object.entries(stats.byCountry)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 5);
                topCountries.forEach(([c, count]) => {
                    summary += `  ${c}: ${count} keywords\n`;
                });
                summary += `\n`;
            }

            // Top keywords by position
            summary += `🏆 Top 10 Rankings:\n`;
            const topRanked = keywords
                .filter((k: any) => k.position > 0)
                .sort((a: any, b: any) => a.position - b.position)
                .slice(0, 10);

            topRanked.forEach((kw: any) => {
                summary += `  #${kw.position} - "${kw.keyword}" (${kw.device}, ${kw.country})\n`;
                summary += `      ${kw.clicks} visits, ${kw.impressions} impressions, ${kw.ctr.toFixed(2)}% CTR\n`;
            });

            summary += `\n📋 Full list of ${stats.total} keywords available in JSON below.\n`;

            return {
                content: [
                    {
                        type: 'text',
                        text: summary,
                    },
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    });

    // LIST PROMPTS
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return {
            prompts: [
                {
                    name: 'seo_article',
                    description: 'Generate an SEO-optimized article',
                    arguments: [
                        {
                            name: 'keyword',
                            description: 'Target keyword',
                            required: true,
                        },
                        {
                            name: 'tone',
                            description: 'Writing tone (professional, casual, friendly)',
                            required: false,
                        },
                    ],
                },
            ],
        };
    });

    // GET PROMPT
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        if (name === 'seo_article') {
            const keyword = args?.keyword || 'your topic';
            const tone = args?.tone || 'professional';

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Write a comprehensive, SEO-optimized article about "${keyword}". 

Requirements:
- Target keyword: "${keyword}"
- Tone: ${tone}
- Length: 1500-2000 words
- Include: Introduction, main sections with H2/H3 headings, conclusion
- SEO elements: Meta description, focus keyword usage, internal linking suggestions
- Format: Use Markdown

Please create an engaging, informative article that ranks well in search engines.`,
                        },
                    },
                ],
            };
        }

        throw new Error(`Unknown prompt: ${name}`);
    });

    // Start server
    const transport = new StdioServerTransport();
    server.connect(transport);

    console.error('SEO Agent MCP Server running on stdio');

    return server;
}
