import { logger } from "./logger";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store[identifier];

    // Clean up expired entries
    this.cleanup();

    if (!entry) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return false;
    }

    if (now > entry.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return false;
    }

    if (entry.count >= this.maxRequests) {
      logger.warn(`Rate limit exceeded for identifier: ${identifier}`, {
        count: entry.count,
        maxRequests: this.maxRequests,
        windowMs: this.windowMs
      });
      return true;
    }

    entry.count++;
    return false;
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.store[identifier];
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.store[identifier];
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime;
  }
}

// Rate limiters for different operations
export const messageRateLimiter = new RateLimiter(60000, 10); // 10 messages per minute
export const listingRateLimiter = new RateLimiter(300000, 5); // 5 listings per 5 minutes
export const authRateLimiter = new RateLimiter(900000, 5); // 5 auth attempts per 15 minutes

export default RateLimiter;