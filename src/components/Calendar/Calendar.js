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
    return `${format(date, 'yyyy-MM')}`
  }, [])

  // Optimized fetch function that only fetches if not in cache
  const fetchData = useCallback(async (date) => {
    const monthKey = getMonthKey(date)
    const year = format(date, 'yyyy')
    const month = format(date, 'MM')
    
    try {
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
  }, [getMonthKey])

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

      if (res.ok) {
        // Update local state after successful server update
        setEvents(prev => {
          const existingEvents = prev[dateStr] 
            ? (typeof prev[dateStr] === 'string' 
              ? JSON.parse(prev[dateStr]) 
              : prev[dateStr])
            : []
          const updatedEvents = Array.isArray(existingEvents) 
            ? [...existingEvents, { ...newEvent, createdAt: new Date().toISOString() }]
            : [existingEvents, { ...newEvent, createdAt: new Date().toISOString() }]
          
          return {
            ...prev,
            [dateStr]: JSON.stringify(updatedEvents)
          }
        })

        setNewEvent({ startTime: '', endTime: '', title: '' })
        setIsAddingEvent(false)
      } else {
        throw new Error('Failed to add event')
      }
    } catch (error) {
      console.error('Failed to add event:', error)
      // Refresh data from server in case of error
      await fetchData(selectedDate)
    }
  }

  const handleAddLabel = async () => {
    if (!newLabel.trim()) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    // Optimistic update
    setLabels(prev => ({
      ...prev,
      [dateStr]: newLabel
    }))
    
    setNewLabel('')
    setIsAddingLabel(false)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'label',
          data: { label: newLabel }
        })
      })

      if (!res.ok) {
        // If server update fails, revert the optimistic update
        await fetchData(selectedDate)
      }
    } catch (error) {
      // If request fails, revert the optimistic update
      await fetchData(selectedDate)
      console.error('Failed to add label:', error)
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
    <div className="h-screen grid grid-cols-[1fr_minmax(auto,_50%)_1fr] grid-rows-[1fr_auto_1fr] overflow-hidden m-0 p-0 absolute inset-0">
      {/* Top Row */}
      <div className="col-span-3 border-b border-[#E5E7EB] border-dashed">
        <div className="h-full grid grid-cols-[1fr_minmax(auto,_50%)_1fr]">
          <div className="col-span-1" />
          <div className="col-span-1 border-l border-r border-[#E5E7EB] border-dashed" />
          <div className="col-span-1" />
        </div>
      </div>

      {/* Middle Row - Main Content */}
      <div className="col-span-1 flex items-center justify-center">
        {showEventPage ? (
          <button 
            onClick={() => {
              setShowEventPage(false)
              setSelectedDate(null)
            }}
            className="text-gray-300 hover:text-gray-600"
          >
            <svg width="70" height="70" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13.25 8.75L9.75 12L13.25 15.25" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={handlePreviousMonth} 
            className="text-gray-300 hover:text-gray-600"
          >
            <svg width="70" height="70" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13.25 8.75L9.75 12L13.25 15.25" />
            </svg>
          </button>
        )}
      </div>
      <div className={`col-span-1 border-x border-[#E5E7EB] border-dashed bg-white ${showEventPage ? 'w-[700px] mx-auto' : ''}`}>
        <div className="w-full p-8">
          {showEventPage ? (
            <EventPage
              date={selectedDate}
              events={events}
              labels={labels}
              birthdays={birthdays}
              onUpdate={() => fetchData(selectedDate)}
            />
          ) : (
            <>
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-medium text-gray-800 pl-9">
                  {format(currentDate, 'MMMM')}
                  <sup className="ml-3 text-2xl font-normal text-gray-300">'{format(currentDate, 'yy')}</sup>
                </h1>
                
                <Menu as="div" className="relative pr-9">
                  <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E5E7EB] bg-gray-50 overflow-hidden">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile photo"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {session?.user?.email?.[0].toUpperCase()}
                      </span>
                    )}
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="/settings"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
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
                              active ? 'bg-gray-100' : ''
                            } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-y-4 text-center">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                  <div key={day} className="text-sm text-gray-500">
                    {day}
                  </div>
                ))}
                
                {weeks.map((week, weekIndex) => 
                  week.map((day, dayIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const hasEvent = events[dateStr] || labels[dateStr]
                    const hasBirthday = birthdays[dateStr]
                    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => handleDayClick(day)}
                        className={`
                          relative text-center py-4 mx-1 rounded-md
                          ${!isCurrentMonth ? 'text-[#E5E7EB]' : ''}
                          ${isSelected ? 'bg-gray-100 font-bold' : ''}
                          ${isToday && !selectedDate ? 'bg-gray-100 font-bold' : ''}
                          hover:bg-gray-100 transition-colors
                        `}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-lg">{format(day, 'd')}</span>
                          {hasEvent && (
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1" />
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        {!showEventPage && (
          <button 
            onClick={handleNextMonth} 
            className="text-gray-300 hover:text-gray-600"
          >
            <svg width="70" height="70" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.75 8.75L14.25 12L10.75 15.25" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Row */}
      <div className="col-span-3 border-t border-[#E5E7EB] border-dashed">
        <div className="h-full grid grid-cols-[1fr_minmax(auto,_50%)_1fr]">
          <div className="col-span-1" />
          <div className="col-span-1 border-l border-r border-[#E5E7EB] border-dashed" />
          <div className="col-span-1" />
        </div>
      </div>
    </div>
  )
} 