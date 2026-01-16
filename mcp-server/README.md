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

## Usage Examples

Once configured, you can ask Claude:

### Domain Management
- "Show me all my domains"
- "Get stats for flowxtra.com domain"

### Keyword Rankings & Competitor Analysis
- "Show me my keyword rankings"
- "What's the position of 'Flowxtra Candidate Management' in Google?"
- "Which keywords improved in ranking?"
- "Compare my rankings with competitors"
- "Show me where competitors rank for 'AI Recruitment Software'"
- "Add keyword 'AI recruitment software' to track for flowxtra.com"

### Content Creation
- "Create a new blog post about AI recruitment trends"
- "Write an SEO article about applicant tracking systems"

### Analytics
- "Get Google Search Console data for the last 30 days"
- "Show me clicks and impressions from GSC"
- "What are my top performing pages?"

## Available Resources

- **`seo://domains`** - List all your SEO domains with settings and metadata
- **`seo://keywords`** - View tracked keyword rankings with your positions, competitor positions, ranking history, changes, and search volume
- **`seo://posts`** - List all blog posts with SEO metadata
- **`seo://gsc`** - Access Google Search Console analytics data

## Available Tools

### Content Management
- **`create_post`** - Create a new SEO-optimized blog post
  - Parameters: `domain_id`, `title`, `content`, `meta_description`, `focus_keyword`

### Keyword Tracking
- **`add_keyword`** - Start tracking a keyword for Google rankings
  - Parameters: `domain_id`, `keyword`, `location` (optional)

- **`get_keyword_rankings`** - Get keyword rankings with competitor analysis
  - Parameters: `domain_id` (optional - returns all keywords if not specified)
  - Shows: Your positions, competitor positions, ranking comparisons, history, changes, countries, devices, URLs
  - Competitor data: See where competitors rank for the same keywords and compare performance

### Analytics
- **`get_domain_stats`** - Get comprehensive SEO statistics for a domain
  - Parameters: `domain_id`
  - Returns: Total domains, keywords, posts, top rankings, improvements

- **`get_gsc_data`** - Fetch Google Search Console data
  - Parameters: `domain_id`, `start_date` (optional), `end_date` (optional)
  - Returns: Real-time GSC data including clicks, impressions, CTR, positions

## Available Prompts

- **`seo_article`** - Generate an SEO-optimized article with proper structure
  - Parameters: `keyword` (required), `tone` (optional: professional/casual/friendly)

### Local Development & Testing

To test the server locally without publishing to NPM:

1. Build the project:
   ```bash
   npm run build
   ```

2. Add to Claude Desktop config (`%APPDATA%/Claude/claude_desktop_config.json` on Windows):
   ```json
   {
     "mcpServers": {
       "seo-agent-local": {
         "command": "node",
         "args": [
           "C:\\path\\to\\your\\project\\mcp-server\\dist\\index.js"
         ],
         "env": {
           "SEO_API_KEY": "your_api_key_here",
           "API_BASE_URL": "http://localhost:3000"
         }
       }
     }
   }
   ```

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
