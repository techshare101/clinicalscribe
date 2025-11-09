import express from "express";
import fs from "fs";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import FormData from "form-data";

const app = express();
app.use(express.json({ limit: "200mb" }));

app.get("/", (_, res) => res.send("ClinicalScribe PDF Service Online"));

function resolveExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROMIUM_PATH,
    process.env.CHROME_BIN,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fall back to Puppeteer's bundled Chromium if available.
  try {
    const bundledPath = puppeteer.executablePath();
    if (bundledPath && fs.existsSync(bundledPath)) {
      console.log("[Render Service] Using bundled Chromium at:", bundledPath);
      return bundledPath;
    }
    console.warn(
      "[Render Service] Bundled Chromium path not found or missing on filesystem:",
      bundledPath
    );
  } catch (err) {
    console.warn("[Render Service] Unable to resolve puppeteer.executablePath()", err);
  }

  return null;
}

app.post("/api/pdf/render", async (req, res) => {
  try {
    const { html } = req.body;

    const executablePath = resolveExecutablePath();

    if (!executablePath) {
      throw new Error(
        "Unable to resolve Chromium executable path. Set PUPPETEER_EXECUTABLE_PATH."
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html || "<h1>Empty PDF</h1>", {
      waitUntil: "networkidle0",
    });
    const pdf = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("x-render-mode", "remote");
    res.send(pdf);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🧠 Merge + transcribe chunk URLs from Firebase Storage
app.post("/api/whisper/merge", async (req, res) => {
  try {
    const { chunkUrls = [], patientLang = "auto", docLang = "en" } = req.body;
    
    if (!Array.isArray(chunkUrls) || chunkUrls.length === 0) {
      return res.status(400).json({ error: "No chunk URLs provided" });
    }

    console.log(`🎧 [Whisper Merge] Received ${chunkUrls.length} audio chunks`);

    let fullTranscript = "";

    for (let i = 0; i < chunkUrls.length; i++) {
      const url = chunkUrls[i];
      console.log(`🔹 Processing chunk ${i + 1}/${chunkUrls.length}`);

      // Download audio blob from Firebase Storage
      const audioRes = await fetch(url);
      if (!audioRes.ok) {
        console.error(`Failed to fetch chunk ${i + 1}: ${url}`);
        continue; // Skip failed chunks
      }

      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const form = new FormData();
      form.append("file", buffer, {
        filename: `chunk${i + 1}.webm`,
        contentType: "audio/webm",
      });
      form.append("model", "whisper-1");
      form.append("response_format", "json");
      
      if (patientLang !== "auto") {
        form.append("language", patientLang);
      }

      // 🔥 Whisper transcription call
      const whisper = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      });

      if (!whisper.ok) {
        const text = await whisper.text();
        console.error(`Whisper failed on chunk ${i + 1}: ${text}`);
        continue; // Skip failed chunks
      }

      const data = await whisper.json();
      fullTranscript += " " + (data.text || "");
    }

    console.log(`✅ [Whisper Merge] Transcription complete. Total length: ${fullTranscript.length} chars`);
    
    res.json({ 
      text: fullTranscript.trim(),
      patientLang,
      docLang,
      chunksProcessed: chunkUrls.length
    });
  } catch (err) {
    console.error("[Whisper Merge Error]", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`🚀 Render service running on port ${port}`));
