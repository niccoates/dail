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

export default function EventPage({ date, events, labels, onUpdate }) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events[dateStr] 
    ? (typeof events[dateStr] === 'string' 
      ? JSON.parse(events[dateStr])
      : events[dateStr])
    : []
  const dayEventsArray = Array.isArray(dayEvents) ? dayEvents : [dayEvents]
  const hasEvents = dayEventsArray.length > 0
  const hasLabels = labels[dateStr]
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [newEvent, setNewEvent] = useState({
    startTime: '',
    endTime: '',
    title: ''
  })
  const [newLabel, setNewLabel] = useState({
    text: '',
    color: 'blue'
  })

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

  return (
    <div className="h-full flex flex-col max-w-[546px] mx-auto">
      {/* Header */}
      <div className="mb-12">
        {hasLabels && (
          <div className="mb-4">
            <span className={`inline-flex items-center rounded-full px-5 py-1 text-sm font-bold ring-1 ring-inset ${LABEL_COLORS[labels[dateStr].color]}`}>
              {labels[dateStr].text}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-medium text-gray-800">
            {format(date, 'MMMM')}
            <sup className="ml-3 text-2xl font-normal text-gray-300">'{format(date, 'yy')}</sup>
          </h1>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-5xl font-bold">
            {format(date, 'd')}
          </span>
        </div>
      </div>

      {/* Events Section */}
      <div className="mb-12">
        {hasEvents && (
          <ul className="space-y-3 mb-8">
            {dayEventsArray.map((event, index) => (
              <li key={index} className="flex items-start space-x-3 text-lg">
                <span className="text-gray-500">{event.startTime}</span>
                <span className="text-gray-300"> - </span>
                <span className="text-gray-500">
                  {event.endTime}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-900 font-bold flex-1">{event.title}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Add Event Form */}
        {isAddingEvent && (
          <form onSubmit={handleAddEvent} className="space-y-4 mb-8">
            <div className="flex space-x-4">
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="block w-32 rounded-md border-0 px-2  py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                required
                autoFocus
              />
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="block w-32 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
                required
              />
            </div>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6 outline-none"
              required
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Label Form */}
      {isAddingLabel && (
        <form onSubmit={handleAddLabel} className="space-y-4 mb-8">
          <input
            type="text"
            value={newLabel.text}
            onChange={(e) => setNewLabel(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Label text"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
            required
          />
          <div className="flex items-center space-x-2">
            {Object.entries(LABEL_COLORS).map(([color, classes]) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ${
                  newLabel.color === color ? 'ring-gray-900' : 'ring-transparent'
                } ${classes.split(' ')[0]}`}
              />
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAddingLabel(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Action Buttons */}
      {!isAddingEvent && !isAddingLabel && (
        <div className="mt-auto flex justify-start space-x-4">
          <button 
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Add Event
          </button>
          <button 
            onClick={() => setIsAddingLabel(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Add Label
          </button>
        </div>
      )}
    </div>
  )
} 