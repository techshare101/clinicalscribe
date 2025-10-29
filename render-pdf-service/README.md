# ClinicalScribe PDF Service for Render

This is a lightweight Node.js microservice that runs Puppeteer to generate PDFs from HTML.

## Why This Exists

Vercel's serverless environment doesn't support Chromium/Puppeteer reliably. This service runs on Render's full Linux VM with Chromium installed, providing a fallback PDF generation endpoint.

## Deploy to Render

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. **Important**: Set the **Root Directory** to `render-pdf-service`
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)
6. Click **Create Web Service**

## Expected Output

Once deployed, you should see:
```
🚀 PDF service running on port 10000
```

Visit your service URL (e.g., `https://clinicalscribe-pdf-service.onrender.com`) and you'll see:
```
✅ ClinicalScribe PDF Service Online
```

## Test the Endpoint

```bash
curl -X POST https://your-service.onrender.com/api/pdf/render \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF</h1><p>This is a test.</p>"}' \
  --output test.pdf
```

## Connect to Your Main App

After deployment, add this environment variable to your Vercel project:

```
RENDER_PDF_URL=https://your-service.onrender.com/api/pdf/render
```

Then redeploy your main ClinicalScribe app. It will automatically use this endpoint as a fallback when local PDF generation fails.

## Why Render Was Failing Before

Render was trying to build your entire Next.js app (which requires Vercel-specific features) instead of this simple Node.js service. This folder contains only what Render needs:

- ✅ Simple Express server
- ✅ Puppeteer for PDF generation
- ✅ System dependencies (apt.txt)
- ✅ No Next.js, no Vercel, no React

## Architecture

```
User Request → Vercel (ClinicalScribe) → Try Local PDF
                                        ↓ (if fails)
                                   Render Service → Generate PDF → Return
```

## Cost

- **Free tier**: Service sleeps after 15 min of inactivity (first request takes ~30s to wake)
- **Paid tier** ($7/mo): Always on, faster response times
