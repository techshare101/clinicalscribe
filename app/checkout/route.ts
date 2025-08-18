import { NextResponse } from 'next/server'
import { getStripeLink } from '@/lib/pricing'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const plan = url.searchParams.get('plan') ?? 'beta'
  const stripeLink = getStripeLink(plan)

  if (!stripeLink) {
    return NextResponse.redirect(new URL('/', url), { status: 302 })
  }

  return NextResponse.redirect(stripeLink, { status: 302 })
}
