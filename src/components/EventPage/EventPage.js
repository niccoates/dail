'use client'

import { format, differenceInMinutes } from 'date-fns'
import { useState } from 'react'

const LABEL_COLORS = {
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  green: 'bg-green-50 text-green-700 ring-green-600/10',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/10',
}

export default function EventPage({ date, events, labels, birthdays, onUpdate }) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events[dateStr] 
    ? (typeof events[dateStr] === 'string' 
      ? JSON.parse(events[dateStr])
      : events[dateStr])
    : []
  const dayEventsArray = Array.isArray(dayEvents) ? dayEvents : [dayEvents]
  
  // Sort events by start time
  const sortedEvents = [...dayEventsArray].sort((a, b) => {
    const [aHours, aMinutes] = a.startTime.split(':')
    const [bHours, bMinutes] = b.startTime.split(':')
    const aTime = parseInt(aHours) * 60 + parseInt(aMinutes)
    const bTime = parseInt(bHours) * 60 + parseInt(bMinutes)
    return aTime - bTime
  })
  
  const hasEvents = sortedEvents.length > 0
  const hasLabels = labels[dateStr]
  const hasBirthday = birthdays && birthdays[dateStr]
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [newEvent, setNewEvent] = useState({
    startTime: '',
    endTime: '',
    title: '',
    video: null,
    location: null
  })
  const [newLabel, setNewLabel] = useState({
    text: '',
    color: 'blue'
  })
  const [newBirthday, setNewBirthday] = useState('')
  const [editingEventId, setEditingEventId] = useState(null)
  const [isAddingBirthday, setIsAddingBirthday] = useState(false)

  const formatDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const start = new Date(2024, 0, 1, startHour, startMin)
    const end = new Date(2024, 0, 1, endHour, endMin)
    const mins = differenceInMinutes(end, start)
    return `${mins}min`
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime) return

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
        const error = await res.json()
        throw new Error(error.details || 'Failed to add event')
      }

      setNewEvent({ startTime: '', endTime: '', title: '' })
      setIsAddingEvent(false)
      
      // Call onUpdate to refresh events
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error('Failed to add event:', error)
      alert('Failed to add event: ' + error.message)
    }
  }

  const handleAddLabel = async (e) => {
    e.preventDefault()
    if (!newLabel.text.trim()) return

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'label',
          data: newLabel
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.details || 'Failed to add label')
      }

      setNewLabel({ text: '', color: 'blue' })
      setIsAddingLabel(false)
      
      // Call onUpdate to refresh labels
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error('Failed to add label:', error)
      alert('Failed to add label: ' + error.message)
    }
  }

  const handleAddBirthday = async (e) => {
    e.preventDefault()
    if (!newBirthday.trim()) return

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'birthday',
          data: { name: newBirthday }
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.details || 'Failed to add birthday')
      }

      setNewBirthday('')
      setIsAddingBirthday(false)
      
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error('Failed to add birthday:', error)
      alert('Failed to add birthday: ' + error.message)
    }
  }

  const handleUpdateEvent = async (eventId, field, value) => {
    const eventToUpdate = sortedEvents.find(event => event.createdAt === eventId)
    if (!eventToUpdate) return

    const updatedEvent = {
      ...eventToUpdate,
      [field]: value
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type: 'event',
          data: {
            startTime: updatedEvent.startTime,
            endTime: updatedEvent.endTime,
            title: updatedEvent.title,
            createdAt: updatedEvent.createdAt,
            video: updatedEvent.video,
            location: updatedEvent.location
          }
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update event')
      }

      setEditingEventId(null)
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error('Failed to update event:', error)
      alert('Failed to update event: ' + error.message)
    }
  }

  return (
    <div className="h-full flex flex-col max-w-[546px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Labels and Birthday Section */}
        <div className="mb-8 mt-[-45px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasLabels && (
              <span className={`inline-flex items-center rounded-full px-5 py-1 text-sm font-bold ring-1 ring-inset ${LABEL_COLORS[labels[dateStr].color]}`}>
                {labels[dateStr].text}
              </span>
            )}
            {hasBirthday && (
              <span className="inline-flex items-center rounded-full px-5 py-1 text-sm font-bold ring-1 ring-inset bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
                {birthdays[dateStr]} Birthday
              </span>
            )}
            <div className="flex items-center space-x-2">
              {!hasLabels && (
                <button 
                  onClick={() => setIsAddingLabel(true)}
                  className="inline-flex items-center rounded-full px-3 py-2  text-sm font-medium ring-1 ring-inset bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
                </svg>

                </button>
              )}
              {!hasBirthday && !isAddingBirthday && (
                <button
                  onClick={() => setIsAddingBirthday(true)}
                  className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium ring-1 ring-inset bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200 hover:bg-fuchsia-100 transition-colors"
                  title="Add birthday"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                    <path d="m15 1.784-.796.795a1.125 1.125 0 1 0 1.591 0L15 1.784ZM12 1.784l-.796.795a1.125 1.125 0 1 0 1.591 0L12 1.784ZM9 1.784l-.796.795a1.125 1.125 0 1 0 1.591 0L9 1.784ZM9.75 7.547c.498-.021.998-.035 1.5-.042V6.75a.75.75 0 0 1 1.5 0v.755c.502.007 1.002.021 1.5.042V6.75a.75.75 0 0 1 1.5 0v.88l.307.022c1.55.117 2.693 1.427 2.693 2.946v1.018a62.182 62.182 0 0 0-13.5 0v-1.018c0-1.519 1.143-2.829 2.693-2.946l.307-.022v-.88a.75.75 0 0 1 1.5 0v.797ZM12 12.75c-2.472 0-4.9.184-7.274.54-1.454.217-2.476 1.482-2.476 2.916v.384a4.104 4.104 0 0 1 2.585.364 2.605 2.605 0 0 0 2.33 0 4.104 4.104 0 0 1 3.67 0 2.605 2.605 0 0 0 2.33 0 4.104 4.104 0 0 1 3.67 0 2.605 2.605 0 0 0 2.33 0 4.104 4.104 0 0 1 2.585-.364v-.384c0-1.434-1.022-2.7-2.476-2.917A49.138 49.138 0 0 0 12 12.75ZM21.75 18.131a2.604 2.604 0 0 0-1.915.165 4.104 4.104 0 0 1-3.67 0 2.605 2.605 0 0 0-2.33 0 4.104 4.104 0 0 1-3.67 0 2.605 2.605 0 0 0-2.33 0 4.104 4.104 0 0 1-3.67 0 2.604 2.604 0 0 0-1.915-.165v2.494c0 1.035.84 1.875 1.875 1.875h15.75c1.035 0 1.875-.84 1.875-1.875v-2.494Z" />
                  </svg>
                </button>
              )}
              {isAddingLabel && (
                <form onSubmit={handleAddLabel} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLabel.text}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Label text..."
                    className="w-40 rounded-md border-0 px-2 py-1 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 outline-none"
                    required
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsAddingLabel(false)
                        setNewLabel({ text: '', color: 'blue' })
                      }
                    }}
                  />
                  <div className="flex items-center space-x-1">
                    {Object.entries(LABEL_COLORS).map(([color, classes]) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full ${
                          newLabel.color === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''
                        } ${classes.split(' ')[0]}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="submit"
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Save label"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingLabel(false)
                        setNewLabel({ text: '', color: 'blue' })
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
              {isAddingBirthday && (
                <form onSubmit={handleAddBirthday} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    placeholder="Name..."
                    className="w-40 rounded-md border-0 px-2 py-1 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 outline-none"
                    required
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsAddingBirthday(false)
                        setNewBirthday('')
                      }
                    }}
                  />
                  <div className="flex items-center space-x-1">
                    <button
                      type="submit"
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Save birthday"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBirthday(false)
                        setNewBirthday('')
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-baseline space-x-4">
          <div className="flex items-baseline space-x-3">
          <span className="text-6xl font-bold text-gray-900">
              {format(date, 'd')}
            </span>
            <h1 className="text-3xl font-light text-gray-500">
              {format(date, 'MMMM')}
            </h1>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="mb-12">
        <ul className="space-y-3 mb-3">
          {sortedEvents.map((event, index) => (
            <li key={index} className="group">
              <div className="flex flex-col space-y-2">
                {/* Event Header */}
                <div className="flex items-start space-x-3 text-lg">
                  <span className="text-gray-500">{event.startTime}</span>
                  <span className="text-gray-300"> - </span>
                  <span className="text-gray-500">{event.endTime}</span>
                  <span className="text-gray-300">•</span>
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="text-gray-900 font-bold">{event.title}</span>
                    {event.location && (
                      <span className="text-sm text-gray-500 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </span>
                    )}
                    {event.video && (
                      <a 
                        href={event.video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M15.1141 9.35688C14.7589 9.56999 14.6438 10.0307 14.8569 10.3859C15.07 10.7411 15.5307 10.8562 15.8859 10.6431L15.1141 9.35688ZM19.25 7.75H20C20 7.4798 19.8547 7.23048 19.6195 7.09735C19.3844 6.96422 19.0958 6.96786 18.8641 7.10688L19.25 7.75ZM19.25 16.25L18.8641 16.8931C19.0958 17.0321 19.3844 17.0358 19.6195 16.9026C19.8547 16.7695 20 16.5202 20 16.25H19.25ZM15.8859 13.3569C15.5307 13.1438 15.07 13.2589 14.8569 13.6141C14.6438 13.9693 14.7589 14.43 15.1141 14.6431L15.8859 13.3569ZM15.8859 10.6431L19.6359 8.39312L18.8641 7.10688L15.1141 9.35688L15.8859 10.6431ZM18.5 7.75V16.25H20V7.75H18.5ZM19.6359 15.6069L15.8859 13.3569L15.1141 14.6431L18.8641 16.8931L19.6359 15.6069ZM6.75 7.5H13.25V6H6.75V7.5ZM14.5 8.75V15.25H16V8.75H14.5ZM13.25 16.5H6.75V18H13.25V16.5ZM5.5 15.25V8.75H4V15.25H5.5ZM6.75 16.5C6.05964 16.5 5.5 15.9404 5.5 15.25H4C4 16.7688 5.23122 18 6.75 18V16.5ZM14.5 15.25C14.5 15.9404 13.9404 16.5 13.25 16.5V18C14.7688 18 16 16.7688 16 15.25H14.5ZM13.25 7.5C13.9404 7.5 14.5 8.05964 14.5 8.75H16C16 7.23122 14.7688 6 13.25 6V7.5ZM6.75 6C5.23122 6 4 7.23122 4 8.75H5.5C5.5 8.05964 6.05964 7.5 6.75 7.5V6Z"></path>
                        </svg>
                      </a>
                    )}
                    {editingEventId?.id === event.createdAt && (
                      <>
                        {editingEventId.type === 'location' && !event.location && (
                          <div className="relative ml-2">
                            <input
                              type="text"
                              placeholder="Location"
                              className="w-40 text-sm bg-transparent border-b border-gray-300 px-1 py-0.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-600 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateEvent(event.createdAt, 'location', e.target.value)
                                } else if (e.key === 'Escape') {
                                  setEditingEventId(null)
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingEventId(null)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {editingEventId.type === 'video' && !event.video && (
                          <div className="relative ml-2">
                            <input
                              type="text"
                              placeholder="Video link"
                              className="w-40 text-sm bg-transparent border-b border-gray-300 px-1 py-0.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-600 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateEvent(event.createdAt, 'video', e.target.value)
                                } else if (e.key === 'Escape') {
                                  setEditingEventId(null)
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingEventId(null)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {!event.location && !event.video && !editingEventId && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingEventId({ id: event.createdAt, type: 'location' })}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                          title="Add location"
                        >
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.25 11C18.25 15 12 19.25 12 19.25C12 19.25 5.75 15 5.75 11C5.75 7.5 8.68629 4.75 12 4.75C15.3137 4.75 18.25 7.5 18.25 11Z"></path>
                            <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></circle>
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingEventId({ id: event.createdAt, type: 'video' })}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                          title="Add video link"
                        >
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M15.1141 9.35688C14.7589 9.56999 14.6438 10.0307 14.8569 10.3859C15.07 10.7411 15.5307 10.8562 15.8859 10.6431L15.1141 9.35688ZM19.25 7.75H20C20 7.4798 19.8547 7.23048 19.6195 7.09735C19.3844 6.96422 19.0958 6.96786 18.8641 7.10688L19.25 7.75ZM19.25 16.25L18.8641 16.8931C19.0958 17.0321 19.3844 17.0358 19.6195 16.9026C19.8547 16.7695 20 16.5202 20 16.25H19.25ZM15.8859 13.3569C15.5307 13.1438 15.07 13.2589 14.8569 13.6141C14.6438 13.9693 14.7589 14.43 15.1141 14.6431L15.8859 13.3569ZM15.8859 10.6431L19.6359 8.39312L18.8641 7.10688L15.1141 9.35688L15.8859 10.6431ZM18.5 7.75V16.25H20V7.75H18.5ZM19.6359 15.6069L15.8859 13.3569L15.1141 14.6431L18.8641 16.8931L19.6359 15.6069ZM6.75 7.5H13.25V6H6.75V7.5ZM14.5 8.75V15.25H16V8.75H14.5ZM13.25 16.5H6.75V18H13.25V16.5ZM5.5 15.25V8.75H4V15.25H5.5ZM6.75 16.5C6.05964 16.5 5.5 15.9404 5.5 15.25H4C4 16.7688 5.23122 18 6.75 18V16.5ZM14.5 15.25C14.5 15.9404 13.9404 16.5 13.25 16.5V18C14.7688 18 16 16.7688 16 15.25H14.5ZM13.25 7.5C13.9404 7.5 14.5 8.05964 14.5 8.75H16C16 7.23122 14.7688 6 13.25 6V7.5ZM6.75 6C5.23122 6 4 7.23122 4 8.75H5.5C5.5 8.05964 6.05964 7.5 6.75 7.5V6Z"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
          <li>
            <form onSubmit={handleAddEvent} className="flex items-center space-x-2">
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-16 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                required
              />
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-16 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                required
              />
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Add event..."
                className="flex-1 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                required
              />
              <button
                type="submit"
                className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                title="Save event"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </form>
          </li>
        </ul>
      </div>
    </div>
  )
} 