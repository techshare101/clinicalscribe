import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const html = await req.text();

  const htmlWithWatermark = `
  <html>
    <head>
      <style>
        @page { margin: 1in; }
        body { font-family: Arial, sans-serif; position: relative; }
        .watermark {
          position: fixed;
          top: 40%;
          left: 10%;
          width: 80%;
          font-size: 60px;
          color: rgba(200,200,200,0.15);
          text-align: center;
          transform: rotate(-30deg);
        }
        footer {
          position: fixed;
          bottom: 1in;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="watermark">ClinicalScribe Beta</div>
      ${html}
      <footer>Signed by Nurse __________ • ${new Date().toLocaleString()}</footer>
    </body>
  </html>`;

  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(htmlWithWatermark, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="clinicalscribe-report.pdf"',
    },
  });
}
