'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignIn() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.target)
    
    try {
      const result = await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirect: false,
      })

      if (result.error) {
        throw new Error('Invalid email or password')
      }

      // Redirect to root
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
      <div className="col-span-1" />
      <div className="col-span-1 border-x border-[#E5E7EB] border-dashed bg-white">
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-left">
              <Link href="/" className="inline-flex items-center space-x-4 mb-6">
                <Image src="/dail.svg" alt="Dail Logo" width={30} height={30} />
              </Link>
              <h2 className="text-2xl font-semibold text-gray-800">
              Sign in to your account
              </h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-2 text-base font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <div className="text-sm text-center text-gray-500">
                Don't have an account?{' '}
                <Link href="/sign-up" className="font-medium text-gray-900 hover:text-gray-800">
                  Sign up
                </Link>
              </div>
            </form>
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