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

  try {
    // Get both labels and events for the specified month
    const labels = await redis.hgetall(`labels:${session.user.email}:${year}-${month}`)
    const events = await redis.hgetall(`events:${session.user.email}:${year}-${month}`)

    return NextResponse.json({
      labels: labels || {},  // Return empty object if null
      events: events || {}   // Return empty object if null
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
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

    if (type === 'label') {
      // Store label
      await redis.hset(
        `labels:${session.user.email}:${year}-${month}`,
        { [date]: data }  // Now storing { text: string, color: string }
      )
    } else if (type === 'event') {
      // Get existing events for the date
      const existingEvents = await redis.hget(`events:${session.user.email}:${year}-${month}`, date)
      let eventsArray = []
      
      try {
        if (existingEvents) {
          // Handle both string and object formats
          if (typeof existingEvents === 'string') {
            try {
              const parsed = JSON.parse(existingEvents)
              eventsArray = Array.isArray(parsed) ? parsed : [parsed]
            } catch {
              // If parsing fails, try to use the raw value
              eventsArray = [existingEvents]
            }
          } else {
            // Handle case where Redis returns an object
            eventsArray = Array.isArray(existingEvents) ? existingEvents : [existingEvents]
          }
        }
        
        // Create new event object
        const newEvent = {
          startTime: data.startTime,
          endTime: data.endTime,
          title: data.title,
          createdAt: new Date().toISOString()
        }

        // Add new event to array
        eventsArray.push(newEvent)

        // Store updated events array
        const eventString = JSON.stringify(eventsArray)
        await redis.hset(
          `events:${session.user.email}:${year}-${month}`,
          {
            [date]: eventString
          }
        )
      } catch (error) {
        console.error('Event processing error:', error, { 
          existingEvents,
          existingEventsType: typeof existingEvents,
          existingEventsIsArray: Array.isArray(existingEvents)
        })
        throw new Error('Failed to process events: ' + error.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message },
      { status: 500 }
    )
  }
} 