'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function Settings() {
  const { data: session, update: updateSession } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [photoUrl, setPhotoUrl] = useState('/placeholder.png')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
      setPhotoUrl(session.user.image || '/placeholder.png')
    }
  }, [session])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update session with new data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name,
          email
        }
      })
      
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setPasswordLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update password')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: 'Password updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleUpdatePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('photo', file)

    setPhotoLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/user/photo', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to upload photo')
      }

      const { image: newPhotoUrl } = await res.json()
      
      // Update local state immediately
      setPhotoUrl(newPhotoUrl)
      
      // Update session with new image URL
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: newPhotoUrl
        }
      })
      
      setMessage({ type: 'success', text: 'Photo updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setPhotoLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-black">
      <div className="h-full w-full max-w-[2000px] mx-auto bg-white/90 dark:bg-black/90 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/50 dark:from-black/90 dark:to-black/50 pointer-events-none" />
        
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 relative">
              <Image 
                src={session?.user?.image || '/placeholder.png'} 
                alt={session?.user?.name || 'Profile'} 
                className="rounded-full object-cover ring-2 ring-white/20 dark:ring-black/20"
                fill
                priority
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">{session?.user?.name}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {message.text && (
              <div className={`p-4 rounded-lg backdrop-blur-sm ${
                message.type === 'error' 
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20' 
                  : 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Section */}
            <div className="space-y-6 mt-12">
              <div className="flex items-center space-x-6">
                <div className="relative h-24 w-24">
                  <Image
                    src={photoUrl}
                    alt="Profile photo"
                    className="rounded-full object-cover ring-2 ring-white/20 dark:ring-black/20"
                    fill
                    priority
                  />
                  {photoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm">
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {photoLoading ? 'Uploading...' : 'Change photo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpdatePhoto}
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors backdrop-blur-sm"
                  >
                    {profileLoading ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="pt-8 border-t border-gray-200/50 dark:border-white/10">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Change password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Current password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    New password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors backdrop-blur-sm"
                  >
                    {passwordLoading ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 