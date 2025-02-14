import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Calendar from '@/components/Calendar/Calendar'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <main className="h-screen grid grid-cols-[1fr_minmax(auto,_50%)_1fr] grid-rows-[1fr_auto_1fr] overflow-hidden m-0 p-0 absolute inset-0">
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
          <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-8">
            <div className="flex items-center space-x-4">
              <Image src="/dail.svg" alt="Dail Logo" width={48} height={48} />
              <span className="text-4xl font-bold text-gray-900">Dail</span>
            </div>
            <h1 className="text-5xl font-bold text-center text-gray-900 max-w-lg">
              Your time, beautifully organized
            </h1>
            <p className="text-xl text-gray-500 text-center max-w-md">
              A minimal calendar for the modern web. Simple, elegant, and designed for focus.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="/sign-in"
                className="px-6 py-3 text-base font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/sign-up"
                className="px-6 py-3 text-base font-medium text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Sign up
              </Link>
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
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8">
      <Calendar />
    </main>
  )
}
