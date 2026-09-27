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

// Language configurations for patient language (Whisper-supported languages)
const patientLanguages = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  // Whisper-supported languages (100+)
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "hmn", name: "Hmong", flag: "🇱🇦" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "tw", name: "Twi", flag: "🇬🇭" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "isiXhosa", flag: "🇿🇦" },
];

export default function SettingsPageInner() {
  const { profile, isLoading } = useProfile()
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
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  // Safely get search params on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search))
    }
  }, [])

  // Handle Stripe checkout status
  useEffect(() => {
    if (!searchParams) return
    
    const status = searchParams.get('status')
    const sessionId = searchParams.get('session_id')
    
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
      
      // Navigate back to the previous page after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
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
      
      // Navigate back to the previous page after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
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
      <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Access Denied</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please log in to access your settings.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon, iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' }
  ]

  const inputClasses = "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:ring-blue-400/40 dark:focus:border-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      {/* Success Banner */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white"
          >
            <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-bold">Subscription Activated — Welcome to Pro!</p>
                  <p className="text-xs text-emerald-100">Your premium features are now unlocked.</p>
                </div>
              </div>
              <button onClick={() => setShowSuccessBanner(false)} className="text-white/70 hover:text-white p-1">
                <XCircleIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-5">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-pink-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <div className="relative px-6 py-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl ring-1 ring-white/25 shadow-lg">
                  <Settings className="h-6 w-6 drop-shadow" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm">Account Settings</h1>
                  <p className="text-purple-100/70 text-xs sm:text-sm mt-0.5 font-medium">Customize your ClinicalScribe experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                  <UserIcon className="h-3 w-3 mr-1" /> Profile
                </Badge>
                <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 mr-1" /> Personalization
                </Badge>
                {profile.betaActive && (
                  <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                    <Crown className="h-3 w-3 mr-1" /> Pro Member
                  </Badge>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg text-white text-xs font-semibold transition-all border border-white/20">
                  <LogOut className="h-3 w-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="flex flex-col md:flex-row gap-5">
          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="w-full md:w-56 shrink-0">
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-t-2xl" />
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 pt-2 pb-2">Settings Menu</p>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        activeTab === tab.id
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg ${activeTab === tab.id ? tab.iconBg : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.iconColor : 'text-gray-400 dark:text-gray-500'}`} />
                      </span>
                      {tab.label}
                      {activeTab === tab.id && <motion.div layoutId="settingsTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Profile Information</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update your personal details and preferences</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" /> Display Name
                        </label>
                        <input type="text" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} className={inputClasses} placeholder="e.g. John Doe (optional)" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <Mail className="w-3 h-3 text-gray-400" /> Email Address
                        </label>
                        <input type="email" value={formData.email} disabled className={`${inputClasses} bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed`} />
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Email cannot be changed for security reasons
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <Crown className="w-3 h-3 text-amber-500" /> Account Status
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] px-2 py-0.5 font-bold border-0 ${
                            profile.role === 'system-admin' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                              : profile.role === 'nurse-admin' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          }`}>
                            {profile.role === 'system-admin' ? 'System Administrator' : profile.role === 'nurse-admin' ? 'Nurse Administrator' : 'Nurse'}
                          </Badge>
                          {profile.betaActive && (
                            <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">Beta Access Active</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 bg-purple-500 rounded-full" /> Preferred Language
                        </label>
                        <select
                          value={profile.languagePref || "en"}
                          onChange={async (e) => {
                            if (auth.currentUser) {
                              setSaving(true);
                              try {
                                await updateDoc(doc(db, "profiles", auth.currentUser.uid), { languagePref: e.target.value, updatedAt: new Date() });
                                setFormData(prev => ({ ...prev }));
                                setMessage({ type: 'success', text: 'Language preference updated successfully!' });
                                setTimeout(() => { router.back(); }, 1500);
                              } catch (error) {
                                console.error('Error updating language preference:', error);
                                setMessage({ type: 'error', text: 'Failed to update language preference. Please try again.' });
                              } finally { setSaving(false); }
                            }
                          }}
                          className={inputClasses}
                        >
                          {patientLanguages.map((lang) => (<option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>))}
                        </select>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Select your preferred language for clinical notes and interface text.</p>
                      </div>
                    </div>
                    {message && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        {message.type === 'success' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                        {message.text}
                      </motion.div>
                    )}
                    <button onClick={handleSaveProfile} disabled={saving}
                      className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
                      <SaveIcon className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                        <Key className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Security Settings</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update your password and security preferences</p>
                      </div>
                    </div>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 bg-orange-500 rounded-full" /> Current Password
                        </label>
                        <input type="password" value={formData.currentPassword} onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))} className={inputClasses} placeholder="Enter current password" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" /> New Password
                        </label>
                        <input type="password" value={formData.newPassword} onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))} className={inputClasses} placeholder="Enter new password" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" /> Confirm New Password
                        </label>
                        <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} className={inputClasses} placeholder="Confirm new password" />
                      </div>
                    </div>
                    {message && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        {message.type === 'success' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                        {message.text}
                      </motion.div>
                    )}
                    <button onClick={handleChangePassword} disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                      className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
                      <Key className="w-4 h-4" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SUBSCRIPTION TAB */}
              {activeTab === 'subscription' && (
                <motion.div key="subscription" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <CreditCardIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Subscription Plan</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your subscription and billing information</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">ClinicalScribe Pro</h3>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Beta Access &bull; Unlimited Usage</p>
                          </div>
                          <Badge className="bg-emerald-600 text-white border-0 text-[10px] px-2 py-0.5">Active</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-2">Features Included</p>
                            <ul className="space-y-1.5">
                              {['Unlimited SOAP Notes', 'Real-time Transcription', 'EHR Integration', 'Priority Support'].map((f) => (
                                <li key={f} className="flex items-center gap-1.5">
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-xs text-gray-700 dark:text-gray-300">{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-2">Billing</p>
                            <div className="bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-800/30 space-y-1.5">
                              <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Status</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span></div>
                              <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Next Billing</span><span className="font-semibold text-gray-700 dark:text-gray-300">N/A (Beta)</span></div>
                              <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Amount</span><span className="font-bold text-gray-900 dark:text-gray-100">$0.00</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const { handleManageSubscription } = await import("@/lib/subscription");
                                const result = await handleManageSubscription();
                                if (result.noCustomer) {
                                  toast({ title: "No active subscription", description: "Redirecting to plans page..." });
                                  setTimeout(() => { window.location.href = result.url; }, 1500);
                                  return;
                                }
                                window.location.href = result.url;
                              } catch (err) {
                                console.error(err);
                                toast({ title: "Error", description: "Failed to access subscription settings." });
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                          >Manage Subscription</button>
                          <button
                            onClick={async () => {
                              try {
                                const [{ getInvoices }, { InvoiceDialog }] = await Promise.all([import("@/lib/subscription"), import("@/components/invoice-dialog")]);
                                const response = await getInvoices();
                                if (!response.invoices?.length) {
                                  toast({ title: "No invoices available", description: response.message || "You don't have any invoices yet." });
                                  if (response.redirectUrl) { setTimeout(() => { window.location.href = response.redirectUrl; }, 1500); }
                                  return;
                                }
                                const container = document.createElement("div");
                                document.body.appendChild(container);
                                const React = await import("react");
                                const { createRoot } = await import("react-dom/client");
                                const root = createRoot(container);
                                const App = () => {
                                  const [open, setOpen] = React.useState(true);
                                  return (<InvoiceDialog isOpen={open} onClose={() => { setOpen(false); setTimeout(() => root.unmount(), 0); }} invoices={response.invoices} />);
                                };
                                root.render(React.createElement(App));
                              } catch (err) {
                                console.error(err);
                                toast({ title: "Error", description: "Failed to load invoices." });
                              }
                            }}
                            className="px-4 py-2 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all"
                          >View Invoices</button>
                        </div>
                      </div>
                    </div>
                    {message && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                        {message.type === 'success' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                        {message.text}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                        <BellIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notification Preferences</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customize how and when you receive notifications</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Email Notifications</p>
                    <div className="space-y-2">
                      {[
                        { title: 'Account Activity', desc: 'Sign in attempts, password changes' },
                        { title: 'Product Updates', desc: 'New features, beta releases' },
                        { title: 'Weekly Digest', desc: 'Usage reports, tips & tricks' },
                      ].map((item) => (
                        <div key={item.title} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-xl">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.title}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                          <div className="relative w-9 h-5 bg-emerald-500 rounded-full cursor-pointer">
                            <div className="absolute top-0.5 right-0.5 bg-white w-4 h-4 rounded-full shadow-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}