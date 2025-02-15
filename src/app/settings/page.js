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
    <div className="h-screen grid grid-cols-[1fr_minmax(auto,_50%)_1fr] grid-rows-[1fr_auto_1fr] overflow-hidden m-0 p-0 absolute inset-0">
      {/* Top Row */}
      <div className="col-span-3 border-b border-[#E5E7EB] border-dashed">
        <div className="h-full grid grid-cols-[1fr_minmax(auto,_50%)_1fr]">
          <div className="col-span-1" />
          <div className="col-span-1 border-l border-r border-[#E5E7EB] border-dashed" />
          <div className="col-span-1" />
        </div>
      </div>

      {/* Middle Row - Main Content */}
      <div className="col-span-1 flex items-center justify-center">
        <Link href="/" className="text-gray-300 hover:text-gray-600">
          <svg width="70" height="70" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13.25 8.75L9.75 12L13.25 15.25" />
          </svg>
        </Link>
      </div>
      <div className="col-span-1 border-x border-[#E5E7EB] border-dashed bg-white">
        <div className="w-full max-w-2xl mx-auto p-8">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
              <p className="mt-1 text-sm text-gray-600">
                Update your account settings and manage your profile.
              </p>
            </div>

            {message.text && (
              <div className={`p-4 rounded-md ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex items-center space-x-6">
              <div className="relative h-24 w-24">
                <Image
                  src={photoUrl || '/placeholder.png'}
                  alt="Profile photo"
                  className="rounded-full object-cover"
                  fill
                  priority
                />
                {photoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or GIF (max. 2MB)
                </p>
              </div>
            </div>

            {/* Profile Information */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>

            {/* Change Password */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Change password</h3>
              <form onSubmit={handleUpdatePassword} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Current password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1" />

      {/* Bottom Row */}
      <div className="col-span-3 border-t border-[#E5E7EB] border-dashed">
        <div className="h-full grid grid-cols-[1fr_minmax(auto,_50%)_1fr]">
          <div className="col-span-1" />
          <div className="col-span-1 border-l border-r border-[#E5E7EB] border-dashed" />
          <div className="col-span-1" />
        </div>
      </div>
    </div>
  )
} 