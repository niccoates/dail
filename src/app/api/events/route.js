import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import redis from '@/lib/redis'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const yearMonth = `${year}-${month}`

  try {
    // Get data using separate methods for each type
    const [labels, events, birthdays] = await Promise.all([
      redis.getLabels(session.user.email, yearMonth),
      redis.getEvents(session.user.email, yearMonth),
      redis.getBirthdays(session.user.email, yearMonth)
    ])

    return NextResponse.json({
      labels: labels || {},
      events: events || {},
      birthdays: birthdays || {}
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { date, type, data } = await req.json()
    const [year, month] = date.split('-')
    const yearMonth = `${year}-${month}`

    if (type === 'label') {
      await redis.setLabels(session.user.email, yearMonth, date, data)
    } else if (type === 'birthday') {
      await redis.setBirthdays(session.user.email, yearMonth, date, data)
    } else if (type === 'event') {
      // Get existing events
      const existingEvents = await redis.getEvents(session.user.email, yearMonth)
      let eventsArray = []
      
      try {
        if (existingEvents?.[date]) {
          // Handle both string and object cases
          const events = existingEvents[date]
          if (typeof events === 'string') {
            try {
              const parsed = JSON.parse(events)
              eventsArray = Array.isArray(parsed) ? parsed : [parsed]
            } catch (e) {
              // If JSON parsing fails, try to use the value directly
              eventsArray = Array.isArray(events) ? events : [events]
            }
          } else {
            // Handle non-string case
            eventsArray = Array.isArray(events) ? events : [events]
          }
        }
        
        if (data.createdAt) {
          // Update existing event
          eventsArray = eventsArray.map(event => 
            event.createdAt === data.createdAt ? data : event
          )
        } else {
          // Add new event
          eventsArray.push({
            ...data,
            createdAt: new Date().toISOString()
          })
        }

        // Store updated events
        await redis.setEvents(session.user.email, yearMonth, date, eventsArray)
      } catch (error) {
        console.error('Event processing error:', error)
        throw new Error('Failed to process events')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
} 