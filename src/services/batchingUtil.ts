import { db } from './firebase';
import { writeBatch, batch } from 'firebase/firestore';
import { Logger } from '../utils/logger';
import * as crypto from 'crypto';

/**
 * Firebase Batch Operations Utility
 * Helps reduce quota usage by batching multiple operations into single commits
 */

export interface BatchOperation {
  type: 'update' | 'set' | 'delete';
  ref: any; // DocumentReference
  data?: any;
  mergeFields?: string[];
}

export interface DedupEvent {
  userId: string;
  eventType: string;
  timestamp: number;
  hash?: string;
  data?: any;
}

/**
 * Batch builder for efficient Firebase operations
 */
export class FirebaseBatchBuilder {
  private operations: BatchOperation[] = [];
  private maxBatchSize = 500; // Firebase limit is 500 ops per batch

  addUpdate(ref: any, data: any, mergeFields?: string[]): this {
    this.operations.push({ type: 'update', ref, data, mergeFields });
    return this;
  }

  addSet(ref: any, data: any): this {
    this.operations.push({ type: 'set', ref, data });
    return this;
  }

  addDelete(ref: any): this {
    this.operations.push({ type: 'delete', ref });
    return this;
  }

  getBatchSize(): number {
    return this.operations.length;
  }

  isFull(): boolean {
    return this.operations.length >= this.maxBatchSize;
  }

  /**
   * Commit all operations in efficient batches
   */
  async commit(): Promise<{ success: boolean; error?: any }> {
    if (this.operations.length === 0) {
      return { success: true };
    }

    try {
      // Split into chunks if needed
      const chunks = this.chunkOperations();
      
      for (const chunk of chunks) {
        const b = writeBatch(db);
        
        for (const op of chunk) {
          switch (op.type) {
            case 'update':
              if (op.mergeFields) {
                b.update(op.ref, op.data, { merge: true });
              } else {
                b.update(op.ref, op.data);
              }
              break;
            case 'set':
              b.set(op.ref, op.data);
              break;
            case 'delete':
              b.delete(op.ref);
              break;
          }
        }
        
        await b.commit();
      }

      this.operations = [];
      return { success: true };
    } catch (error) {
      Logger.error('Batch commit failed', error);
      return { success: false, error };
    }
  }

  /**
   * Split operations into max size chunks
   */
  private chunkOperations(): BatchOperation[][] {
    const chunks: BatchOperation[][] = [];
    for (let i = 0; i < this.operations.length; i += this.maxBatchSize) {
      chunks.push(this.operations.slice(i, i + this.maxBatchSize));
    }
    return chunks;
  }

  clear(): void {
    this.operations = [];
  }
}

/**
 * Deduplication utility for preventing duplicate events
 */
export class EventDeduplicator {
  private eventCache = new Map<string, number>(); // eventHash -> timestamp
  private readonly DEDUP_WINDOW_MS = 5000; // 5 second dedup window

  /**
   * Check if event is duplicate within dedup window
   */
  isDuplicate(event: DedupEvent): boolean {
    const hash = this.generateHash(event);
    const now = Date.now();
    const lastSeen = this.eventCache.get(hash);

    if (!lastSeen) {
      this.eventCache.set(hash, now);
      return false;
    }

    // If within dedup window, it's a duplicate
    if (now - lastSeen < this.DEDUP_WINDOW_MS) {
      return true;
    }

    // Update timestamp for next check
    this.eventCache.set(hash, now);
    return false;
  }

  /**
   * Generate hash for event deduplication
   */
  generateHash(event: DedupEvent): string {
    const eventStr = `${event.userId}:${event.eventType}:${Math.floor(event.timestamp / 1000)}`;
    return crypto
      .createHash('sha256')
      .update(eventStr)
      .digest('hex');
  }

  /**
   * Clear old entries from cache to prevent memory leak
   */
  cleanup(): void {
    const now = Date.now();
    for (const [hash, timestamp] of this.eventCache.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW_MS * 2) {
        this.eventCache.delete(hash);
      }
    }
  }

  clear(): void {
    this.eventCache.clear();
  }
}

/**
 * Cached field updater to reduce reads
 */
export class CachedFieldUpdater {
  private cache = new Map<string, any>(); // documentId -> data
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL_MS = 30000; // 30 second cache

  /**
   * Get cached value if still valid
   */
  get(docId: string): any | null {
    const timestamp = this.cacheTimestamps.get(docId);
    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(docId);
      this.cacheTimestamps.delete(docId);
      return null;
    }
    return this.cache.get(docId) || null;
  }

  /**
   * Set cached value
   */
  set(docId: string, data: any): void {
    this.cache.set(docId, data);
    this.cacheTimestamps.set(docId, Date.now());
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(docId: string): void {
    this.cache.delete(docId);
    this.cacheTimestamps.delete(docId);
  }

  /**
   * Invalidate all cache
   */
  clear(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Update cached value in memory
   */
  updateLocal(docId: string, field: string, value: any): void {
    const existing = this.cache.get(docId) || {};
    existing[field] = value;
    this.set(docId, existing);
  }

  /**
   * Increment cached numeric field
   */
  incrementLocal(docId: string, field: string, amount: number = 1): void {
    const existing = this.cache.get(docId) || {};
    existing[field] = (existing[field] || 0) + amount;
    this.set(docId, existing);
  }

  /**
   * Add to cached array/set
   */
  addToLocal(docId: string, field: string, value: any): void {
    const existing = this.cache.get(docId) || {};
    if (!Array.isArray(existing[field])) {
      existing[field] = [];
    }
    if (!existing[field].includes(value)) {
      existing[field].push(value);
    }
    this.set(docId, existing);
  }
}

/**
 * Rate limiter for Firebase quota management
 */
export class RateLimiter {
  private requestCounts = new Map<string, number[]>(); // clientId -> timestamps
  private readonly WINDOW_MS = 60000; // 1 minute window
  private readonly MAX_REQUESTS = 100; // Max requests per minute per client

  canProceed(clientId: string): boolean {
    const now = Date.now();
    const requests = this.requestCounts.get(clientId) || [];

    // Remove old requests outside window
    const filtered = requests.filter(ts => now - ts < this.WINDOW_MS);
    
    if (filtered.length >= this.MAX_REQUESTS) {
      return false;
    }

    // Add current request
    filtered.push(now);
    this.requestCounts.set(clientId, filtered);
    return true;
  }

  getRemainingRequests(clientId: string): number {
    const now = Date.now();
    const requests = this.requestCounts.get(clientId) || [];
    const filtered = requests.filter(ts => now - ts < this.WINDOW_MS);
    return Math.max(0, this.MAX_REQUESTS - filtered.length);
  }

  reset(): void {
    this.requestCounts.clear();
  }
}
