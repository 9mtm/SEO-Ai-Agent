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
                    name: 'All Keywords',
                    description: 'List all tracked keywords across all domains',
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
                    description: 'Add a new keyword to track',
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
