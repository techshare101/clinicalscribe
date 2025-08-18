export type PlanKey = 'beta' | 'pro_monthly' | 'pro_yearly' | 'team_monthly' | 'team_yearly'

// Configure these public payment links in your environment
// They should be Stripe Payment Links (public URLs or code suffixes)
export const PRICE_LINKS: Record<Exclude<PlanKey, 'beta'>, string> = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY || '',
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_YEARLY || '',
  team_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_MONTHLY || '',
  team_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_YEARLY || '',
}

export function isPlanKey(value: string | null | undefined): value is Exclude<PlanKey, 'beta'> {
  return value === 'pro_monthly' || value === 'pro_yearly' || value === 'team_monthly' || value === 'team_yearly'
}

export function getPaymentLink(plan: Exclude<PlanKey, 'beta'>): string | null {
  const link = PRICE_LINKS[plan]
  return link && /^https?:\/\//.test(link) ? link : link || null
}

// Simple resolver that supports a special "beta" link and full URLs
export function getStripeLink(plan: string): string | null {
  const links: Record<string, string | undefined> = {
    beta: process.env.NEXT_PUBLIC_STRIPE_LINK_BETA,
    pro_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY,
    pro_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_YEARLY,
    team_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_MONTHLY,
    team_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_YEARLY,
  }
  const v = links[plan]
  if (!v) return null
  // Accept both full URLs and code suffixes
  if (/^https?:\/\//.test(v)) return v
  return `https://buy.stripe.com/${v}`
}
