import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import redis from '@/lib/redis'

export async function PUT(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email } = await req.json()

    // Get current user data
    const userData = await redis.hget('users', session.user.email)
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse user data
    let user
    try {
      user = typeof userData === 'string' ? JSON.parse(userData) : userData
    } catch (e) {
      return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 })
    }

    // Update user data
    user.name = name
    user.email = email

    // If email is being changed, we need to update the Redis key
    if (email !== session.user.email) {
      // Delete old key
      await redis.hdel('users', session.user.email)
      // Set new key
      await redis.hset('users', { [email]: JSON.stringify(user) })
    } else {
      // Just update the existing key
      await redis.hset('users', { [session.user.email]: JSON.stringify(user) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile: ' + error.message },
      { status: 500 }
    )
  }
} 