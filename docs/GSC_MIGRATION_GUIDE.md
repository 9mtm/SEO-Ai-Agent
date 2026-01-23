# Google Search Console (GSC) Integration & Migration Guide

This guide explains how the GSC integration works in this project and how to migrate it or implement similar functionality in another project.

## 1. Overview of Integration
The application interacts with Google Search Console through the [Google Site Verification API](https://developers.google.com/site-verification) and the [Google Search Console API](https://developers.google.com/webmaster-tools).

### Key Files:
- **API Routes**:
  - `pages/api/gsc/verification.ts`: Handles getting verification tokens and verifying ownership.
  - `pages/api/gsc/sites.ts`: Lists all verified sites for the authenticated user.
  - `pages/api/gsc/sitemap.ts`: Submits a sitemap URL to Google Search Console.
  - `pages/api/insight.ts`: Fetches performance stats (Clicks, Impressions, etc.).
  - `pages/api/auth/google/authorize.ts`: Initiates the Google OAuth login flow.
  - `pages/api/auth/google/callback.ts`: Handles the Google OAuth response and saves tokens.
- **Utilities**:
  - `utils/searchConsole.ts`: Core logic for Search Console API.
  - `utils/googleOAuth.ts`: Token management and credential refreshing.
  - `utils/indexing.ts`: Utility for the Google Indexing API (Fast Job Indexing).
- **Database**:
  - `database/models/domain.ts`: Stores domain settings, OAuth tokens, and cached GSC data.

---

## 2. Setting Up a New Google Cloud Project
To use the GSC features, you must configure a project in the [Google Cloud Console](https://console.developers.google.com/):

1.  **Create a Project**: Create a new project or select an existing one.
2.  **Enable APIs**: Enable the following 3 critical APIs in the [API Library](https://console.cloud.google.com/apis/library):
    - **Google Search Console API**: For performance stats, sitemaps, and site listings.
    - **Google Site Verification API**: For the programmatic meta-tag verification flow.
    - **Indexing API**: For instant indexing of job postings and broadcast events.
3.  **Configure OAuth Consent Screen**:
    - Set user type to External.
    - Add scopes:
      - `https://www.googleapis.com/auth/webmasters` (Full access for sitemaps and stats)
      - `https://www.googleapis.com/auth/siteverification` (For verification)
      - `https://www.googleapis.com/auth/indexing` (For the Indexing API)
4.  **Create Credentials**:
    - Create an **OAuth 2.0 Client ID** (Web application).
    - Add your Redirect URIs (e.g., `http://localhost:3000/api/auth/google/callback`).

---

## 3. Site Verification Workflow

### Step A: Requesting a Verification Token
When a user adds a new site, we request a "Meta Tag" verification token from Google.
- **Endpoint**: `POST /api/gsc/verification` with `action: 'getToken'`.
- **API Call**: `https://www.googleapis.com/siteVerification/v1/token`
- **Logic**: Sends the `siteUrl` and `verificationMethod: 'META'`.

### Step B: Storing the Token
Once the token is received (e.g., `<meta name="google-site-verification" content="..." />`), it is displayed to the user to add to their website's `<head>`. Typically, this value is also stored in the `Domain` table under a column like `search_console_data` or `verification_meta`.

### Step C: Verifying Ownership
After the user adds the tag, we ask Google to check it.
- **Endpoint**: `POST /api/gsc/verification` with `action: 'verify'`.
- **API Call**: `POST https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META`
- **Result**: If successful, Google marks the user as an owner.

---

## 4. Fetching Available Sites
To show the user a list of their websites already in GSC:
- **Endpoint**: `GET /api/gsc/sites`
- **API Call**: `https://www.googleapis.com/webmasters/v3/sites`
- **Logic**: Returns an array of site URLs and permission levels.

---

## 5. Fetching Statistics (Insight & Console)
Statistics are fetched using the `searchanalytics.query` method.

- **API Flow**:
  1. Authenticate with the user's OAuth 2.0 Access Token.
  2. Define dimensions (e.g., `['query', 'page', 'country', 'device']`).
  3. Set a date range (last 30 days).
  4. Call: `client.searchanalytics.query({ siteUrl, requestBody })`.

### Data Storage:
Performance data is cached in the `Domain` model inside the `search_console_data` column (JSON) to avoid hitting Google API rate limits on every page load.

---

## 6. Managing Sitemaps
To add or submit a sitemap URL to GSC:
- **Endpoint**: `POST /api/gsc/sitemap`
- **Utility**: `submitSitemap(domain, sitemapUrl)` in `utils/searchConsole.ts`.
- **Code Logic**:
  ```javascript
  const client = new searchconsole_v1.Searchconsole({ auth: authClient });
  await client.sitemaps.submit({
    siteUrl: 'https://example.com/',
    feedpath: 'https://example.com/sitemap.xml'
  });
  ```

---

## 7. Migration Steps to a New Project

### Environment Variables (.env)
You must define the following variables in your environment for the integration to function:

```bash
# OAuth 2.0 Credentials (From Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Or your production URL
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Security (For encrypting tokens in DB)
SECRET="your-very-secure-random-string"

# Indexing API / Service Account (Optional fallbacks or for fast indexing)
SEARCH_CONSOLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
SEARCH_CONSOLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

1.  **Copy Files**: Copy the `api/gsc`, `api/insight.ts`, `api/searchconsole.ts`, `utils/searchConsole.ts`, and `utils/googleOAuth.ts`.
2.  **Database Migration**: Update your database schema to include `search_console` (config JSON) and `search_console_data` (cache JSON) in your `Domain` table.
3.  **OAuth Scopes**: Ensure your authorization logic includes `https://www.googleapis.com/auth/webmasters`.

---

## 8. Google Indexing API (Fast Indexing for Job Posts)
The Indexing API allows you to notify Google immediately when pages with `JobPosting` or `BroadcastEvent` structured data are added, updated, or removed. This ensures your job posts appear in search results much faster.

### Prerequisites (Google Cloud Console):
1.  **Enable API**: Enable the **Indexing API** in your Google Cloud Project.
2.  **Service Account**:
    - Create a Service Account in IAM & Admin.
    - Download the **JSON Key file**.
    - Copy the Service Account's email address (e.g., `my-service-account@project.iam.gserviceaccount.com`).
3.  **Search Console Permission**:
    - Open Search Console for your site.
    - Go to **Settings > Users and permissions**.
    - Add the Service Account email as an **Owner**.

### Usage logic (Node.js):
To notify Google of a new or updated job post:

```javascript
const { google } = require('googleapis');
const key = require('./path-to-your-service-account-key.json');

const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/indexing'],
  null
);

async function notifyGoogle(url, type = 'URL_UPDATED') {
  await jwtClient.authorize();
  const options = {
    url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
    method: 'POST',
    auth: jwtClient,
    body: JSON.stringify({
      url: url,
      type: type // 'URL_UPDATED' or 'URL_DELETED'
    })
  };
  
  // Send the request using your preferred HTTP client (axios, fetch, etc.)
  // Or use the Google SDK directly if available.
}
```

### Benefits for Recruitment Platforms:
- **Instant Crawling**: Job posts are crawled almost immediately after publishing.
- **Accurate Search Results**: Deleted jobs are removed from Google results quickly, preventing user frustration from clicking on expired links.
- **SEO Edge**: Faster indexing gives your platform a speed advantage over competitors relying on standard sitemap crawling.

---

## 9. Summary: Developer vs. User Roles

To ensure a smooth experience in your second platform, follow this role clarity:

### Developer Responsibilities (One-time Setup)
1.  **Project Creation**: Create the Google Cloud Project and enable APIs (GSC, Site Verification, Indexing).
2.  **Credentials**: Securely store `Client ID`, `Client Secret`, and the `Service Account JSON`.
3.  **Implementation**: Build the OAuth flow to capture and store the user's `Refresh Token`.
4.  **Automation**: Set up background workers (Cron jobs) to use these tokens for fetching stats and submitting sitemaps.

### User Actions (The Onboarding Flow)
1.  **Authorize**: Click "Connect Google" to grant the platform permission to view Search Console data (OAuth).
2.  **Verify**: If the site isn't verified, follow the platform's instructions to add the Meta Tag (or DNS).
3.  **Indexing Permission (Crucial)**: For the **Fast Job Indexing** feature, the user must go to their Search Console settings and add the platform's **Service Account Email** as an **Owner**. *You should display this email clearly in your platform's dashboard.*

By following this guide, your recruitment platform will have a robust, professional Google integration that handles everything from data analytics to instant job أرشفة.

---

## 10. Frontend Implementation (Angular)

If your second project uses **Angular**, the architecture shifts slightly since we must keep sensitive logic (secrets) on the backend.

### High-Level Architecture
1.  **Backend (Node.js/Express)**: Handles OAuth redirects, token exchange, and direct communication with Google APIs using the secrets in `.env`.
2.  **Frontend (Angular)**: Handles the UI, initiates the connection flow, and displays the fetched data.

### 1. Initiating OAuth from Angular
Do not use client-side OAuth for this. Instead, redirect the user to your backend endpoint:
```typescript
// in your-component.component.ts
connectGoogle() {
  window.location.href = `${environment.apiUrl}/api/auth/google/authorize`;
}
```

### 2. Handling the Callback Redirect
Once the backend completes the OAuth flow, it should redirect back to your Angular app:
- **Backend Redirect**: `res.redirect('https://your-angular-app.com/settings?google=connected');`
- **Angular Side**: Use a Route Guard or checking `ActivatedRoute` params to detect the success and refresh the user's connection status.

### 3. Displaying Indexing Requirements
In your Angular Job Posting dashboard, ensure you show a clear message for the Indexing API:
```html
<div class="alert alert-info">
  <strong>Fast Indexing:</strong> To enable instant Google indexing for your jobs, 
  please add <code>{{serviceAccountEmail}}</code> as an <strong>Owner</strong> 
  in your Google Search Console settings.
</div>
```

### 4. Calling Backend APIs
Use Angular's `HttpClient` to call your backend wrappers for the GSC data:
```typescript
getGscStats(domain: string) {
  return this.http.get(`${environment.apiUrl}/api/gsc/insight?domain=${domain}`);
}
```
*Note: Ensure your Backend handles CORS properly to allow requests from your Angular domain.*




