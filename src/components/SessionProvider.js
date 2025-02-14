'use client'

import { SessionProvider as NextAuthProvider } from 'next-auth/react'

export default function SessionProvider({ children, session }) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>
} 