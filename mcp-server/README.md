# SEO Agent MCP Server

Connect Claude Desktop and other AI assistants to your SEO data through the Model Context Protocol (MCP).

## Features

- 📊 **Resources**: Access domains, keywords, and posts
- 🛠️ **Tools**: Create posts, add keywords, get stats
- 💬 **Prompts**: Generate SEO-optimized content

## Installation

```bash
npm install -g @seo-agent/mcp-server
```

## Configuration

### For Claude Desktop

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seo-agent": {
      "command": "npx",
      "args": ["-y", "@seo-agent/mcp-server"],
      "env": {
        "SEO_API_KEY": "your_api_key_here",
        "API_BASE_URL": "https://seo-agent.net"
      }
    }
  }
}
```

### Get Your API Key

1. Go to your SEO Agent dashboard
2. Navigate to **Profile → AI Connections**
3. Click **"Create Your First Connection"**
4. Set permissions and create the key
5. Copy the API key (shown only once!)

## Usage

Once configured, you can ask Claude:

- "Show me all my domains"
- "What are my top keywords?"
- "Create a new blog post about AI trends"
- "Add keyword 'SEO optimization' to my domain"
- "Get stats for domain ID 1"

## Available Resources

- `seo://domains` - List all domains
- `seo://keywords` - List all keywords
- `seo://posts` - List all posts

## Available Tools

- `create_post` - Create a new blog post
- `add_keyword` - Add a keyword to track
- `get_domain_stats` - Get domain statistics

## Available Prompts

- `seo_article` - Generate SEO-optimized article

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## Security

- API keys are encrypted in the database
- All requests require authentication
- Granular permissions control

## Support

For issues and questions, visit: https://github.com/your-repo/seo-agent

## License

MIT
