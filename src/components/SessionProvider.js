'use client'

import { SessionProvider as NextAuthProvider } from 'next-auth/react'

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthProvider>
  )
} 