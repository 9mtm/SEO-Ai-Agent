# Changelog

All notable changes to the SEO Agent MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-16

### Added
- **Tool: `get_gsc_insight`**: Comprehensive Google Search Console Insight data
  - 4 data views: Stats (overview), Keywords, Countries (geographic breakdown), Pages
  - 30-day historical data with performance trends
  - Top 5 performers in each category
  - Detailed metrics: visits, impressions, positions, CTR
  - Daily stats with trend analysis
  - Formatted summary + full JSON data
- **Tool: `get_gsc_keywords`**: Detailed GSC keywords with advanced filtering
  - Filter by device (desktop/mobile/tablet)
  - Filter by country code
  - Summary statistics (total keywords, clicks, impressions, avg position, avg CTR)
  - Device breakdown (desktop/mobile/tablet counts)
  - Country distribution with keyword counts
  - Top 10 rankings with full metrics
  - Formatted summary + complete keyword list
- **API Endpoint**: `/api/mcp/insight` - Backend for get_gsc_insight tool
- **API Endpoint**: `/api/mcp/sc-keywords` - Backend for get_gsc_keywords tool

### Changed
- Updated verify-tools.js to include new tools validation
- Enhanced MCP server with comprehensive GSC data access

### Technical Details
- Both tools use OAuth 2.0 for Google Search Console authentication
- Real-time data fetching (no caching)
- Data aggregation and grouping by device, country, keyword
- Compatible with existing GSC integration

## [1.1.0] - 2026-01-16

### Added
- **Competitor Analysis**: New feature to track and compare competitor rankings
- **Tool: `get_keyword_rankings`**: Comprehensive keyword rankings with competitor data
  - Shows your Google positions alongside competitor positions
  - Automatic comparison (ahead/behind calculation)
  - Historical ranking data with changes
  - Filtering by domain
- **API Enhancement**: Added `competitor_positions` field to keywords endpoint
- **API Enhancement**: Added `updating_competitors` status field
- **Documentation**: Added PUBLISHING.md with NPM publishing guide
- **Documentation**: Added RESTART_INSTRUCTIONS.md for Claude Desktop setup
- **Testing**: Added verify-tools.js script for tool verification

### Changed
- Updated `/api/mcp/keywords` to support both domain name and domain ID
- Enhanced keyword data parsing with safe JSON handling
- Improved error handling for malformed data
- Updated README with competitor analysis examples
- Expanded keywords in package.json for better discoverability

### Fixed
- Fixed URL field parsing (supports both string and JSON formats)
- Fixed history data parsing with error handling
- Fixed tags array parsing
- Fixed domain filtering to support legacy data format

## [1.0.2] - 2026-01-15

### Added
- Initial MCP server implementation
- **Resources**: domains, keywords, posts, gsc
- **Tools**: create_post, add_keyword, get_domain_stats, get_gsc_data
- **Prompts**: seo_article for content generation

### Features
- Google Search Console integration
- OAuth 2.0 support for GSC data
- Multi-tenant architecture with user isolation
- API key authentication with granular permissions
- Keyword tracking with position history
- Blog post management
- Domain statistics

### Security
- Encrypted API keys in database
- Request authentication
- Permission-based access control
- User data isolation

## [1.0.0] - 2026-01-14

### Added
- Initial release of SEO Agent MCP Server
- Basic MCP protocol implementation
- Connection to SEO AI Agent backend

---

## Upcoming Features

### [1.2.0] - Planned
- Bulk keyword operations
- Advanced filtering and sorting
- Export functionality (CSV, JSON)
- Webhook support for ranking changes
- Custom competitor groups

### [1.3.0] - Planned
- Historical data visualization
- Ranking trend analysis
- Automated reporting
- Email notifications

---

## Support

For issues and feature requests, please visit:
- GitHub: https://github.com/dpro-gmbh/seo-agent-mcp-server/issues
- Email: info@dpro.gmbh
- Website: https://seo-agent.net
