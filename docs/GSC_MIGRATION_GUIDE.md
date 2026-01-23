# Google Search Console (GSC) Integration & Migration Guide

This guide explains how the GSC integration works in this project and how to migrate it or implement similar functionality in another project.

## 1. Overview of Integration
The application interacts with Google Search Console through the [Google Site Verification API](https://developers.google.com/site-verification) and the [Google Search Console API](https://developers.google.com/webmaster-tools).

### Key Files:
- **API Routes**:
  - `pages/api/gsc/verification.ts`: Handles getting verification tokens and verifying ownership.
  - `pages/api/gsc/sites.ts`: Lists all verified sites for the authenticated user.
  - `pages/api/gsc/sitemap.ts`: Submits a sitemap URL to Google Search Console.
  - `pages/api/insight.ts`: Fetches and processes performance statistics (Clicks, Impressions, etc.).
  - `pages/api/searchconsole.ts`: Fetches raw Search Console data for a domain.
- **Utilities**:
  - `utils/searchConsole.ts`: Core logic for communicating with Google Search Console.
  - `utils/googleOAuth.ts`: Handles OAuth 2.0 flow and token management.
- **Database**:
  - `database/models/domain.ts`: Stores domain configuration and cached GSC data.

---

## 2. Setting Up a New Google Cloud Project
To use the GSC features, you must configure a project in the [Google Cloud Console](https://console.developers.google.com/):

1.  **Create a Project**: Create a new project or select an existing one.
2.  **Enable APIs**: Enable the following APIs:
    - Google Search Console API
    - Google Site Verification API
3.  **Configure OAuth Consent Screen**:
    - Set user type to External.
    - Add scopes:
      - `https://www.googleapis.com/auth/webmasters` (Full access for sitemaps and stats)
      - `https://www.googleapis.com/auth/siteverification` (For verification)
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
1.  **Copy Files**: Copy the `api/gsc`, `api/insight.ts`, `api/searchconsole.ts`, `utils/searchConsole.ts`, and `utils/googleOAuth.ts`.
2.  **Environment Variables**: Ensure your `.env` file contains:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `SECRET` (for encryption)
    - `NEXT_PUBLIC_APP_URL`
3.  **Database Migration**: Update your database schema to include `search_console` (config JSON) and `search_console_data` (cache JSON) in your `Domain` table.
4.  **OAuth Scopes**: Ensure your authorization logic includes `https://www.googleapis.com/auth/webmasters`.

