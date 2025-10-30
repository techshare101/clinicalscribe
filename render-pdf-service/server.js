import express from "express";
import fs from "fs";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (_, res) => res.send("ClinicalScribe PDF Service Online"));

function resolveExecutablePath(): string | null {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate!)) {
      return candidate!;
    }
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

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`PDF service running on port ${port}`));
