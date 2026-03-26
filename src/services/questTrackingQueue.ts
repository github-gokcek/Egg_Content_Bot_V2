import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseBatchBuilder, EventDeduplicator } from './batchingUtil';
import { Logger } from '../utils/logger';

/**
 * Pending update event for quest tracking queue
 */
export interface QuestTrackingEvent {
  id?: string; // Generated if not provided
  userId: string;
  eventType: string; // e.g., 'message', 'reaction', 'casino_spin', etc.
  timestamp: number;
  data: any; // Event-specific data
  processed: boolean;
}

/**
 * Main queue system for quest tracking
 * - In-memory queue for fast operations
 * - Firebase backup for persistence
 * - Batch flushing every 30 seconds
 * - Deduplication to prevent duplicate data on restart
 */
export class QuestTrackingQueue {
  private pendingEvents: Map<string, QuestTrackingEvent[]> = new Map(); // userId -> events
  private pendingQuestUpdates: Map<string, any> = new Map(); // userId -> updates
  private flushScheduled = false;
  private flushInterval = 30000; // 30 seconds
  private deduplicator = new EventDeduplicator();
  private isRecovering = false;
  private recoveredEvents = new Set<string>(); // Track recovered event hashes

  constructor() {
    // Start periodic flush
    this.scheduleFlush();
  }

  /**
   * Add event to queue (in-memory, not persisted yet)
   */
  addEvent(event: Omit<QuestTrackingEvent, 'id' | 'processed'>): void {
    // Deduplication check
    if (this.deduplicator.isDuplicate({ ...event, data: {} })) {
      Logger.debug('Duplicate event filtered', {
        userId: event.userId,
        eventType: event.eventType,
      });
      return;
    }

    const userId = event.userId;
    const events = this.pendingEvents.get(userId) || [];
    events.push({
      ...event,
      processed: false,
    });
    this.pendingEvents.set(userId, events);

    Logger.debug('Event queued', {
      userId,
      eventType: event.eventType,
      queueSize: events.length,
    });
  }

  /**
   * Queue a quest progress update (to be batched)
   */
  queueQuestUpdate(userId: string, updates: any): void {
    const existing = this.pendingQuestUpdates.get(userId) || {};
    
    // Merge updates
    const merged = { ...existing };
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'number') {
        merged[key] = (merged[key] || 0) + value;
      } else if (Array.isArray(value)) {
        merged[key] = [...(merged[key] || []), ...value];
      } else {
        merged[key] = value;
      }
    }

    this.pendingQuestUpdates.set(userId, merged);
  }

  /**
   * Manually flush queue (called automatically every 30s)
   */
  async flush(): Promise<boolean> {
    if (this.pendingEvents.size === 0 && this.pendingQuestUpdates.size === 0) {
      return true;
    }

    Logger.info('Flushing quest tracking queue', {
      eventUsers: this.pendingEvents.size,
      questUpdateUsers: this.pendingQuestUpdates.size,
    });

    try {
      const builder = new FirebaseBatchBuilder();
      const operations = [];

      // Process pending events
      for (const [userId, events] of this.pendingEvents) {
        for (const event of events) {
          operations.push({
            type: 'set' as const,
            ref: doc(db, 'queued_activities', `${userId}_${event.timestamp}_${Math.random()}`),
            data: {
              userId,
              eventType: event.eventType,
              timestamp: event.timestamp,
              data: event.data,
              processed: false,
            },
          });
        }
      }

      // Process pending quest updates
      for (const [userId, updates] of this.pendingQuestUpdates) {
        // Get current quest data first
        const questRef = doc(db, 'userQuests', userId);
        
        operations.push({
          type: 'update' as const,
          ref: questRef,
          data: {
            ...updates,
            lastSaveTime: Date.now(),
          },
        });
      }

      // Batch commit all operations
      for (const op of operations) {
        if (op.type === 'set') {
          builder.addSet(op.ref, op.data);
        } else if (op.type === 'update') {
          builder.addUpdate(op.ref, op.data);
        }
      }

      const result = await builder.commit();
      
      if (result.success) {
        Logger.success('Queue flushed', {
          eventsCount: this.pendingEvents.size,
          updatesCount: this.pendingQuestUpdates.size,
        });

        // Clear after successful flush
        this.pendingEvents.clear();
        this.pendingQuestUpdates.clear();
      } else {
        Logger.error('Queue flush failed', result.error);
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Queue flush error', error);
      return false;
    }
  }

  /**
   * Schedule periodic flush
   */
  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    
    this.flushScheduled = true;
    setInterval(async () => {
      await this.flush();
      this.deduplicator.cleanup();
    }, this.flushInterval);

    Logger.info('Quest tracking queue initialized', {
      flushIntervalMs: this.flushInterval,
    });
  }

  /**
   * Recover unprocessed events from Firebase on bot startup
   */
  async recoverUnprocessedEvents(): Promise<number> {
    if (this.isRecovering) {
      Logger.warn('Recovery already in progress');
      return 0;
    }

    this.isRecovering = true;
    let recoveredCount = 0;

    try {
      Logger.info('Starting quest tracking queue recovery...');

      // Query unprocessed events
      const q = query(
        collection(db, 'queued_activities'),
        where('processed', '==', false)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Logger.info('No events to recover');
        this.isRecovering = false;
        return 0;
      }

      const builder = new FirebaseBatchBuilder();
      const eventsByUser = new Map<string, any[]>();

      // Group events by user and aggregate
      for (const doc of snapshot.docs) {
        const data = doc.data() as QuestTrackingEvent;
        const userId = data.userId;
        const eventHash = this.deduplicator.generateHash({
          userId,
          eventType: data.eventType,
          timestamp: data.timestamp,
        });

        // Skip if already recovered in this session
        if (this.recoveredEvents.has(eventHash)) {
          Logger.debug('Skipping already recovered event', { eventHash });
          builder.addDelete(doc.ref);
          continue;
        }

        this.recoveredEvents.add(eventHash);
        
        if (!eventsByUser.has(userId)) {
          eventsByUser.set(userId, []);
        }
        eventsByUser.get(userId)!.push({
          eventType: data.eventType,
          data: data.data,
          timestamp: data.timestamp,
        });

        // Mark as processed
        builder.addUpdate(doc.ref, { processed: true });
        recoveredCount++;
      }

      // Apply recovered events to pending queue
      for (const [userId, events] of eventsByUser) {
        for (const event of events) {
          this.addEvent({
            userId,
            eventType: event.eventType,
            timestamp: Date.now(),
            data: event.data,
          });
        }
      }

      // Commit all updates
      await builder.commit();

      Logger.success('Quest tracking queue recovery complete', {
        recoveredEvents: recoveredCount,
      });

      // Flush immediately after recovery
      await this.flush();

      this.isRecovering = false;
      return recoveredCount;
    } catch (error) {
      Logger.error('Quest tracking queue recovery failed', error);
      this.isRecovering = false;
      return 0;
    }
  }

  /**
   * Get queue status for monitoring
   */
  getStatus(): {
    pendingEventsCount: number;
    pendingUpdatesCount: number;
    totalUsers: number;
    isRecovering: boolean;
  } {
    const allUsers = new Set([
      ...this.pendingEvents.keys(),
      ...this.pendingQuestUpdates.keys(),
    ]);

    return {
      pendingEventsCount: Array.from(this.pendingEvents.values()).reduce(
        (sum, events) => sum + events.length,
        0
      ),
      pendingUpdatesCount: this.pendingQuestUpdates.size,
      totalUsers: allUsers.size,
      isRecovering: this.isRecovering,
    };
  }

  /**
   * Clear all pending data (for testing)
   */
  clear(): void {
    this.pendingEvents.clear();
    this.pendingQuestUpdates.clear();
    this.recoveredEvents.clear();
  }

  /**
   * Get memory usage stats
   */
  getMemoryStats(): {
    pendingEventSize: number;
    pendingUpdateSize: number;
    recoveredEventsSize: number;
  } {
    return {
      pendingEventSize: this.pendingEvents.size,
      pendingUpdateSize: this.pendingQuestUpdates.size,
      recoveredEventsSize: this.recoveredEvents.size,
    };
  }
}

// Global instance
export const questTrackingQueue = new QuestTrackingQueue();
