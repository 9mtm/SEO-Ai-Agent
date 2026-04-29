# Auto-Blog: Weekly SEO Article Generation by Claude

Every week, **Claude** writes 2 SEO articles for the blog and publishes them via the SEO Agent MCP. No third-party LLM. No server-side cron generating content. Just Claude on a schedule, calling the MCP tools we already built.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Anthropic schedule (routine, weekly cron)                 │
│  Prompt: "Use SEO Agent MCP to write 2 articles…"         │
└────────────────────┬───────────────────────────────────────┘
                     │ runs once a week
                     ▼
┌────────────────────────────────────────────────────────────┐
│  Claude (remote agent run)                                 │
│                                                            │
│  1. tools/call get_pending_blog_topics  → 2 topics        │
│  2. for each topic:                                        │
│       a. write 700-1000 word HTML article (EN)            │
│       b. translate to DE / FR / AR                        │
│       c. tools/call generate_blog_image  → image URL      │
│       d. tools/call create_blog_post(translations[])      │
│       e. tools/call mark_blog_topic_used(topic_id, post_id)│
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
       ┌─────────────┴──────────────┐
       │                            │
   /blog (live)            data/blog-topic-bank.json
   blog_posts table        (status: pending → used)
   blog_post_translations  /blog-images/<slug>.png
```

## MCP tools used

| Tool | Purpose |
|---|---|
| `get_pending_blog_topics` | Read N pending topics from `data/blog-topic-bank.json` |
| `generate_blog_image` | Pillow → 1200×630 branded banner |
| `create_blog_post` | Insert post + translations[] in one call |
| `mark_blog_topic_used` | Flip topic status to `used` (or `failed`) |

All four require the `ADMIN_MCP_TOKEN` (super_admin auth).

## Topic Bank — `data/blog-topic-bank.json`

Curated queue. Each topic:
```json
{ "id": 1, "status": "pending", "category": "SEO Strategies",
  "title": "How Topical Authority Beats Keyword Stuffing in 2026",
  "focus_keyword": "topical authority", "tag": "STRATEGY", "palette": "indigo" }
```

- `status` → `pending` | `used` | `failed`
- After publish: gains `used_at` + `post_id`
- After failure: gains `failed_at` + `error`
- Reset to `pending` to retry

**Categories** (matches admin UI): SEO Strategies · AI & Search · Keyword Research · Content Marketing · Technical SEO · Case Studies · Product Updates · Industry News

**Palettes**: `indigo` · `navy` · `forest` · `wine` · `carbon` · `teal` · `overlay`

## The schedule prompt

The schedule runs this prompt against the SEO Agent MCP:

```
You are Claude with the SEO Agent MCP connected. It is the weekly auto-blog run.

Task: publish 2 fresh, expert-level SEO articles to seo-agent.net/blog.

Steps:
1. Call `get_pending_blog_topics` with limit=2.
2. For each returned topic:
   a. Write a 700-1000 word HTML article (h2/p/ul, no h1 — title is separate).
      Include the focus_keyword naturally, 4-6 H2 sections, concrete numbers
      and examples. Add ONE subtle internal link to /how-to-use or /mcp-seo
      where it fits. Avoid AI-tells and fluff.
   b. Write a 150-160 char excerpt + ≤60 char meta_title + 150-160 char meta_description.
   c. Translate the title, content, excerpt, meta_title, meta_description into
      German, French, and Arabic. Preserve all HTML tags.
   d. Call `generate_blog_image` with the topic's title, tag, palette, and slug.
   e. Call `create_blog_post`:
        - status: 'published'
        - locale: 'en'
        - featured_image: <url from step d>
        - category: <topic category>
        - tags: 4-6 relevant lowercase hyphenated tags
        - translations: [ {locale:'de',...}, {locale:'fr',...}, {locale:'ar',...} ]
   f. Call `mark_blog_topic_used` with topic_id and post_id.
3. Report: which topics were published, the URLs, and any failures.
```

## Manual operations

```bash
# Inspect the bank
cat data/blog-topic-bank.json | jq '.topics[] | select(.status=="pending") | .id'

# Reset a failed topic
# (edit file: status "failed" → "pending", remove .error)

# Add a topic (next free id, status: pending)
# Edit data/blog-topic-bank.json directly; the schedule picks it up automatically.
```

## Required env

```bash
ADMIN_MCP_TOKEN=...           # MCP auth (already exists)
PYTHON_BIN=/opt/alt/python311/bin/python3.11   # for image generation
```

No LLM API keys needed — Claude is the writer.

## Refilling the topic bank

When `pending` count < 6, append more entries with the next free `id` and
`status: "pending"`. The schedule picks the first N pending each Monday.
