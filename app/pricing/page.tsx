"use client"

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { auth } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, Crown, Zap, Shield, Star, Users, FileText, Database, Headphones } from 'lucide-react'

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
      const idToken = await auth.currentUser.getIdToken(true)
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          idToken: idToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      alert(`Failed to start subscription: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-6">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-semibold">Choose Your ClinicalScribe Plan</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your practice. Upgrade or downgrade at any time.
            All plans include our core AI-powered features.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              SOC 2 Certified
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-4 py-2">
              <Database className="w-4 h-4 mr-2" />
              99.9% Uptime
            </Badge>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    !isYearly 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isYearly 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {!isLoading && profile && (
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              profile.betaActive 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              {profile.betaActive ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span className="font-medium">You have active beta access!</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">Choose a plan to unlock full features</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {getPlans().map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-2 border-blue-500 shadow-2xl scale-105 bg-gradient-to-br from-white to-blue-50' 
                  : 'border border-gray-200 shadow-lg hover:shadow-xl bg-white'
              }`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-0 right-0 ${plan.badgeColor} text-white text-center py-3 text-sm font-bold tracking-wide`}>
                  {plan.badge}
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.badge ? 'pt-16' : 'pt-8'} pb-4`}>
                <div className="mb-6">
                  {plan.name === 'Beta Access' && (
                    <div className="relative">
                      <Crown className="w-12 h-12 mx-auto text-blue-600" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"></span>
                    </div>
                  )}
                  {plan.name === 'Professional' && <Zap className="w-12 h-12 mx-auto text-purple-600" />}
                  {plan.name === 'Team' && <Users className="w-12 h-12 mx-auto text-green-600" />}
                </div>
                
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">{plan.originalPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <Badge className="mt-2 bg-red-100 text-red-800">
                      Save {Math.round((1 - parseInt(plan.price.replace('$', '')) / parseInt(plan.originalPrice.replace('$', ''))) * 100)}%
                    </Badge>
                  )}

                </div>
                
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.priceId!, plan.name)}
                  disabled={loading === plan.priceId || (profile?.betaActive && plan.name === 'Beta Access')}
                  className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {loading === plan.priceId ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : profile?.betaActive && plan.name === 'Beta Access' ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckIcon className="w-4 h-4" />
                      Current Plan
                    </div>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
                
                {plan.popular && (
                  <p className="text-xs text-center text-blue-600 font-medium">
                    Most popular choice for clinicians
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Why Choose ClinicalScribe?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered SOAP Notes</h3>
              <p className="text-sm text-gray-600">Generate structured clinical notes automatically from voice recordings</p>
            </div>
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">EHR Integration</h3>
              <p className="text-sm text-gray-600">Seamlessly export to Epic, Cerner, and other major EHR systems</p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">HIPAA Compliant</h3>
              <p className="text-sm text-gray-600">Bank-grade security with encrypted storage and transmission</p>
            </div>
            <div className="text-center">
              <Headphones className="w-12 h-12 mx-auto text-orange-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Get help when you need it with our dedicated support team</p>
            </div>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-600">
            Questions? Contact us at{' '}
            <a href="mailto:support@clinicalscribe.com" className="text-blue-600 hover:underline">
              support@clinicalscribe.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}