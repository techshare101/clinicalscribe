export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

/*
  POST /api/pdf
  Body: { html: string, watermark?: string }
  Returns: PDF binary with Content-Type application/pdf
*/
export async function POST(req: NextRequest) {
  try {
    const { html, watermark } = await req.json().catch(() => ({}))
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 })
    }

    const executablePath = await chromium.executablePath()
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })
    const page = await browser.newPage()

    const wmCss = watermark
      ? `<style>@page { margin: 56px; } body::before { content: '${(watermark as string).replace(/'/g, "\\'")}'; position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 64px; color: rgba(200,0,0,0.15); z-index: 9999; pointer-events: none; }</style>`
      : ''

    await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${wmCss}</head><body>${html}</body></html>`, {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to render PDF' }, { status: 500 })
  }
}
