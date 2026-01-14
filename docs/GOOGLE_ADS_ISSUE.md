# Google Ads API Issue: 501 Unimplemented Error

## Problem Description
You may encounter a `501 Unimplemented` error (or `Permission Denied`) when attempting to **Load Keyword Ideas** in the application.

### Symptoms
- The "Load Keyword Ideas" button fails silently or shows an error in the logs.
- Server logs show:
  ```json
  {
    "error": {
      "code": 501,
      "message": "Operation is not implemented, or supported, or enabled.",
      "status": "UNIMPLEMENTED"
    }
  }
  ```
- The "Ideas" tab has been temporarily hidden to prevent confusion.

## Root Cause
The **Google Ads Developer Token** being used has **Test Account** access level only.

- **Test Account Access:** Allows API calls ONLY to specific Test Accounts (Test Manager Accounts/Test Client Accounts). It **cannot** access real production data or generate keyword ideas for live domains.
- **Production Data:** Requires at least **Basic Access**.

## Solution: Request "Basic Access"

To resolve this issue and enable the feature, you must upgrade your developer token access level.

### Step-by-Step Instructions

1.  **Log in to your Google Ads Manager Account:**
    Go to [https://ads.google.com/home/tools/manager-accounts/](https://ads.google.com/home/tools/manager-accounts/) and sign in.

2.  **Navigate to API Center:**
    Click on **Tools & Settings** (wrench icon) > **Setup** > **API Center**.

3.  **Check Access Level:**
    You will see your Developer Token and its current "Access Level". It will likely say "Test Account".

4.  **Apply for Basic Access:**
    - Click the link or button that says **"Apply for Basic Access"**.
    - Fill out the application form:
        - **Company Type:** Advertiser / Agency.
        - **Intended Use:** "Building an internal SEO tool to generate keyword ideas for our own content strategy." (or similar).
    - Submit the application.

5.  **Wait for Approval:**
    Google usually reviews these requests quickly (sometimes legally required business verification is needed).

6.  **Re-enable the Feature in SEO AI Agent:**
    Once your access level says **Basic Access**:
    - Open `components/domains/DomainHeader.tsx`.
    - Uncomment the code block for the "Ideas" tab (around lines 77-90).
    - Determine if you need to re-connect your Google Account in **Settings > Integrations**.

## Verification
After upgrading, the `501` error will disappear, and the "Load Keyword Ideas" button will successfully fetch data from the Google Ads API.
