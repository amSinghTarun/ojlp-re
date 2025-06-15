export interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval: number
}

interface TokenBucket {
  tokens: Map<string, number[]>
  timeout: NodeJS.Timeout | null
}

export function rateLimit(options: RateLimitOptions) {
  const tokenBucket: TokenBucket = {
    tokens: new Map(),
    timeout: null,
  }

  // Clear tokens after the interval
  const clearTokens = () => {
    const now = Date.now()

    for (const [key, timestamps] of tokenBucket.tokens.entries()) {
      const newTimestamps = timestamps.filter((timestamp) => now - timestamp < options.interval)

      if (newTimestamps.length > 0) {
        tokenBucket.tokens.set(key, newTimestamps)
      } else {
        tokenBucket.tokens.delete(key)
      }
    }

    // Set up the next cleanup if there are tokens left
    if (tokenBucket.tokens.size > 0) {
      tokenBucket.timeout = setTimeout(clearTokens, options.interval)
    } else {
      tokenBucket.timeout = null
    }
  }

  return {
    check: (limit: number, key: string) =>
      new Promise<void>((resolve, reject) => {
        // Get the current timestamps for this key
        const timestamps = tokenBucket.tokens.get(key) || []
        const now = Date.now()

        // Filter out expired timestamps
        const newTimestamps = timestamps.filter((timestamp) => now - timestamp < options.interval)

        // Check if we're over the limit
        if (newTimestamps.length >= limit) {
          return reject(new Error("Rate limit exceeded"))
        }

        // Add the current timestamp
        newTimestamps.push(now)
        tokenBucket.tokens.set(key, newTimestamps)

        // Set up cleanup if not already running
        if (!tokenBucket.timeout) {
          tokenBucket.timeout = setTimeout(clearTokens, options.interval)
        }

        resolve()
      }),
  }
}
