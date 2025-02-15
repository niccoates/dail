import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import redis from '@/lib/redis'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Get user from Redis
          const userData = await redis.hget('users', credentials.email)
          if (!userData) {
            throw new Error('Invalid email or password')
          }

          // Handle user data parsing
          let user
          try {
            user = typeof userData === 'string' ? JSON.parse(userData) : userData
          } catch (e) {
            console.error('User data parsing error:', e, 'userData:', userData)
            throw new Error('Invalid email or password')
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          // Return user without password
          const { password, ...userWithoutPassword } = user
          return userWithoutPassword
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      
      // Handle updates to the session
      if (trigger === 'update') {
        token.name = session?.user?.name ?? token.name
        token.email = session?.user?.email ?? token.email
        token.image = session?.user?.image ?? token.image
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.email = token.email
        session.user.name = token.name
        session.user.image = token.image
      }
      return session
    }
  },
  pages: {
    signIn: '/sign-in',
    signUp: '/sign-up'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 