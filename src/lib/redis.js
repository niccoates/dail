import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Helper function to hash email addresses
function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email + process.env.NEXTAUTH_SECRET)
    .digest('hex')
}

// Enhanced Redis client with calendar-specific methods
const enhancedRedis = {
  ...redis, // Spread existing Redis methods

  // Events storage and retrieval
  async setEvents(email, yearMonth, date, events) {
    const hashedEmail = hashEmail(email)
    const key = `events:${hashedEmail}:${yearMonth}`
    return redis.hset(key, { [date]: JSON.stringify(events) })
  },

  async getEvents(email, yearMonth) {
    const hashedEmail = hashEmail(email)
    const key = `events:${hashedEmail}:${yearMonth}`
    return redis.hgetall(key)
  },

  // Labels storage and retrieval
  async setLabels(email, yearMonth, date, labels) {
    const hashedEmail = hashEmail(email)
    const key = `labels:${hashedEmail}:${yearMonth}`
    return redis.hset(key, { [date]: JSON.stringify(labels) })
  },

  async getLabels(email, yearMonth) {
    const hashedEmail = hashEmail(email)
    const key = `labels:${hashedEmail}:${yearMonth}`
    return redis.hgetall(key)
  },

  // Birthdays storage and retrieval
  async setBirthdays(email, yearMonth, date, birthday) {
    const hashedEmail = hashEmail(email)
    const key = `birthdays:${hashedEmail}:${yearMonth}`
    return redis.hset(key, { [date]: JSON.stringify(birthday) })
  },

  async getBirthdays(email, yearMonth) {
    const hashedEmail = hashEmail(email)
    const key = `birthdays:${hashedEmail}:${yearMonth}`
    return redis.hgetall(key)
  },

  // User data storage and retrieval (for auth)
  async setUserData(email, data) {
    const hashedEmail = hashEmail(email)
    return redis.hset('users', { [hashedEmail]: JSON.stringify(data) })
  },

  async getUserData(email) {
    const hashedEmail = hashEmail(email)
    const data = await redis.hget('users', hashedEmail)
    if (!data) return null
    return JSON.parse(data)
  },

  async deleteUserData(email) {
    const hashedEmail = hashEmail(email)
    await redis.hdel('users', hashedEmail)
    
    // Clean up related data
    const patterns = [
      `events:${hashedEmail}:*`,
      `labels:${hashedEmail}:*`,
      `birthdays:${hashedEmail}:*`
    ]
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    }
  }
}

export default enhancedRedis 