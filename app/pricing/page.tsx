"use client"

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { CheckIcon, Crown, Zap, Shield, Star, Users, FileText, Database, Headphones, Loader2, Sparkles } from 'lucide-react'

export default function PricingPage() {
  const { profile, isLoading } = useProfile()
  const [loading, setLoading] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)

  // Dynamic pricing based on billing cycle
  const getPlans = () => [
    {
      name: 'Beta Access',
      price: '$29',
      period: '/month',
      originalPrice: '$99',
      priceId: process.env.NEXT_PUBLIC_STRIPE_LINK_BETA,
      description: 'Perfect for individual healthcare professionals getting started',
      features: [
        'AI-powered transcription',
        'SOAP note generation', 
        'Secure PDF export with watermark',
        'Basic EHR integration',
        '100 transcriptions/month',
        'Email support',
        'Mobile app access',
        'Cloud storage (5GB)',
      ],
      popular: true,
      badge: 'EARLY ACCESS',
      badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      isOneTime: false,
    },
    {
      name: 'Professional',
      price: isYearly ? '$490' : '$49',
      period: isYearly ? '/year' : '/month',
      originalPrice: isYearly ? '$588' : null,
      priceId: isYearly 
        ? process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_YEARLY 
        : process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY,
      description: 'For busy clinicians who need unlimited access and advanced features',
      features: [
        'Everything in Beta Access',
        'Unlimited transcriptions',
        'Advanced SOAP templates',
        'Priority EHR integration',
        'Digital signatures',
        'Custom PDF branding',
        'Priority phone support',
        'Advanced analytics dashboard',
        'API access',
      ],
      popular: false,
      badge: 'MOST POPULAR',
      badgeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      isOneTime: false,
    },
    {
      name: 'Team',
      price: isYearly ? '$990' : '$99',
      period: isYearly ? '/year' : '/month',
      originalPrice: isYearly ? '$1188' : null,
      priceId: isYearly 
        ? process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_YEARLY 
        : process.env.NEXT_PUBLIC_STRIPE_LINK_TEAM_MONTHLY,
      description: 'For healthcare teams and small to medium practices',
      features: [
        'Everything in Professional',
        'Multi-user access (up to 10 users)',
        'Team dashboard & analytics',
        'Bulk PDF generation',
        'Custom EHR workflows',
        'Advanced audit logs',
        'Dedicated account manager',
        'Priority phone support',
        'Custom training sessions',
        'SLA guarantees',
      ],
      popular: false,
      badge: 'ENTERPRISE',
      badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-600',
      isOneTime: false,
    },
  ]

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!auth.currentUser) {
      alert('Please log in to subscribe')
      return
    }

    if (!priceId) {
      console.error('Price ID not configured for plan:', planName)
      alert(`Price ID not configured for ${planName}. Please check your environment variables.`)
      return
    }

    console.log('Starting checkout for:', { planName, priceId, userUid: auth.currentUser?.uid })

    setLoading(priceId)

    try {
      // Enhanced authentication handling
      console.log('🔄 Pricing: Refreshing authentication state...');
      await auth.currentUser.reload();
      
      // Force refresh the ID token to ensure it's not expired
      console.log('🎫 Pricing: Getting fresh ID token...');
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Validate token is not empty
      if (!idToken) {
        throw new Error("Failed to retrieve authentication token");
      }
      
      console.log('✅ Pricing: Token obtained, length:', idToken.length);
      console.log('💳 Pricing: Creating checkout session...');
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Add as header for debugging
        },
        body: JSON.stringify({
          priceId: priceId,
          idToken: idToken,
        }),
      })

      console.log('💳 Pricing: Checkout API response status:', response.status);

      const data = await response.json()
      console.log('💳 Pricing: Checkout API response data:', data);

      if (!response.ok) {
        // Handle specific auth errors
        if (response.status === 401 || data.error?.includes('authentication') || data.error?.includes('token')) {
          console.warn('🔐 Pricing: Authentication error detected');
          alert('Authentication issue detected. Please try logging out and back in, then try again.');
        } else {
          console.error('❌ Pricing: Checkout failed:', data.error);
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        console.log('🎉 Pricing: Redirecting to Stripe Checkout...');
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('❌ Pricing: Subscription error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/user-token-expired') {
        alert('Your session has expired. Please log out and log back in, then try again.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to start subscription: ${error.message}`);
      }
    } finally {
      setLoading(null)
    }
  }

  const planStyles: Record<string, { gradient: string; iconBg: string; iconColor: string; accentGradient: string; checkColor: string; Icon: any }> = {
    'Beta Access': {
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentGradient: 'from-amber-400 to-orange-500',
      checkColor: 'text-amber-500',
      Icon: Crown,
    },
    Professional: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      accentGradient: 'from-blue-500 to-indigo-600',
      checkColor: 'text-indigo-500',
      Icon: Zap,
    },
    Team: {
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accentGradient: 'from-purple-500 to-pink-600',
      checkColor: 'text-purple-500',
      Icon: Users,
    },
  }

  const featureItems = [
    { icon: FileText, title: "AI-Powered SOAP Notes", desc: "Generate structured clinical notes automatically from voice recordings", iconBg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: Database, title: "EHR Integration", desc: "Seamlessly export to Epic, Cerner, and other major EHR systems", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Shield, title: "HIPAA Compliant", desc: "Bank-grade security with encrypted storage and transmission", iconBg: "bg-purple-100 dark:bg-purple-900/40", iconColor: "text-purple-600 dark:text-purple-400" },
    { icon: Headphones, title: "24/7 Support", desc: "Get help when you need it with our dedicated support team", iconBg: "bg-amber-100 dark:bg-amber-900/40", iconColor: "text-amber-600 dark:text-amber-400" },
  ]

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-gray-900 to-slate-950" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl" />

          <div className="relative px-6 py-10 sm:py-12 text-white text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full mb-4"
            >
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-semibold text-white/80">Choose Your ClinicalScribe Plan</span>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight mb-3">
              Simple, Transparent
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Pricing</span>
            </h1>

            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto mb-5 font-medium leading-relaxed">
              Choose the perfect plan for your practice. Upgrade or downgrade at any time.
              All plans include our core AI-powered features.
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
              <Badge className="bg-white/10 text-white/90 border-white/15 text-[10px] backdrop-blur-sm px-3 py-1">
                <Shield className="h-3 w-3 mr-1" /> HIPAA Compliant
              </Badge>
              <Badge className="bg-white/10 text-white/90 border-white/15 text-[10px] backdrop-blur-sm px-3 py-1">
                <Star className="h-3 w-3 mr-1" /> SOC 2 Certified
              </Badge>
              <Badge className="bg-white/10 text-white/90 border-white/15 text-[10px] backdrop-blur-sm px-3 py-1">
                <Database className="h-3 w-3 mr-1" /> 99.9% Uptime
              </Badge>
            </div>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/15">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  !isYearly
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isYearly
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        {!isLoading && profile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
              profile.betaActive
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              {profile.betaActive ? (
                <><CheckIcon className="w-3.5 h-3.5" /> You have active beta access!</>
              ) : (
                <><Crown className="w-3.5 h-3.5" /> Choose a plan to unlock full features</>
              )}
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {getPlans().map((plan, idx) => {
            const style = planStyles[plan.name]
            const PlanIcon = style.Icon
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-sm relative overflow-hidden flex flex-col ${
                  plan.popular
                    ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-200/50 dark:ring-blue-800/30'
                    : 'border-gray-200/80 dark:border-gray-700/80'
                }`}
              >
                {/* Plan Badge */}
                <div className={`bg-gradient-to-r ${style.gradient} text-white text-center py-2 text-[10px] font-bold uppercase tracking-widest`}>
                  {plan.badge}
                </div>

                {/* Plan Header */}
                <div className="text-center px-5 pt-5 pb-3">
                  <div className={`w-12 h-12 mx-auto mb-3 ${style.iconBg} rounded-xl flex items-center justify-center`}>
                    <PlanIcon className={`h-6 w-6 ${style.iconColor}`} />
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-baseline justify-center gap-1.5">
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{plan.price}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <Badge className="mt-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-2 py-0.5">
                        Save {Math.round((1 - parseInt(plan.price.replace('$', '')) / parseInt(plan.originalPrice.replace('$', ''))) * 100)}%
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{plan.description}</p>
                </div>

                {/* Features List */}
                <div className="px-5 pb-4 flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.checkColor}`} />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="px-5 pb-5">
                  <Button
                    onClick={() => handleSubscribe(plan.priceId!, plan.name)}
                    disabled={loading === plan.priceId || (profile?.betaActive && plan.name === 'Beta Access')}
                    className={`w-full rounded-xl h-10 text-sm font-semibold transition-all duration-200 ${
                      profile?.betaActive && plan.name === 'Beta Access'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : `bg-gradient-to-r ${style.accentGradient} text-white shadow-sm hover:shadow-md`
                    }`}
                  >
                    {loading === plan.priceId ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing...</>
                    ) : profile?.betaActive && plan.name === 'Beta Access' ? (
                      <><CheckIcon className="w-4 h-4 mr-1.5" /> Current Plan</>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>

                  {plan.popular && (
                    <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-semibold mt-2">
                      Most popular choice for clinicians
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Why Choose ClinicalScribe */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-t-2xl" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center mb-5">
            Why Choose ClinicalScribe?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featureItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className={`w-10 h-10 mx-auto mb-2 ${item.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pb-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Questions? Contact us at{' '}
            <a href="mailto:support@clinicalscribe.com" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              support@clinicalscribe.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
