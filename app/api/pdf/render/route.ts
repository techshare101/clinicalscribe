export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { adminBucket } from '@/lib/firebaseAdmin'

function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data as any, init)
}

export async function POST(req: NextRequest) {
  try {
    const { html, ownerId } = await req.json()
    if (!ownerId || typeof ownerId !== 'string') {
      return ok({ error: 'ownerId required' }, { status: 400 })
    }
    const content = String(html || '')

    const executablePath = await chromium.executablePath
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"/><style>
        .wm{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);opacity:.12;font-size:64px;font-weight:700}
        body{font-family:system-ui,Segoe UI,Arial;margin:24px}
      </style></head><body>
      <div class="wm">ClinicalScribe Beta</div>
      ${content}
      </body></html>`,
      { waitUntil: 'networkidle0' }
    )

    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    const name = `pdfs/${ownerId}/${Date.now()}.pdf`
    const file = adminBucket.file(name)
    await file.save(Buffer.from(pdf), {
      contentType: 'application/pdf',
      resumable: false,
      metadata: { cacheControl: 'private, max-age=0, no-transform' },
    })

    return ok({ path: name })
  } catch (e: any) {
    return ok({ error: e?.message || 'Render failed' }, { status: 500 })
  }
}
