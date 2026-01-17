# AI Endpoint Development Request

## Endpoint Specification

**URL:** `POST /api/onboarding/analyze`

**Purpose:** Scrape and analyze a business website URL to extract:
1. Business name
2. Business description
3. Industry niche (1-2 words)
4. SEO focus keywords (9 keywords in 3 categories)
5. Real competitor domains (5 competitors)

---

## API Request Format

```json
{
  "website": "https://flowxtra.com"
}
```

---

## API Response Format

```json
{
  "success": true,
  "businessName": "Flowxtra",
  "description": "Flowxtra is a cutting-edge, all-in-one talent management platform designed to streamline your hiring process. With our innovative AI recruitment solution and unlimited free job postings, we help businesses of all sizes hire smarter and faster.",
  "niche": "Recruiting",
  "keywords": {
    "high": ["recruiting software", "ats platform", "applicant tracking system"],
    "medium": ["free recruiting software", "flowxtra recruiting", "recruiting platform"],
    "low": ["best recruiting tools", "recruiting for startups", "ats software reviews"]
  },
  "competitors": [
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "recruitee.com",
    "breezy.hr"
  ]
}
```

---

## Implementation Steps

### Step 1: Web Scraping (Python)

You mentioned you have a **Python Web Scraper** ready. Use it to extract:

```python
import requests
from bs4 import BeautifulSoup

def scrape_website(url):
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract data
        title = soup.find('title').get_text().strip() if soup.find('title') else ''

        # Get business name (usually first part before | or -)
        business_name = title.split('|')[0].split('-')[0].strip()

        # Get meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        description = meta_desc['content'].strip() if meta_desc and meta_desc.get('content') else ''

        # Get H1
        h1 = soup.find('h1').get_text().strip() if soup.find('h1') else ''

        # Combine for full context
        full_text = f"Title: {title}\nDescription: {description}\nH1: {h1}"

        return {
            'businessName': business_name,
            'description': description or h1 or title,
            'fullText': full_text
        }
    except Exception as e:
        return None
```

### Step 2: AI Analysis

After scraping, send the extracted data to your AI model.

## AI Prompt to Use

Use this exact prompt structure for the AI model:

```
You are an expert SEO strategist and market research analyst with deep knowledge of global industries and competitive landscapes.

Analyze the following business information extracted from their website:

**Business Name:** {businessName}
**Website Content:** {fullText}
**Description:** {description}

Your task is to provide:

1. **Niche**: Identify the primary industry category using standard global terminology (max 2 words)
   - Examples: "Recruiting", "E-commerce", "CRM", "Marketing", "Accounting", "HR Tech"
   - Must be a recognized industry category
   - Should be specific but not too narrow

2. **SEO Keywords**: Generate 9 highly relevant, searchable keywords categorized by priority:
   - **High Priority (3)**: Core commercial keywords with high business value
     - Should be short (2-4 words)
     - Must include the main category
     - Examples: "recruiting software", "ats platform", "applicant tracking"

   - **Medium Priority (3)**: Supporting keywords with brand combinations
     - Can include brand name + category
     - Include "free" variations if applicable
     - Examples: "free recruiting software", "flowxtra recruiting", "recruiting platform"

   - **Low Priority (3)**: Long-tail keywords for specific queries
     - More descriptive and specific
     - Include modifiers like "best", "top", "for [audience]"
     - Examples: "best recruiting tools", "recruiting for startups", "ats reviews"

3. **Competitors**: Identify 5 real, existing competitor websites in the exact same niche
   - Must be actual, active domains
   - Should be well-known industry players
   - Return only the domain (e.g., "greenhouse.io", not "https://greenhouse.io")
   - Must be direct competitors offering similar solutions

**CRITICAL RULES:**
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- All keywords must be realistic search terms people actually use
- Competitors must be real domains that exist and are currently active
- Niche must be a standard industry term (avoid made-up categories)

**Output Format:**
{
  "businessName": "Extracted or refined business name",
  "description": "Clean, professional business description (1-2 sentences)",
  "niche": "Industry Category",
  "keywords": {
    "high": ["keyword1", "keyword2", "keyword3"],
    "medium": ["keyword4", "keyword5", "keyword6"],
    "low": ["keyword7", "keyword8", "keyword9"]
  },
  "competitors": ["domain1.com", "domain2.com", "domain3.com", "domain4.com", "domain5.com"]
}
```

### Step 3: Complete Endpoint Flow

```python
from flask import Flask, request, jsonify
import openai  # or anthropic, or your AI provider

app = Flask(__name__)

@app.route('/api/onboarding/analyze', methods=['POST'])
def analyze_website():
    # Get URL from request
    data = request.get_json()
    website_url = data.get('website')

    if not website_url:
        return jsonify({'success': False, 'error': 'Website URL required'}), 400

    # Step 1: Scrape website
    scraped_data = scrape_website(website_url)
    if not scraped_data:
        return jsonify({'success': False, 'error': 'Failed to scrape website'}), 500

    # Step 2: Analyze with AI
    prompt = f"""You are an expert SEO strategist and market research analyst.

Analyze this business:

Business Name: {scraped_data['businessName']}
Website Content: {scraped_data['fullText']}
Description: {scraped_data['description']}

Return ONLY valid JSON (no markdown):
{{
  "businessName": "Refined business name",
  "description": "Professional 1-2 sentence description",
  "niche": "Industry (max 2 words)",
  "keywords": {{
    "high": ["keyword1", "keyword2", "keyword3"],
    "medium": ["keyword4", "keyword5", "keyword6"],
    "low": ["keyword7", "keyword8", "keyword9"]
  }},
  "competitors": ["domain1.com", "domain2.com", "domain3.com", "domain4.com", "domain5.com"]
}}

Guidelines:
- Niche: Use global industry terms (Recruiting, CRM, E-commerce, etc.)
- Keywords: Realistic search terms people use
- Competitors: Real existing competitor domains
"""

    try:
        # Call your AI (example with OpenAI)
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an SEO expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        ai_result = response.choices[0].message.content
        # Clean and parse JSON
        ai_result = ai_result.replace('```json', '').replace('```', '').strip()
        result = json.loads(ai_result)

        # Return complete result
        return jsonify({
            'success': True,
            **result
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

---

## Implementation Guidelines

### 1. **Model Selection**
- Use a capable model like GPT-4, Claude, or equivalent
- Model must be good at:
  - Industry classification
  - SEO keyword research
  - Market analysis

### 2. **Response Validation**
Before returning the response, validate:
- ✅ Niche is 1-2 words maximum
- ✅ Exactly 9 keywords (3 high, 3 medium, 3 low)
- ✅ Exactly 5 competitor domains
- ✅ All fields are present and non-empty
- ✅ Response is valid JSON

### 3. **Error Handling**
```json
{
  "success": false,
  "error": "Failed to analyze business information"
}
```

### 4. **Timeout**
- Maximum processing time: 15 seconds
- If AI takes longer, return error

### 5. **Retry Logic**
- Implement automatic retry (max 2 retries) if:
  - AI returns invalid JSON
  - Required fields are missing
  - Response doesn't match expected format

---

## Global Niche Categories Reference

The AI should use these standard industry categories:

### Technology & Software
- SaaS
- Cloud
- DevOps
- Dev Tools
- Analytics
- Cybersecurity

### Business & Productivity
- CRM
- Project Management
- Productivity
- Collaboration
- Workflow
- Automation

### HR & Talent
- Recruiting
- HR Tech
- Payroll
- Training
- E-learning

### Sales & Marketing
- Sales
- Marketing
- Email Marketing
- SEO
- Advertising

### Finance & Money
- Accounting
- Finance
- Payments
- Invoicing
- Banking

### E-commerce & Retail
- E-commerce
- Retail
- POS
- Inventory

### Communication
- Communication
- Video Conferencing
- Messaging
- VoIP

### Design & Creative
- Design
- Video
- Photography
- Animation

### Industry-Specific
- Real Estate
- Healthcare
- Legal Tech
- Education
- Construction
- Manufacturing

---

## Example Test Cases

### Test 1: Recruiting Software
**Input:**
```json
{
  "website": "https://flowxtra.com"
}
```

**Expected Output:**
```json
{
  "success": true,
  "businessName": "Flowxtra",
  "description": "Flowxtra is a cutting-edge, all-in-one talent management platform designed to streamline your hiring process with AI-powered recruitment solutions.",
  "niche": "Recruiting",
  "keywords": {
    "high": ["recruiting software", "ats platform", "talent management"],
    "medium": ["free recruiting software", "flowxtra recruiting", "hiring platform"],
    "low": ["best recruiting tools", "ats for startups", "recruiting software reviews"]
  },
  "competitors": [
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "recruitee.com",
    "breezy.hr"
  ]
}
```

### Test 2: E-commerce Platform
**Input:**
```json
{
  "website": "https://shopify.com"
}
```

**Expected Output:**
```json
{
  "success": true,
  "businessName": "Shopify",
  "description": "Shopify is the leading e-commerce platform that helps you build and manage your online store with ease.",
  "niche": "E-commerce",
  "keywords": {
    "high": ["ecommerce platform", "online store builder", "ecommerce software"],
    "medium": ["shopify ecommerce", "free online store", "ecommerce solution"],
    "low": ["best ecommerce platforms", "ecommerce for small business", "online store software"]
  },
  "competitors": [
    "woocommerce.com",
    "bigcommerce.com",
    "squarespace.com",
    "wix.com",
    "magento.com"
  ]
}
```

### Test 3: Accounting Software
**Input:**
```json
{
  "website": "https://quickbooks.intuit.com"
}
```

**Expected Output:**
```json
{
  "success": true,
  "businessName": "QuickBooks",
  "description": "QuickBooks helps you manage your business finances with ease through cloud-based accounting software for small businesses.",
  "niche": "Accounting",
  "keywords": {
    "high": ["accounting software", "bookkeeping software", "financial management"],
    "medium": ["quickbooks accounting", "small business accounting", "cloud accounting"],
    "low": ["best accounting software", "accounting for freelancers", "accounting software reviews"]
  },
  "competitors": [
    "xero.com",
    "freshbooks.com",
    "wave.com",
    "zoho.com/books",
    "sage.com"
  ]
}
```

---

## Security & Performance

### Rate Limiting
- Implement rate limiting: 10 requests per minute per IP
- Return 429 status code when limit exceeded

### API Key Authentication
- Require `x-api-key` header
- Reject requests without valid API key

### Caching (Optional)
- Cache results for identical inputs for 24 hours
- Reduces AI API costs

---

## Integration with Main Application

The main application will call this endpoint from:
`pages/api/onboarding/save.ts` (Step 1)

```typescript
const response = await axios.post(`${process.env.SLM_API_URL}/api/onboarding/analyze`, {
    website: data.website  // Just the URL!
}, {
    headers: {
        'x-api-key': process.env.SLM_API_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 30000  // 30 seconds (scraping + AI takes time)
});

const { businessName, description, niche, keywords, competitors } = response.data;
```

---

## Delivery Checklist

- [ ] Endpoint implemented at `/api/onboarding/analyze`
- [ ] Accepts POST requests with JSON body
- [ ] Returns standardized JSON response
- [ ] Validates all inputs and outputs
- [ ] Implements error handling
- [ ] Has retry logic for AI failures
- [ ] Response time under 15 seconds
- [ ] Tested with all 3 example test cases
- [ ] API key authentication working
- [ ] Documentation provided

---

## Questions?

If you need clarification on any requirements, please ask before implementation.

**Priority:** High
**Deadline:** [Add your deadline]
**Contact:** [Add your contact info]
