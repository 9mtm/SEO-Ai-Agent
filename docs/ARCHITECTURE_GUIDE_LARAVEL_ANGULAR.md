# Architecture Guide: Embedded SaaS Dashboard (Laravel + Angular)

This guide documents how to replicate the "Embeddable WordPress Dashboard" architecture using a **Laravel Backend** and **Angular Frontend**. This pattern allows your SaaS application to be embedded directly inside WordPress (or other platforms like Shopify/Wix) while maintaining secure authentication without relying on third-party cookies.

---

## 1. System Architecture

The core concept is **Iframe-based Injection** with **Token-based Authentication**.

### The Flow
1.  **WordPress Plugin**: Acts as the "Client". It has a Secret Key (API Key) linked to a specific user in your platform.
2.  **Handshake (SSO)**: When the user opens the plugin page, WordPress makes a server-side `POST` request to your Laravel API to get a "One-Time Login Link".
3.  **Redirect**: Your API validates the key, generates a JWT, and returns a URL: `https://yourapp.com/sso?token=xyz`.
4.  **Embedding**: WordPress creates an `<iframe>` pointing to that URL.
5.  **Frontend Init**: Angular initializes, detects the token in the URL, saves it to `localStorage`, and authenticates the user.

---

## 2. The Problem: Third-Party Cookies
Modern browsers (Chrome Incognito, Safari, Firefox) block cookies set by an Iframe if the Iframe's domain (`yourapp.com`) differs from the parent window (`user-wordpress-site.com`).
*   **Result**: Standard Laravel Session/Cookies (`laravel_session`) **WILL NOT WORK**. The API calls inside the iframe will be rejected as "Unauthenticated".
*   **Solution**: Use **Bearer Tokens (JWT)** stored in `localStorage`. LocalStorage is partitioned but accessible to the iframe, and Headers are never blocked.

---

## 3. Database Schema (Laravel)

You need to store the "Connection" details.

**Table: `platform_integrations`**
```php
Schema::create('platform_integrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The SaaS User
    $table->string('platform_type'); // 'wordpress', 'shopify', etc.
    $table->string('platform_domain'); // e.g., 'client-site.com'
    $table->string('platform_user_id')->nullable(); // The WP Admin's internal ID
    $table->string('shared_secret')->unique(); // The API Key used for the Handshake
    $table->json('settings')->nullable();
    $table->timestamps();
});
```

---

## 4. Backend Implementation (Laravel)

### Step 1: Install JWT Auth
Use `php-open-source-saver/jwt-auth` or Laravel Passport/Sanctum (configured for API Tokens, not Cookies).

### Step 2: Create the SSO Endpoint
**Route**: `POST /api/platform/sso-token`

```php
// PlatformAuthController.php

public function ssoToken(Request $request)
{
    // 1. Validate the Secret Key sent by WordPress
    $secret = $request->header('X-Platform-Secret');
    $domain = $request->header('X-Platform-Domain');

    $integration = PlatformIntegration::where('shared_secret', $secret)
                    ->where('platform_type', 'wordpress')
                    ->first();

    if (!$integration) {
        return response()->json(['error' => 'Invalid Secret'], 401);
    }

    // 2. Identify the User
    $user = $integration->user;

    // 3. Generate JWT Token (TTL: 24 hours)
    // Using JWTAuth library example:
    $token = JWTAuth::fromUser($user, ['integration_id' => $integration->id]);

    // 4. Return the Redirect URL
    // Do NOT set a cookie here. The frontend will handle the token.
    $redirectUrl = config('app.frontend_url') . "/platform-sso?token={$token}&platform=wordpress";

    return response()->json([
        'success' => true,
        'redirect_url' => $redirectUrl
    ]);
}
```

---

## 5. Frontend Implementation (Angular)

### Step 1: Create the SSO Component
**Route**: `/platform-sso`

```typescript
// platform-sso.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ ... })
export class PlatformSsoComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    // 1. Capture Token from URL
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (token) {
      // 2. Save to LocalStorage (CRITICAL step)
      localStorage.setItem('auth_token', token);
      
      // 3. Redirect to Dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
```

### Step 2: HTTP Interceptor (Inject Token)
You must inject the token into **EVERY** API call.

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('auth_token');

    if (token) {
      // Clone the request and add Authorization Header
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
```

### Step 3: Register Interceptor
In your `app.module.ts`:

```typescript
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
]
```

### Step 3: Register Interceptor
In your `app.module.ts`:

```typescript
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
]
```

---

## 5b. Authentication Verification (Best Practice)

When building pages that run in the **Main Window** (e.g., the "Connect to WordPress" page), you might rely on **HttpOnly Cookies** for the main session, while the Iframe relies on **LocalStorage**.

**Problem:**
If you check for `localStorage.getItem('auth_token')` to decide if a user is logged in, you might get a false negative if the user is logged in via HttpOnly Cookies (e.g., from a Google Login flow).

**Solution:**
Do not rely on the presence of a token in LocalStorage to determine "Logged In" status. Instead, attempt to fetch the user profile from your API.

```typescript
// auth.guard.ts or Component
checkAuth() {
  // Try to fetch user. If 401, then redirect to login.
  this.http.get('/api/user').subscribe({
    next: (user) => { /* User is logged in (via Cookie or Header) */ },
    error: (err) => { if (err.status === 401) { /* Redirect to Login */ } }
  });
}
```

---

## 6. WordPress Plugin (The Client)

This is the `seo-ai-agent.php` file you will install on the client's WordPress site.

**Directory Structure:**
```
wp-content/plugins/seo-ai-agent/
└── seo-ai-agent.php
```

**Full Plugin Code (`seo-ai-agent.php`):**

```php
<?php
/**
 * Plugin Name: SEO AI Agent Integration
 * Plugin URI: https://your-saas-app.com
 * Description: Seamlessly integrates your SaaS dashboard into WordPress.
 * Version: 1.0.0
 * Author: Your Name
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit;

// CONFIGURATION
define('SAAS_APP_URL', 'https://your-laravel-api.com'); // Update this!
define('SAAS_SSO_ENDPOINT', SAAS_APP_URL . '/api/platform/sso-token');

class SEO_AI_Agent {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'));
        add_action('admin_init', array($this, 'handle_save_key'));
        add_action('admin_init', array($this, 'handle_disconnect'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'SEO AI Agent',
            'SEO AI Agent',
            'manage_options',
            'seo-ai-agent',
            array($this, 'render_main_page'),
            'dashicons-chart-area', // Icon
            2
        );
    }

    public function enqueue_styles() {
        wp_add_inline_style('wp-admin', '
            .seo-ai-iframe-container {
                width: 100%; height: calc(100vh - 100px);
                background: #fff; border: 1px solid #ddd;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .seo-ai-iframe { width: 100%; height: 100%; border: none; }
        ');
    }

    public function render_main_page() {
        $api_key = get_option('seo_ai_agent_api_key');

        if (!$api_key) {
            $this->render_connect_page();
        } else {
            $this->render_dashboard_view($api_key);
        }
    }

    private function render_connect_page() {
        // Simple form to save API Key
        ?>
        <div class="wrap">
            <h1>Connect to SaaS Platform</h1>
            <form method="post">
                <?php wp_nonce_field('seo_ai_save_key'); ?>
                <input type="hidden" name="seo_ai_manual_key" value="1">
                <p>Enter your API Key generated from the Dashboard:</p>
                <input type="text" name="api_key" style="width: 400px;" placeholder="Paste API Key here...">
                <button type="submit" class="button button-primary">Connect</button>
            </form>
        </div>
        <?php
    }

    private function render_dashboard_view($api_key) {
        // 1. SSO Handshake
        $response = wp_remote_post(SAAS_SSO_ENDPOINT, array(
            'method' => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Platform-Type' => 'wordpress',
                'X-Platform-Secret' => $api_key,
                'X-Platform-Domain' => preg_replace('#^https?://#', '', get_site_url()),
            ),
            'body' => json_encode(['email' => wp_get_current_user()->user_email])
        ));

        // 2. Handle Errors (Key Mismatch)
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            echo '<div class="notice notice-error"><p>Connection Failed. Please reset.</p></div>';
            $this->render_disconnect_button();
            return;
        }

        // 3. Get Redirect URL
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $redirect_url = $body['redirect_url'];

        // 4. Render Iframe
        ?>
        <div class="wrap" style="margin: 0; padding-top: 10px;">
           <div class="seo-ai-iframe-container">
               <iframe src="<?php echo esc_url($redirect_url); ?>" class="seo-ai-iframe" allow="clipboard-read; clipboard-write"></iframe>
           </div>
           <div style="margin-top: 10px; text-align: right;">
               <?php $this->render_disconnect_button(); ?>
           </div>
        </div>
        <?php
    }

    private function render_disconnect_button() {
        ?>
        <form method="post" style="display:inline;">
            <?php wp_nonce_field('seo_ai_disconnect'); ?>
            <input type="hidden" name="seo_ai_action" value="disconnect">
            <button type="submit" class="button button-secondary">Disconnect Account</button>
        </form>
        <?php
    }

    public function handle_save_key() {
        if (isset($_POST['seo_ai_manual_key']) && current_user_can('manage_options')) {
            check_admin_referer('seo_ai_save_key');
            update_option('seo_ai_agent_api_key', sanitize_text_field($_POST['api_key']));
            wp_redirect(admin_url('admin.php?page=seo-ai-agent'));
            exit;
        }
    }

    public function handle_disconnect() {
        if (isset($_POST['seo_ai_action']) && $_POST['seo_ai_action'] === 'disconnect' && current_user_can('manage_options')) {
            check_admin_referer('seo_ai_disconnect');
            delete_option('seo_ai_agent_api_key');
            wp_redirect(admin_url('admin.php?page=seo-ai-agent'));
            exit;
        }
    }
}

new SEO_AI_Agent();
```


---

## Summary of Key Rules

1.  **Do NOT use Cookie Authentication** between the Iframe and your API. It will fail in Safari.
2.  **Do NOT rely on `SameSite=None`**. It is flaky in development (HTTP) and requires HTTPS strictly.
3.  **Always use `localStorage` + `Authorization: Bearer` header**. This is the only robust cross-origin iframe authentication method.
4.  **Prioritize the "Secret Key" Identity**. When identifying the user in the SSO step, trust the DB record linked to the Secret Key, not the email sent in the request body.
