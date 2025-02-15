import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import redis from '@/lib/redis'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await redis.hget('users', email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user object
    const user = {
      email,
      password: hashedPassword,
      name: email.split('@')[0], // Default name from email
      createdAt: new Date().toISOString(),
      image: null
    }

    try {
      // Store user in Redis as a JSON string
      await redis.hset('users', { [email]: JSON.stringify(user) })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Redis save error:', error)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
} 