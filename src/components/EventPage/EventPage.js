'use client'

import { format, differenceInMinutes } from 'date-fns'
import { useState } from 'react'

const LABEL_COLORS = {
  red: 'bg-red-50/80 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/10',
  blue: 'bg-blue-50/80 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/10',
  green: 'bg-green-50/80 text-green-700 ring-green-600/10 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/10',
  purple: 'bg-purple-50/80 text-purple-700 ring-purple-600/10 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-400/10',
  yellow: 'bg-yellow-50/80 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-400/10',
}

export default function EventPage({ date, events, labels, birthdays, onUpdate, onClose, onAddLabel, onAddBirthday }) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = (() => {
    try {
      if (!events) return []
      return typeof events === 'string' ? JSON.parse(events) : Array.isArray(events) ? events : [events]
    } catch (error) {
      console.error('Failed to parse events:', error)
      return []
    }
  })()
  
  // Sort events by start time
  const sortedEvents = [...dayEvents].sort((a, b) => {
    const [aHours, aMinutes] = a.startTime.split(':')
    const [bHours, bMinutes] = b.startTime.split(':')
    const aTime = parseInt(aHours) * 60 + parseInt(aMinutes)
    const bTime = parseInt(bHours) * 60 + parseInt(bMinutes)
    return aTime - bTime
  })
  
  const hasEvents = sortedEvents.length > 0
  const hasLabels = (() => {
    try {
      if (!labels) return null
      return typeof labels === 'string' ? JSON.parse(labels) : labels
    } catch (error) {
      console.error('Failed to parse label:', error)
      return null
    }
  })()
  const hasBirthday = (() => {
    try {
      if (!birthdays) return null
      return typeof birthdays === 'string' ? JSON.parse(birthdays) : birthdays
    } catch (error) {
      console.error('Failed to parse birthday:', error)
      return null
    }
  })()
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
      await onAddEvent({
        ...newEvent,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        title: newEvent.title.trim()
      })
      setNewEvent({ startTime: '', endTime: '', title: '', video: null, location: null })
      setIsAddingEvent(false)
    } catch (error) {
      console.error('Failed to add event:', error)
      alert('Failed to add event: ' + error.message)
    }
  }

  const handleAddLabel = async (e) => {
    if (e) {
      e.preventDefault()
    }
    if (!newLabel.text.trim()) return

    try {
      await onAddLabel({
        text: newLabel.text,
        color: newLabel.color
      })

      setNewLabel({ text: '', color: 'blue' })
      setIsAddingLabel(false)
      
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error('Failed to add label:', error)
      alert('Failed to add label: ' + error.message)
    }
  }

  const handleAddBirthday = async (e) => {
    if (e) {
      e.preventDefault()
    }
    if (!newBirthday.trim()) return

    try {
      await onAddBirthday({
        name: newBirthday
      })

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
      <div className="mb-8">
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Labels and Birthday Section */}
        <div className="flex items-center justify-between space-x-4 mb-6">
          <div className="flex items-center flex-wrap gap-2">
            {hasLabels && (
              <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ring-1 ring-inset backdrop-blur-sm ${LABEL_COLORS[hasLabels.color]}`}>
                {hasLabels.text}
              </span>
            )}
            {hasBirthday && (
              <span className="inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ring-1 ring-inset backdrop-blur-sm bg-fuchsia-50/80 text-fuchsia-700 ring-fuchsia-600/10 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-400/10">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
                {hasBirthday.name}'s Birthday
              </span>
            )}
            <div className="flex items-center gap-2">
              {!hasLabels && !isAddingLabel && (
                <button 
                  onClick={() => setIsAddingLabel(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
                  title="Add label"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {!hasBirthday && !isAddingBirthday && (
                <button
                  onClick={() => setIsAddingBirthday(true)}
                  className="p-2 text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 dark:hover:text-fuchsia-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
                  title="Add birthday"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7v2c0 1.1-.9 2-2 2H5a2 2 0 01-2-2v-2a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2zm0 4a5 5 0 00-5 5v4h10v-4a5 5 0 00-5-5z"/>
                  </svg>
                </button>
              )}
            </div>
            {isAddingLabel && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newLabel.text}
                  onChange={(e) => setNewLabel(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Add label..."
                  className="rounded-lg border-0 px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLabel()
                    } else if (e.key === 'Escape') {
                      setIsAddingLabel(false)
                    }
                  }}
                />
                <select
                  value={newLabel.color}
                  onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                  className="rounded-lg border-0 px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                >
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="yellow">Yellow</option>
                </select>
                <button
                  onClick={() => handleAddLabel()}
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsAddingLabel(false)}
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {isAddingBirthday && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newBirthday}
                  onChange={(e) => setNewBirthday(e.target.value)}
                  placeholder="Name..."
                  className="rounded-lg border-0 px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
                  autoFocus
                />
                <button
                  onClick={handleAddBirthday}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsAddingBirthday(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-baseline space-x-4">
          <span className="text-6xl font-bold text-gray-900 dark:text-white">
            {format(date, 'd')}
          </span>
          <h1 className="text-3xl font-light text-gray-500 dark:text-gray-300">
            {format(date, 'MMMM')}
          </h1>
        </div>
      </div>

      {/* Events Section */}
      <div className="space-y-6">
        <ul className="space-y-4">
          {sortedEvents.map((event, index) => (
            <li key={index} className="group">
              <div className="flex flex-col space-y-2">
                {/* Event Header */}
                <div className="flex items-start space-x-3 text-lg">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{event.startTime}</span>
                  <span className="text-gray-300 dark:text-gray-600"> - </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{event.endTime}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-bold">{event.title}</span>
                    {event.location && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
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
        </ul>

        {/* Add Event Form */}
        <form onSubmit={handleAddEvent} className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-[5.5rem] rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
              required
            />
            <input
              type="time"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-[5.5rem] rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
              required
            />
          </div>
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Add event..."
              className="flex-1 rounded-lg border-0 px-3 py-2 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm ring-1 ring-inset ring-gray-200/50 dark:ring-gray-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-shadow"
              required
            />
            <button
              type="submit"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
              title="Save event"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 