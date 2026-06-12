export interface RateLimitConfig {
  requestsPerMinute: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs = 60000; // 1 minute in milliseconds
  private maxRequests: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.requestsPerMinute;
  }

  updateConfig(config: RateLimitConfig): void {
    this.maxRequests = config.requestsPerMinute;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, waitTime));
        // Recursively check again after waiting
        return this.waitIfNeeded();
      }
    }

    // Record this request
    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const now = Date.now();
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}