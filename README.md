
# Flowxtra SERP Tracker + SEO Agent (Local SaaS)

![License](https://img.shields.io/badge/license-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![AI](https://img.shields.io/badge/AI-Powered-purple)

**Flowxtra SERP Tracker** has been upgraded to a **Multi-Tenant SaaS** with a built-in **Local AI SEO Agent**.
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

3. **Initialize Database:**
   ```bash
   npm run db:migrate
   ```

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

For **production servers**, you need to set up a cron job to run the batch notification process.

#### Linux/Unix Servers:

1. **Open crontab editor:**
   ```bash
   crontab -e
   ```

2. **Add the following cron job** (runs every hour):
   ```bash
   0 * * * * cd /path/to/seo_ai_agent && /usr/bin/node cron.js >> /var/log/seo-cron.log 2>&1
   ```

3. **Or use PM2** (recommended for Node.js apps):
   ```bash
   pm2 start cron.js --name "seo-cron"
   pm2 save
   pm2 startup
   ```

#### Windows Servers:

1. **Open Task Scheduler**
2. **Create New Task:**
   - **Trigger:** Hourly
   - **Action:** Start a program
   - **Program:** `C:\Program Files\nodejs\node.exe`
   - **Arguments:** `cron.js`
   - **Start in:** `C:\path\to\seo_ai_agent`

### Environment Variables for Email

Make sure these are set in `.env.local`:

```env
# SMTP Configuration
SMTP_HOST=mail.flowxtra.com
SMTP_PORT=465
SMTP_USERNAME=no-reply@flowxtra.com
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=ssl
SMTP_FROM_EMAIL=no-reply@flowxtra.com
SMTP_FROM_NAME=SEO AI Agent

# Batch Processing (emails per hour)
NOTIFICATION_BATCH_SIZE=10
```

### How It Works

- **Cron runs every hour** and sends a batch of emails (default: 10)
- **Checks last notification date** - only sends if 30+ days have passed
- **Logs all attempts** in `notification_logs` table
- **Prevents spam** by distributing emails over time

### Manual Testing

Test the batch notification system:
```bash
curl -X POST http://localhost:55781/api/batch-notify
```

---

**© 2026 Dpro GmbH - Flowxtra**
