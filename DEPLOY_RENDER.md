# Free Cloud Deployment Guide - Render (Recommended)

This guide walks you through deploying the FushidaLanka website to **Render** for free.

## Why Render?
- **Free Web Service** — $0/month, sleeps after 15 min inactivity
- **Free PostgreSQL** — 90 days free trial (plenty for testing/demo)
- **Free Disk** — 1 GB persistent storage for uploaded files
- **HTTPS by default** — No SSL config needed
- **Git-based deploys** — Push to deploy

---

## Prerequisites

1. **GitHub Account** — [github.com](https://github.com)
2. **Render Account** — [render.com](https://render.com) (sign up with GitHub)
3. This project pushed to a GitHub repository

---

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/fushidhalanka.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy on Render

### Option A: One-Click Deploy (Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render will read `render.yaml` and create:
   - Web Service (free)
   - PostgreSQL Database (free)
   - Persistent Disk (free)
5. Click **"Apply"**
6. Wait 2-3 minutes for deploy

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"PostgreSQL"**
   - Name: `fushidhalanka-db`
   - Plan: **Free**
   - Create Database
3. Click **"New"** → **"Web Service"**
   - Connect your GitHub repo
   - Name: `fushidhalanka`
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: **Free**
4. Add Environment Variables:
   ```
   NODE_ENV=production
   SESSION_SECRET=your-random-secret-key-here
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   DATABASE_URL=<copy from your PostgreSQL database>
   ```
5. Add Disk:
   - Name: `uploads`
   - Mount Path: `/opt/render/project/src/public/uploads`
   - Size: `1 GB`
6. Click **"Create Web Service"**

---

## Step 3: Access Your Live Site

Once deployment is complete:
- **Website**: `https://fushidhalanka.onrender.com`
- **Admin Panel**: `https://fushidhalanka.onrender.com/admin`
- Default login: `admin@example.com` / `your-secure-admin-password`

---

## Free Tier Limitations

| Feature | Limit |
|---------|-------|
| Web Service | Sleeps after 15 min inactivity (~30 sec cold start) |
| PostgreSQL | 90 days free, then $7/month (or re-create) |
| Disk | 1 GB |
| Bandwidth | 100 GB/month |
| Build Minutes | 500 min/month |

---

## Alternative Free Hosts

| Platform | Pros | Cons |
|----------|------|------|
| **Railway** | Easy DB setup, generous free tier | Credit card required |
| **Vercel** | Fast, great for frontend | No persistent disk (files lost on deploy) |
| **Cyclic** | Free forever, no sleep | Limited to 1 app |
| **Glitch** | Instant edit+deploy | Sleeps, limited resources |

---

## Troubleshooting

### "Application Error" on first load
- Wait 1-2 minutes for database tables to auto-create
- Check Render logs: Dashboard → Service → Logs

### Database connection fails
- Verify `DATABASE_URL` environment variable is set
- Ensure PostgreSQL database is in "Available" state

### File uploads disappear
- Make sure Disk is mounted at `/opt/render/project/src/public/uploads`
- Restart service after adding disk

### Session errors
- Ensure `SESSION_SECRET` is set (any random string)
- Cookies are automatically handled via `secure: isProduction`

---

## Updating Your Site

Just push new code to GitHub:
```bash
git add .
git commit -m "Update content"
git push origin main
```
Render will auto-deploy in ~1 minute.

