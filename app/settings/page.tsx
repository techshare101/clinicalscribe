"use client"

import { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { UserIcon, CreditCardIcon, ShieldCheckIcon, BellIcon, SaveIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { profile, isLoading } = useProfile()
  const searchParams = useSearchParams()
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
        // Show animated banner
        setShowSuccessBanner(true)
        
        // Show toast notification immediately
        setTimeout(() => {
          toast({
            title: "🎉 Subscription Activated!",
            description: "Welcome to Pro — your access is now unlocked.",
          })
        }, 500) // Small delay to ensure page is loaded
        
        setMessage({ 
          type: 'success', 
          text: 'Payment successful! Your beta access has been activated. Welcome to ClinicalScribe Pro!' 
        })
        setActiveTab('subscription')
        
        // Auto-hide banner after 15 seconds (longer for demo)
        setTimeout(() => {
          setShowSuccessBanner(false)
        }, 15000)
        
        // Optionally verify the session and activate beta access
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
      // This could call a verification endpoint if needed
      // For now, the webhook should handle the activation automatically
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
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      })
      
      // Update Firestore profile
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
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        formData.currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)
      
      // Update password
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access your settings.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and settings</p>
          </div>

          {/* Large Success Celebration Section */}
          {checkoutStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mx-6 mt-6 mb-6"
            >
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 300 }}
                  className="text-6xl mb-4"
                >
                  🎆🎉🎆
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="text-3xl font-bold text-green-800 mb-3"
                >
                  Payment Successful!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="text-lg text-green-700 mb-6"
                >
                  Your ClinicalScribe Pro subscription is now active. 
                  Start creating unlimited SOAP notes and enjoy all premium features!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="flex items-center justify-center gap-4 text-sm text-green-600"
                >
                  <div className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Unlimited transcriptions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Advanced features</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Checkout Status Banner */}
          {checkoutStatus && (
            <div className={`mx-6 mt-4 p-4 rounded-md border ${
              checkoutStatus === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {checkoutStatus === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {checkoutStatus === 'success' 
                    ? '🎉 Payment Successful!' 
                    : 'Payment Cancelled'
                  }
                </span>
              </div>
              <p className="mt-1 text-sm">
                {checkoutStatus === 'success'
                  ? 'Your beta access has been activated! You now have full access to all ClinicalScribe features.'
                  : 'Your payment was cancelled. You can try upgrading again anytime.'
                }
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your display name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          profile.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {profile.role || 'User'}
                        </span>
                        {profile.betaActive && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            Beta Access
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SaveIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  
                  <div className="grid grid-cols-1 gap-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SaveIcon className="w-4 h-4" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Current Plan</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-blue-700">
                        {profile.betaActive ? 'Beta Access - Active' : 'Basic Plan'}
                      </p>
                      {profile.betaActive && (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {profile.betaActive ? (
                      <p className="text-sm text-blue-600 mt-1">
                        🎉 You have full beta access with all features available!
                      </p>
                    ) : (
                      <p className="text-sm text-blue-600 mt-1">
                        Upgrade to unlock AI transcription, SOAP generation, and EHR integration.
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Available Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-md p-4">
                        <h4 className="font-medium text-gray-900">Professional</h4>
                        <p className="text-2xl font-bold text-gray-900 mt-2">$29<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          <li>• Unlimited transcriptions</li>
                          <li>• EHR integration</li>
                          <li>• PDF export</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                      <div className="border border-gray-200 rounded-md p-4">
                        <h4 className="font-medium text-gray-900">Enterprise</h4>
                        <p className="text-2xl font-bold text-gray-900 mt-2">$99<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          <li>• Everything in Professional</li>
                          <li>• Advanced analytics</li>
                          <li>• Custom integrations</li>
                          <li>• Dedicated support</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open('/pricing', '_blank')}
                    disabled={profile.betaActive}
                    className={`px-4 py-2 rounded-md font-medium ${
                      profile.betaActive
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {profile.betaActive ? 'Already Subscribed' : 'Manage Subscription'}
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive updates about your account</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Transcription Complete</h3>
                        <p className="text-sm text-gray-600">Get notified when transcriptions are ready</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">EHR Export Updates</h3>
                        <p className="text-sm text-gray-600">Notifications about EHR integration status</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save Preferences
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}