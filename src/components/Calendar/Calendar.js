'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Menu } from '@headlessui/react'
import { useSession, signOut } from 'next-auth/react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns'
import EventPage from '../EventPage/EventPage'
import Image from 'next/image'
import { redirect } from 'next/navigation'

export default function Calendar() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/sign-in')
    },
    refetchOnWindowFocus: false,
    refetchInterval: 0
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [labels, setLabels] = useState({})
  const [events, setEvents] = useState({})
  const [birthdays, setBirthdays] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEvent, setNewEvent] = useState({ 
    startTime: '',
    endTime: '',
    title: ''
  })
  const [showEventPage, setShowEventPage] = useState(false)
  
  // Cache to store fetched months
  const fetchedMonths = useRef(new Set())
  
  // Function to get cache key for a month
  const getMonthKey = useCallback((date) => {
    if (!date) return null
    try {
      return format(date, 'yyyy-MM')
    } catch (error) {
      console.error('Invalid date in getMonthKey:', error)
      return null
    }
  }, [])

  // Optimized fetch function that only fetches if not in cache
  const fetchData = useCallback(async (date) => {
    if (!date) return
    
    try {
      const year = format(date, 'yyyy')
      const month = format(date, 'MM')
      const monthKey = `${year}-${month}`
      
      const res = await fetch(`/api/events?year=${year}&month=${month}`)
      
      if (res.ok) {
        const data = await res.json()
        setLabels(prev => ({
          ...prev,
          ...data.labels
        }))
        setEvents(prev => ({
          ...prev,
          ...data.events
        }))
        setBirthdays(prev => ({
          ...prev,
          ...data.birthdays
        }))
        // Remove this month from cache so it will be fetched fresh next time
        fetchedMonths.current.delete(monthKey)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }, [])

  // Fetch data for current month and adjacent months
  useEffect(() => {
    const fetchAdjacentMonths = async () => {
      // Fetch current month
      await fetchData(currentDate)
      // Fetch next month
      await fetchData(addMonths(currentDate, 1))
      // Fetch previous month
      await fetchData(subMonths(currentDate, 1))
    }
    
    fetchAdjacentMonths()
  }, [currentDate, fetchData])

  // Get all dates for the current month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Get all days including those from previous/next month to fill the calendar
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1))
  }, [])

  const handleDayClick = useCallback((day) => {
    setSelectedDate(day)
    setShowEventPage(true)
  }, [])

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'event',
          data: newEvent
        })
      })

      if (!res.ok) {
        throw new Error('Failed to add event')
      }

      // Update local state after successful server update
      setEvents(prev => {
        const existingEvents = prev[dateStr] ? JSON.parse(prev[dateStr]) : []
        return {
          ...prev,
          [dateStr]: JSON.stringify([...existingEvents, { ...newEvent, createdAt: new Date().toISOString() }])
        }
      })

      setNewEvent({ startTime: '', endTime: '', title: '' })
      setIsAddingEvent(false)
      
      // Refresh data from server
      await fetchData(currentDate)
    } catch (error) {
      console.error('Failed to add event:', error)
      alert('Failed to add event: ' + error.message)
      // Refresh data from server in case of error
      await fetchData(currentDate)
    }
  }

  const handleAddLabel = async (labelData) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'label',
          data: {
            text: labelData.text,
            color: labelData.color
          }
        })
      })

      if (res.ok) {
        // Update local state with the new label
        setLabels(prev => ({
          ...prev,
          [dateStr]: {
            text: labelData.text,
            color: labelData.color
          }
        }))
        // Refresh data to ensure consistency
        await fetchData(currentDate)
      } else {
        throw new Error('Failed to add label')
      }
    } catch (error) {
      console.error('Failed to add label:', error)
      await fetchData(currentDate)
    }
  }

  const handleAddBirthday = async (birthdayData) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'birthday',
          data: {
            name: birthdayData.name
          }
        })
      })

      if (res.ok) {
        // Update local state with the new birthday
        setBirthdays(prev => ({
          ...prev,
          [dateStr]: {
            name: birthdayData.name
          }
        }))
        // Refresh data to ensure consistency
        await fetchData(currentDate)
      } else {
        throw new Error('Failed to add birthday')
      }
    } catch (error) {
      console.error('Failed to add birthday:', error)
      await fetchData(currentDate)
    }
  }

  // Create weeks array for grid display
  const weeks = []
  let week = []
  days.forEach((day) => {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  })

  return (
    <div className="fixed inset-0 bg-white dark:bg-black">
      <div className="h-full w-full max-w-[2000px] mx-auto bg-white/90 dark:bg-black/90 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/50 dark:from-black/90 dark:to-black/50 pointer-events-none" />
        
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="md:w-6 md:h-6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="md:w-6 md:h-6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="w-8 h-8 relative">
                <Image 
                  src={session?.user?.image || '/dail.png'} 
                  alt={session?.user?.name || 'Profile'} 
                  width={32} 
                  height={32} 
                  className="rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png'
                  }}
                />
              </div>
              <span className="text-gray-700 dark:text-gray-200 hidden md:inline">{session?.user?.name}</span>
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/settings"
                    className={`${
                      active ? 'bg-black/5 dark:bg-white/10' : ''
                    } block px-4 py-2 text-gray-700 dark:text-gray-200`}
                  >
                    Settings
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => signOut()}
                    className={`${
                      active ? 'bg-black/5 dark:bg-white/10' : ''
                    } w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200`}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>

        {/* Calendar Grid */}
        <div className="relative z-10 p-2 md:p-6 flex-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1.5 h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
            {days.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayEvents = (() => {
                try {
                  const eventData = events[dateStr]
                  if (!eventData) return []
                  return typeof eventData === 'string' ? JSON.parse(eventData) : eventData
                } catch (error) {
                  console.error('Failed to parse events for date:', dateStr, error)
                  return []
                }
              })()
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[2.5rem] p-0.5 rounded-lg border transition-all backdrop-blur-sm
                    ${isCurrentMonth 
                      ? 'border-white/10 hover:border-white/20' 
                      : 'border-transparent text-gray-400 dark:text-gray-600'
                    }
                    ${isSelected 
                      ? 'bg-black/10 dark:bg-white/10 border-white/20' 
                      : 'bg-white/50 dark:bg-black/50 hover:bg-black/5 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <div className="h-full flex flex-col">
                    <span className={`
                      text-xs font-medium
                      ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div 
                            key={i}
                            className="h-0.5 rounded-full bg-blue-500/50 dark:bg-blue-400/50 backdrop-blur-sm"
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-gray-500 dark:text-gray-400">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event Page Modal */}
      {showEventPage && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/50 dark:from-black/90 dark:to-black/50 pointer-events-none" />
            <div className="relative z-10 p-8">
              <button
                onClick={() => {
                  setShowEventPage(false)
                  setSelectedDate(null)
                }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm z-10"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <EventPage 
                date={selectedDate} 
                onClose={() => {
                  setShowEventPage(false)
                  setSelectedDate(null)
                }}
                events={events[format(selectedDate, 'yyyy-MM-dd')]}
                labels={labels[format(selectedDate, 'yyyy-MM-dd')]}
                birthdays={birthdays[format(selectedDate, 'yyyy-MM-dd')]}
                onUpdate={fetchData}
                onAddEvent={handleAddEvent}
                onAddLabel={handleAddLabel}
                onAddBirthday={handleAddBirthday}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 