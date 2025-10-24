"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Zap, 
  Shield, 
  FileText, 
  Star, 
  CheckIcon, 
  Database,
  Headphones,
  Clock,
  Users,
  Award,
  Sparkles
} from 'lucide-react'

const features = [
  { 
    icon: <Zap className="h-6 w-6 text-blue-600" />, 
    title: "AI-Powered Transcription",
    description: "Convert voice recordings to text with 99% accuracy using advanced AI models"
  },
  { 
    icon: <FileText className="h-6 w-6 text-green-600" />, 
    title: "SOAP Note Generation",
    description: "Automatically generate structured clinical notes following SOAP format standards"
  },
  { 
    icon: <Shield className="h-6 w-6 text-purple-600" />, 
    title: "Secure PDF Export",
    description: "Export notes as encrypted, watermarked PDFs with digital signature support"
  },
  { 
    icon: <Database className="h-6 w-6 text-orange-600" />, 
    title: "EHR Integration",
    description: "Seamlessly connect with Epic, Cerner, and other major EHR systems via SMART on FHIR"
  },
  { 
    icon: <Clock className="h-6 w-6 text-red-600" />, 
    title: "Real-Time Processing",
    description: "Process recordings and generate notes in seconds, not minutes"
  },
  { 
    icon: <Users className="h-6 w-6 text-indigo-600" />, 
    title: "Multi-User Support",
    description: "Team collaboration features with role-based access and shared workflows"
  }
]

const benefits = [
  "✅ Save 3+ hours per day on documentation",
  "✅ Reduce documentation errors by 85%",
  "✅ HIPAA compliant with enterprise-grade security",
  "✅ Works with any device - desktop, tablet, mobile",
  "✅ 24/7 priority support from clinical documentation experts",
  "✅ Free training and onboarding for your entire team"
]

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Crown className="h-16 w-16 text-blue-600" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Unlock ClinicalScribe
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Beta Access</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your clinical documentation with AI-powered transcription, 
            automated SOAP note generation, and seamless EHR integration.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 1000+ Clinicians
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              SOC 2 Certified
            </Badge>
          </div>
        </div>

        {/* Main CTA Card */}
        <div className="max-w-4xl mx-auto mb-20">
          <Card className="border-2 border-blue-200 shadow-2xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
                Beta Access
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  LIMITED TIME
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-4">
                Get full access to all ClinicalScribe features and help shape the future of clinical documentation
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Why Choose ClinicalScribe?
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-600 font-semibold">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center space-y-6 pt-6">
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">
                    Start Your Journey Today
                  </p>
                  <p className="text-gray-600">
                    Join thousands of healthcare professionals already saving hours daily
                  </p>
                </div>
                
                <Link href="/pricing">
                  <Button 
                    size="lg"
                    className="text-lg px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Crown className="mr-3 h-5 w-5" />
                    Upgrade Now
                  </Button>
                </Link>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>🔒 Secure payment powered by Stripe • Cancel anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Trusted by Healthcare Professionals Worldwide
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <Headphones className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Expert help when you need it most</p>
            </div>
            <div>
              <Shield className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise Security</h3>
              <p className="text-sm text-gray-600">Bank-grade encryption and compliance</p>
            </div>
            <div>
              <Zap className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Process notes in seconds, not minutes</p>
            </div>
            <div>
              <Star className="w-12 h-12 mx-auto text-orange-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">5-Star Rated</h3>
              <p className="text-sm text-gray-600">Loved by clinicians everywhere</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center mt-16">
          <p className="text-gray-600">
            Questions? Contact our team at{' '}
            <a href="mailto:support@clinicalscribe.com" className="text-blue-600 hover:underline font-semibold">
              support@clinicalscribe.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
