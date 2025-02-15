import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import redis from '@/lib/redis'
import cloudinary from '@/lib/cloudinary'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('photo')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG and GIF are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'dail/avatars',
      width: 250,
      height: 250,
      crop: 'fill',
      gravity: 'face'
    })

    // Update user data with new photo URL
    const userData = await redis.hget('users', session.user.email)
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle user data parsing
    let user
    try {
      user = typeof userData === 'string' ? JSON.parse(userData) : userData
    } catch (e) {
      return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 })
    }

    user.image = uploadResult.secure_url

    // Save updated user data
    await redis.hset('users', { [session.user.email]: JSON.stringify(user) })
    
    return NextResponse.json({ image: uploadResult.secure_url })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload photo: ' + error.message },
      { status: 500 }
    )
  }
} 