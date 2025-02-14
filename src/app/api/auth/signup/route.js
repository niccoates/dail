import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import redis from '@/lib/redis'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await redis.hgetall(`user:${email}`)
    if (existingUser?.email) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Store user in Redis (now without name)
    await redis.hset(`user:${email}`, {
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json(
      { success: true, email },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 