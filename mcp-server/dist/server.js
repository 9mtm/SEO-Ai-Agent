import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
// Helper function to make authenticated API requests
async function apiRequest(endpoint, baseUrl, apiKey, options = {}) {
    try {
        const config = {
            url: `${baseUrl}${endpoint}`,
            method: options.method || 'GET',
            data: options.data,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };
        const response = await axios(config);
        return response.data;
    }
    catch (error) {
        console.error(`[MCP API] Request failed: ${error.message} (${endpoint})`);
        throw new Error(`API request failed: ${error.response?.data?.error || error.message}`);
    }
}
export function createMcpServer(baseUrl, apiKey) {
    const server = new Server({
        name: 'dpro-seo-agent',
        version: '1.0.0',
    }, {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
        },
    });
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
            const data = await apiRequest('/api/mcp/domains', baseUrl, apiKey);
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
            const data = await apiRequest('/api/mcp/keywords', baseUrl, apiKey);
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
            const data = await apiRequest('/api/mcp/posts', baseUrl, apiKey);
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
                    description: 'Get keyword rankings with competitor analysis.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID (optional)',
                            },
                        },
                        required: [],
                    },
                },
                {
                    name: 'get_gsc_insight',
                    description: 'Get comprehensive Google Search Console Insight data.',
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
                    description: 'Get detailed Google Search Console keywords data.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            domain_id: {
                                type: 'number',
                                description: 'Domain ID',
                            },
                            device: {
                                type: 'string',
                                description: 'Filter by device (optional)',
                            },
                            country: {
                                type: 'string',
                                description: 'Filter by country (optional)',
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
            const result = await apiRequest('/api/mcp/posts', baseUrl, apiKey, {
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
            const result = await apiRequest('/api/mcp/keywords', baseUrl, apiKey, {
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
            const result = await apiRequest(`/api/mcp/stats?domain_id=${domainId}`, baseUrl, apiKey);
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
            if (startDate)
                url += `&start_date=${startDate}`;
            if (endDate)
                url += `&end_date=${endDate}`;
            const result = await apiRequest(url, baseUrl, apiKey);
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
            if (domainId)
                url += `?domain_id=${domainId}`;
            const result = await apiRequest(url, baseUrl, apiKey);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        if (name === 'get_gsc_insight') {
            const domainId = args?.domain_id || '';
            const result = await apiRequest(`/api/mcp/insight?domain_id=${domainId}`, baseUrl, apiKey);
            return {
                content: [
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
            if (device)
                url += `&device=${device}`;
            if (country)
                url += `&country=${country}`;
            const result = await apiRequest(url, baseUrl, apiKey);
            return {
                content: [
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
                            description: 'Writing tone',
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
                            text: `Write a comprehensive, SEO-optimized article about "${keyword}". (Tone: ${tone})`,
                        },
                    },
                ],
            };
        }
        throw new Error(`Unknown prompt: ${name}`);
    });
    return server;
}
//# sourceMappingURL=server.js.map