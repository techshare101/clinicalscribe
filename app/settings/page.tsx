"use client"

import { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth'
import { UserIcon, CreditCardIcon, ShieldCheckIcon, BellIcon, SaveIcon, CheckCircleIcon, XCircleIcon, Settings, LogOut, Crown, Sparkles, Key, Mail } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const { profile, isLoading } = useProfile()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // Handle Stripe checkout status
  useEffect(() => {
    const status = searchParams?.get('status')
    const sessionId = searchParams?.get('session_id')
    
    if (status) {
      setCheckoutStatus(status)
      
      if (status === 'success') {
        setShowSuccessBanner(true)
        setTimeout(() => {
          toast({
            title: "🎉 Subscription Activated!",
            description: "Welcome to Pro — your access is now unlocked.",
          })
        }, 500)
        
        setMessage({ 
          type: 'success', 
          text: 'Payment successful! Your beta access has been activated. Welcome to ClinicalScribe Pro!' 
        })
        setActiveTab('subscription')
        
        setTimeout(() => {
          setShowSuccessBanner(false)
        }, 15000)
        
        if (sessionId && auth.currentUser) {
          verifyAndActivateBeta(sessionId)
        }
      } else if (status === 'cancelled') {
        setMessage({ 
          type: 'error', 
          text: 'Payment was cancelled. You can try again anytime.' 
        })
        setActiveTab('subscription')
      }
    }
  }, [searchParams, toast])

  const verifyAndActivateBeta = async (sessionId: string) => {
    try {
      console.log('Verifying session:', sessionId)
    } catch (error) {
      console.error('Error verifying session:', error)
    }
  }

  useEffect(() => {
    if (profile && auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        displayName: profile.displayName || auth.currentUser?.displayName || '',
        email: profile.email || auth.currentUser?.email || ''
      }))
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!auth.currentUser || !profile) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      })
      
      const profileRef = doc(db, 'profiles', auth.currentUser.uid)
      await updateDoc(profileRef, {
        displayName: formData.displayName,
        updatedAt: new Date()
      })
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!auth.currentUser || !formData.currentPassword || !formData.newPassword) return
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }
    
    setSaving(true)
    setMessage(null)
    
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        formData.currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, formData.newPassword)
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      
      setMessage({ type: 'success', text: 'Password updated successfully!' })
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password. Please check your current password.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "👋 Signed out successfully",
        description: "You have been logged out safely.",
      })
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "❌ Error signing out",
        description: "Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400 opacity-20"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-12">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <XCircleIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Access Denied</h1>
          <p className="text-gray-600 text-lg">Please log in to access your settings.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon, gradient: 'from-emerald-500 to-green-600' },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon, gradient: 'from-orange-500 to-red-600' },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, gradient: 'from-purple-500 to-pink-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Animated Success Banner */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.6 
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl border-b-4 border-green-400"
          >
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: 0, scale: 1 }}
                    animate={{ 
                      rotate: [0, 15, -15, 0], 
                      scale: [1, 1.2, 1.1, 1] 
                    }}
                    transition={{ duration: 1.5, repeat: 3 }}
                    className="text-4xl"
                  >
                    🎉
                  </motion.div>
                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold"
                    >
                      Subscription Activated — Welcome to Pro!
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-green-100 text-base mt-1"
                    >
                      Your premium features are now unlocked and ready to use. Start creating unlimited SOAP notes!
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-green-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-3xl shadow-2xl ring-4 ring-indigo-200/50">
                <Settings className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent drop-shadow-sm">
                Account Settings
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                  <UserIcon className="h-3 w-3 mr-1" />
                  Profile
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Personalization
                </Badge>
                {profile.betaActive && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro Member
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Manage your account preferences, security settings, and 
            <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">subscription details</span>
          </motion.p>
        </motion.div>

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl border border-white/50 transition-all duration-500 overflow-hidden">
            
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30"
                  >
                    <Settings className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-black text-white">Account Settings</h1>
                    <p className="text-indigo-100 font-medium text-lg">Customize your ClinicalScribe experience</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white font-semibold hover:bg-white/30 transition-all duration-300 ring-2 ring-white/30 hover:ring-white/50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </motion.button>
              </div>
            </div>

            {/* Large Success Celebration Section */}
            {checkoutStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="m-8"
              >
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5 rounded-3xl" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 300 }}
                    className="text-8xl mb-6 relative"
                  >
                    🎆🎉🎆
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-4xl font-black bg-gradient-to-r from-emerald-800 to-green-700 bg-clip-text text-transparent mb-4"
                  >
                    Payment Successful!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="text-xl text-emerald-700 mb-8 max-w-2xl mx-auto leading-relaxed"
                  >
                    Your ClinicalScribe Pro subscription is now active. 
                    Start creating unlimited SOAP notes and enjoy all premium features!
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="flex items-center justify-center gap-6 text-emerald-700"
                  >
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-semibold">Unlimited transcriptions</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-semibold">Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-semibold">Advanced features</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Message Display */}
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`m-8 p-6 rounded-3xl border-2 backdrop-blur-sm ${
                  message.type === 'success' 
                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50/80 text-red-700 border-red-200'
                }`}>
                <div className="flex items-center gap-3">
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <XCircleIcon className="w-6 h-6" />
                  )}
                  <span className="font-semibold text-lg">{message.text}</span>
                </div>
              </motion.div>
            )}

            <div className="flex">
              {/* Enhanced Sidebar */}
              <div className="w-80 bg-gradient-to-b from-slate-50/50 to-blue-50/50 backdrop-blur-sm border-r border-white/30">
                <div className="p-8">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Settings Menu
                  </h3>
                  <nav className="space-y-3">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-4 px-6 py-4 text-left rounded-2xl transition-all duration-300 group ${
                            activeTab === tab.id
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg ring-2 ring-white/20`
                              : 'text-gray-700 hover:bg-white/70 hover:shadow-md border border-gray-200/50'
                          }`}
                        >
                          <div className={`p-2 rounded-xl transition-colors ${
                            activeTab === tab.id 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold">{tab.label}</span>
                          {activeTab === tab.id && (
                            <motion.div
                              layoutId="activeTab"
                              className="ml-auto w-2 h-2 bg-white rounded-full"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Enhanced Content Area */}
              <div className="flex-1 p-10">
                <AnimatePresence mode="wait">
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">Profile Information</h2>
                          <p className="text-gray-600">Update your personal details and preferences</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                            placeholder="Enter your display name"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl bg-gray-50/70 backdrop-blur-sm text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            Email cannot be changed for security reasons
                          </p>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Account Status
                          </label>
                          <div className="flex items-center gap-3">
                            <Badge className={`px-4 py-2 text-sm font-bold border-0 ${
                              profile.role === 'admin' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                            }`}>
                              {profile.role === 'admin' ? '👑 Administrator' : '👤 User'}
                            </Badge>
                            {profile.betaActive && (
                              <Badge className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">
                                ✨ Beta Access Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <SaveIcon className="w-5 h-5" />
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                      </motion.button>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
                          <Key className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">Security Settings</h2>
                          <p className="text-gray-600">Update your password and security preferences</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-8 max-w-lg">
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                            placeholder="Enter current password"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            New Password
                          </label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                            placeholder="Enter new password"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <motion.button
                        onClick={handleChangePassword}
                        disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Key className="w-5 h-5" />
                        {saving ? 'Updating Password...' : 'Update Password'}
                      </motion.button>
                    </motion.div>
                  )}

                  {activeTab === 'subscription' && (
                    <motion.div
                      key="subscription"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl">
                          <CreditCardIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">Subscription Management</h2>
                          <p className="text-gray-600">Manage your billing and subscription preferences</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5 rounded-3xl" />
                        <div className="relative flex items-center gap-4 mb-6">
                          <div className="p-3 bg-emerald-500/20 rounded-2xl">
                            <Crown className="h-6 w-6 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-black text-emerald-900">Current Plan Status</h3>
                        </div>
                        <div className="relative flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <Badge className={`px-6 py-3 text-lg font-black border-0 shadow-lg ${
                              profile.betaActive 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                            }`}>
                              {profile.betaActive ? '✨ Pro Member - Active' : '📝 Basic Plan'}
                            </Badge>
                            {profile.betaActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 text-emerald-600"
                              >
                                <CheckCircleIcon className="w-6 h-6" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <p className={`mt-4 text-lg leading-relaxed ${
                          profile.betaActive ? 'text-emerald-700' : 'text-gray-700'
                        }`}>
                          {profile.betaActive ? (
                            '🎉 You have full Pro access with unlimited SOAP notes, AI transcription, EHR integration, and priority support!'
                          ) : (
                            'Upgrade to Pro to unlock unlimited AI transcription, SOAP generation, EHR integration, and advanced features.'
                          )}
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <Sparkles className="h-6 w-6 text-purple-500" />
                          <h3 className="text-xl font-black text-gray-900">Available Plans</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white/80 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-100 rounded-xl">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <h4 className="text-xl font-black text-gray-900">Professional</h4>
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-2">$29<span className="text-lg font-normal text-gray-500">/month</span></p>
                            <ul className="space-y-3 text-gray-700">
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Unlimited transcriptions</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>EHR integration</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>PDF export</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Priority support</span>
                              </li>
                            </ul>
                          </div>
                          <div className="bg-white/80 backdrop-blur-xl border-2 border-purple-200 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-1 relative">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 px-4 py-1 font-bold">
                                🚀 Popular
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-purple-100 rounded-xl">
                                <Crown className="h-5 w-5 text-purple-600" />
                              </div>
                              <h4 className="text-xl font-black text-gray-900">Enterprise</h4>
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-2">$99<span className="text-lg font-normal text-gray-500">/month</span></p>
                            <ul className="space-y-3 text-gray-700">
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Everything in Professional</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Advanced analytics</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Custom integrations</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Dedicated support</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => window.open('/pricing', '_blank')}
                        disabled={profile.betaActive}
                        whileHover={{ scale: profile.betaActive ? 1 : 1.02, y: profile.betaActive ? 0 : -2 }}
                        whileTap={{ scale: profile.betaActive ? 1 : 0.98 }}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
                          profile.betaActive
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        <CreditCardIcon className="w-5 h-5" />
                        {profile.betaActive ? 'Already Subscribed ✨' : 'Manage Subscription'}
                      </motion.button>
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                          <BellIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">Notification Preferences</h2>
                          <p className="text-gray-600">Customize how and when you receive notifications</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {[
                          {
                            title: 'Email Notifications',
                            description: 'Receive important updates about your account via email',
                            icon: '📧',
                            gradient: 'from-blue-500 to-indigo-600'
                          },
                          {
                            title: 'Transcription Complete',
                            description: 'Get notified when your AI transcriptions are ready',
                            icon: '🎯',
                            gradient: 'from-emerald-500 to-green-600'
                          },
                          {
                            title: 'EHR Export Updates',
                            description: 'Notifications about EHR integration and export status',
                            icon: '🏥',
                            gradient: 'from-purple-500 to-pink-600'
                          },
                          {
                            title: 'Security Alerts',
                            description: 'Important security notifications and login alerts',
                            icon: '🔒',
                            gradient: 'from-orange-500 to-red-600'
                          }
                        ].map((notification, index) => (
                          <motion.div
                            key={notification.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 bg-gradient-to-br ${notification.gradient} rounded-2xl text-white text-lg font-bold flex items-center justify-center`}>
                                {notification.icon}
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-gray-900">{notification.title}</h3>
                                <p className="text-gray-600 mt-1">{notification.description}</p>
                              </div>
                            </div>
                            <motion.label 
                              className="relative inline-flex items-center cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <input
                                type="checkbox"
                                defaultChecked
                                className="sr-only peer"
                              />
                              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                            </motion.label>
                          </motion.div>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <SaveIcon className="w-5 h-5" />
                        Save Notification Preferences
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}