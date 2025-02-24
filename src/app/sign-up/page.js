'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUp() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.target)
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    try {
      // First create the account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')

      // Wait a moment for Redis to complete the write
      await new Promise(resolve => setTimeout(resolve, 500))

      // Then immediately sign in
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        console.error('Sign in error:', signInResult.error)
        throw new Error('Error signing in after account creation')
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
    <div className="fixed inset-0 bg-white dark:bg-black">
      <div className="h-full w-full max-w-[2000px] mx-auto bg-white/90 dark:bg-black/90 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/50 dark:from-black/90 dark:to-black/50 pointer-events-none" />
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Create your account
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start organizing your schedule with Dail
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-lg backdrop-blur-sm bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-white/10 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors backdrop-blur-sm"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>

              <div className="text-sm text-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                </span>
                <Link 
                  href="/sign-in" 
                  className="font-medium text-gray-900 dark:text-white hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Sign in instead
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 