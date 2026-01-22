
# SEO Agent

website: https://seo-agent.net

![License](https://img.shields.io/badge/license-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![AI](https://img.shields.io/badge/AI-Powered-purple)

**SEO Agent** has been upgraded to a **Multi-Tenant SaaS** with a built-in **Local AI SEO Agent**.
This version runs entirely on your local machine using Node.js for the web app and a local Python server for the AI model (Qwen).

---

## ✨ New Features

- **🏠 Multi-Tenant SaaS:** Full user isolation. Sign up, login, and manage private projects.
- **🤖 SEO Agent (AI):** Chat with a local AI model (Qwen 2.5) to get keyword ideas and SEO advice.
- **🔐 Google OAuth:** One-click login and integration with Search Console & Google Ads.
- **⚡ Local Intelligence:** No external AI API keys required. Runs 100% locally on your CPU/GPU.

---

## 🛠️ Installation Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL Database** (Local or Remote)
- **Python 3.10+** (For the AI Server)
- **Git**

### 2. Setup the Web Application

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Update `.env.local` with your database and app settings:
   ```bash
   # Database
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=root
   DB_NAME=seo_db
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:55781
   SECRET=your-random-secret
    
   # Local AI (Seo Agent)
   SLM_API_URL=http://127.0.0.1:38474
   ```

3. **Database Migrations:**

   - **For Local Development (MAMP/Local MySQL):**
     ```bash
     npm run db:migrate
     ```
     *Loads settings from `.env.local`.*

   - **For Production (TiDB Cloud/Remote MySQL):**
     ```bash
     npm run db:migrate:prod
     ```
     *Sets `NODE_ENV=production` and loads settings from `.env.production`. Mandatory SSL is automatically enabled for TiDB Cloud compatibility.*

4. **Start Web Server:**
   ```bash
   npm run dev
   ```
   Access at: **http://localhost:55781**

---

## 🤖 Setup Local AI Agent (Seo Agent)

The AI Agent uses `llama-cpp-python` to run the Qwen model efficiently on your CPU.

### 1. Create Python Virtual Environment
Run this inside the project folder:
```powershell
# Create venv
& "path\to\python.exe" -m venv .venv
```

*(Note: Replace `path\to\python.exe` with your actual Python installation path if needed)*

### 2. Install Dependencies
```powershell
# Install llama-cpp-python server
.venv\Scripts\pip install "llama-cpp-python[server]"
```

### 3. Download the Model
Place the `qwen2.5-3b-instruct-q4_k_m.gguf` model file in the `models/` directory.

### 4. Run the AI Server
Open a **separate PowerShell window** and run:

```powershell
# Activate Environment
.venv\Scripts\Activate.ps1

# Run Server (Port 38474)
python -m llama_cpp.server --model models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 38474 --n_ctx 2048 --n_threads 6
```

✅ **Verification:**
- Open http://127.0.0.1:38474/docs to see the API Swagger UI.
- Go to the **Seo Agent** tab in the web app to chat with the model.

---

## 🔧 Managing the Project

### Start Everything
1. Terminal 1: `npm run dev` (Web App)
2. Terminal 2: `python -m llama_cpp.server ...` (AI Model)

### Troubleshooting
- **Module not found 'ai/react'**: Run `npm install ai@3.4.0`
- **Database Errors**: Ensure MySQL is running and `npm run db:migrate` has been executed.
- **Port Conflicts**: Change port in `package.json` or `.env.local` if 55781 is busy.

---

## 📧 Email Notifications Setup (Production)

The application includes an automated batch notification system that sends monthly email updates to users.

### Cron Job Configuration

### Running Cron Jobs (Production)

The system relies on several background tasks for scraping keywords and sending notifications.

#### Using PM2 (Recommended)
PM2 is a process manager that keeps your app and cron jobs running forever.

1. **Start the Web App:**
   ```bash
   npm run build
   pm2 start npm --name "seo-web" -- start
   ```

2. **Start the Cron Scheduler:**
   ```bash
   pm2 start npm --name "seo-cron" -- run cron
   ```
   *This runs `cron.js`, which handles:*
   *   Monthly SERP Scraping
   *   Hourly Batch Notifications
   *   Failed Job Retries
   *   Daily Google Search Console Sync

3. **Monitor Logs:**
   The cron system automatically creates a `logs/` directory in your project root.
   *   `logs/cron.log`: General activity and success messages.
   *   `logs/cron.error.log`: Errors and failure details.

   You can also check live logs via PM2:
   ```bash
   pm2 logs seo-cron
   ```

### Manual Testing

Test the batch notification system manually:
```bash
# Trigger Batch Notification
curl -X POST http://localhost:55781/api/batch-notify

# Trigger SERP Scraping (Protected)
curl -X POST http://localhost:55781/api/cron -H "Authorization: Bearer YOUR_API_KEY"
```

---

**© 2026 Dpro GmbH - Flowxtra**
