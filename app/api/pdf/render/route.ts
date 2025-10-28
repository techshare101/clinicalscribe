import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Force Node runtime for Vercel Pro

export async function POST(req: Request) {
  try {
    const html = await req.text();
    console.log('[PDF Render] Starting PDF generation...');

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

    console.log('[PDF Render] Launching browser with @sparticuz/chromium...');
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    console.log('[PDF Render] Browser launched successfully');

    const page = await browser.newPage();
    await page.setContent(htmlWithWatermark, { waitUntil: "networkidle0" });
    
    console.log('[PDF Render] Generating PDF...');
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    
    console.log('[PDF Render] PDF generated successfully, size:', pdf.length, 'bytes');

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="clinicalscribe-report.pdf"',
      },
    });
  } catch (error: any) {
    console.error('[PDF ERROR]', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
