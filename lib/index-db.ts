// lib/indexed-db-service.ts
// IndexedDB service for caching queries and storing collections
// Provides automatic cleanup, expiration, and type-safe operations

const DB_NAME = 'mongo-playground-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  QUERY_RESULTS: 'query-results',      // Cache query execution results
  COLLECTIONS: 'collections',          // Store loaded collections
  EXECUTION_HISTORY: 'execution-history', // Track query executions
  METADATA: 'metadata',                // Store metadata (version, last cleanup)
};

interface CachedQueryResult {
  id: string;
  cacheKey: string;
  code: string;
  solution: string;
  userResult: any;
  expectedResult: any;
  isCorrect: boolean;
  createdAt: number;
  expiresAt: number; // TTL timestamp
  executionTime: number;
  hitCount: number; // How many times this result was used
}

interface StoredCollection {
  name: string;
  data: any[];
  storedAt: number;
  expiresAt: number;
  size: number; // bytes
}

interface ExecutionRecord {
  id: string;
  code: string;
  solution: string;
  isCorrect: boolean;
  executionTime: number;
  createdAt: number;
  cacheHit: boolean;
}

interface DbMetadata {
  key: 'app-metadata';
  dbVersion: number;
  lastCleanup: number;
  totalCached: number;
  totalCollections: number;
  dbSize: number; // bytes
}

/**
 * IndexedDB Service
 * Handles all IndexedDB operations for the Mongo Playground
 */
class IndexedDBService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize IndexedDB database
   * Creates object stores if they don't exist
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB init error:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create Query Results store
        if (!db.objectStoreNames.contains(STORES.QUERY_RESULTS)) {
          const queryStore = db.createObjectStore(STORES.QUERY_RESULTS, { keyPath: 'id' });
          queryStore.createIndex('cacheKey', 'cacheKey', { unique: true });
          queryStore.createIndex('expiresAt', 'expiresAt');
          queryStore.createIndex('hitCount', 'hitCount');
        }

        // Create Collections store
        if (!db.objectStoreNames.contains(STORES.COLLECTIONS)) {
          const collStore = db.createObjectStore(STORES.COLLECTIONS, { keyPath: 'name' });
          collStore.createIndex('expiresAt', 'expiresAt');
          collStore.createIndex('storedAt', 'storedAt');
        }

        // Create Execution History store
        if (!db.objectStoreNames.contains(STORES.EXECUTION_HISTORY)) {
          const historyStore = db.createObjectStore(STORES.EXECUTION_HISTORY, { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('createdAt', 'createdAt');
          historyStore.createIndex('cacheHit', 'cacheHit');
        }

        // Create Metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;

        // Start automatic cleanup
        this.startAutoCleanup();

        // Initialize metadata
        this.initMetadata();

        resolve();
      };
    });
  }

  /**
   * Initialize or update metadata
   */
  private async initMetadata(): Promise<void> {
    const metadata = await this.getMetadata();
    if (!metadata) {
      const newMetadata: DbMetadata = {
        key: 'app-metadata',
        dbVersion: DB_VERSION,
        lastCleanup: Date.now(),
        totalCached: 0,
        totalCollections: 0,
        dbSize: 0,
      };
      await this.setMetadata(newMetadata);
    }
  }

  /**
   * Get metadata
   */
  private async getMetadata(): Promise<DbMetadata | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.METADATA], 'readonly');
      const store = tx.objectStore(STORES.METADATA);
      const request = store.get('app-metadata');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Set metadata
   */
  private async setMetadata(metadata: DbMetadata): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.METADATA], 'readwrite');
      const store = tx.objectStore(STORES.METADATA);
      const request = store.put(metadata);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Cache a query result
   * Stores both the input code and the result for comparison
   */
  async cacheQueryResult(
    code: string,
    solution: string,
    userResult: any,
    expectedResult: any,
    isCorrect: boolean,
    executionTime: number,
    ttlMinutes: number = 5
  ): Promise<string> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cacheKey = this.generateCacheKey(code, solution);
    const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);

    const cachedResult: CachedQueryResult = {
      id,
      cacheKey,
      code,
      solution,
      userResult,
      expectedResult,
      isCorrect,
      createdAt: now,
      expiresAt,
      executionTime,
      hitCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.QUERY_RESULTS], 'readwrite');
      const store = tx.objectStore(STORES.QUERY_RESULTS);

      // Delete old entry with same cacheKey if exists
      const indexRequest = store.index('cacheKey').getKey(cacheKey);
      indexRequest.onsuccess = () => {
        if (indexRequest.result) {
          store.delete(indexRequest.result);
        }
      };

      const putRequest = store.put(cachedResult);

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => {
        this.updateMetadata();
        resolve(id);
      };
    });
  }

  /**
   * Retrieve cached query result
   * Increments hit count on retrieval
   */
  async getCachedQueryResult(code: string, solution: string): Promise<CachedQueryResult | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cacheKey = this.generateCacheKey(code, solution);
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.QUERY_RESULTS], 'readwrite');
      const store = tx.objectStore(STORES.QUERY_RESULTS);
      const index = store.index('cacheKey');

      const getRequest = index.get(cacheKey);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const result = getRequest.result;

        // Check if expired
        if (result && result.expiresAt > now) {
          // Increment hit count
          result.hitCount++;
          store.put(result);
          resolve(result);
        } else if (result) {
          // Expired, delete it
          store.delete(result.id);
          resolve(null);
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Store collections data in IndexedDB
   * Prevents re-loading the same data repeatedly
   */
  async storeCollections(collections: Record<string, any[]>, ttlMinutes: number = 30): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.COLLECTIONS], 'readwrite');
      const store = tx.objectStore(STORES.COLLECTIONS);

      // Clear existing collections first
      store.clear();

      let completed = 0;
      const total = Object.keys(collections).length;

      Object.entries(collections).forEach(([name, data]) => {
        const size = new Blob([JSON.stringify(data)]).size;
        const stored: StoredCollection = {
          name,
          data,
          storedAt: now,
          expiresAt,
          size,
        };

        const putRequest = store.put(stored);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            this.updateMetadata();
            resolve();
          }
        };
      });
    });
  }

  /**
   * Retrieve all collections from IndexedDB
   */
  async getStoredCollections(): Promise<Record<string, any[]> | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.COLLECTIONS], 'readwrite');
      const store = tx.objectStore(STORES.COLLECTIONS);

      const getAllRequest = store.getAll();

      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => {
        const collections = getAllRequest.result;

        if (collections.length === 0) {
          resolve(null);
          return;
        }

        // Check if any are expired, delete them
        const now = Date.now();
        const result: Record<string, any[]> = {};

        collections.forEach((collection: StoredCollection) => {
          if (collection.expiresAt > now) {
            result[collection.name] = collection.data;
          } else {
            // Delete expired
            store.delete(collection.name);
          }
        });

        resolve(Object.keys(result).length > 0 ? result : null);
      };
    });
  }

  /**
   * Record a query execution in history
   */
  async recordExecution(
    code: string,
    solution: string,
    isCorrect: boolean,
    executionTime: number,
    cacheHit: boolean
  ): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const record: ExecutionRecord = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code,
      solution,
      isCorrect,
      executionTime,
      createdAt: Date.now(),
      cacheHit,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.EXECUTION_HISTORY], 'readwrite');
      const store = tx.objectStore(STORES.EXECUTION_HISTORY);
      const putRequest = store.add(record);

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    });
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(limitDays: number = 7): Promise<{
    totalExecutions: number;
    cacheHits: number;
    cacheHitRate: number;
    averageExecutionTime: number;
    correctAnswers: number;
  }> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cutoffTime = Date.now() - (limitDays * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.EXECUTION_HISTORY], 'readonly');
      const store = tx.objectStore(STORES.EXECUTION_HISTORY);
      const index = store.index('createdAt');

      const rangeRequest = index.getAll(IDBKeyRange.lowerBound(cutoffTime));

      rangeRequest.onerror = () => reject(rangeRequest.error);
      rangeRequest.onsuccess = () => {
        const records = rangeRequest.result as ExecutionRecord[];

        const stats = {
          totalExecutions: records.length,
          cacheHits: records.filter(r => r.cacheHit).length,
          cacheHitRate: 0,
          averageExecutionTime: 0,
          correctAnswers: records.filter(r => r.isCorrect).length,
        };

        stats.cacheHitRate = stats.totalExecutions > 0 
          ? (stats.cacheHits / stats.totalExecutions) * 100 
          : 0;

        stats.averageExecutionTime = stats.totalExecutions > 0
          ? records.reduce((sum, r) => sum + r.executionTime, 0) / stats.totalExecutions
          : 0;

        resolve(stats);
      };
    });
  }

  /**
   * Clean up expired entries
   * Called automatically at intervals and on demand
   */
  async cleanup(): Promise<{ queriesDeleted: number; collectionsDeleted: number }> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const now = Date.now();
    let queriesDeleted = 0;
    let collectionsDeleted = 0;

    // Clean up expired query results
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([STORES.QUERY_RESULTS], 'readwrite');
      const store = tx.objectStore(STORES.QUERY_RESULTS);
      const index = store.index('expiresAt');

      const rangeRequest = index.getAll(IDBKeyRange.upperBound(now));

      rangeRequest.onerror = () => reject(rangeRequest.error);
      rangeRequest.onsuccess = () => {
        const expiredQueries = rangeRequest.result as CachedQueryResult[];
        expiredQueries.forEach(query => {
          store.delete(query.id);
          queriesDeleted++;
        });
        resolve();
      };
    });

    // Clean up expired collections
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([STORES.COLLECTIONS], 'readwrite');
      const store = tx.objectStore(STORES.COLLECTIONS);
      const index = store.index('expiresAt');

      const rangeRequest = index.getAll(IDBKeyRange.upperBound(now));

      rangeRequest.onerror = () => reject(rangeRequest.error);
      rangeRequest.onsuccess = () => {
        const expiredCollections = rangeRequest.result as StoredCollection[];
        expiredCollections.forEach(collection => {
          store.delete(collection.name);
          collectionsDeleted++;
        });
        resolve();
      };
    });

    // Update metadata
    const metadata = await this.getMetadata();
    if (metadata) {
      metadata.lastCleanup = now;
      await this.setMetadata(metadata);
    }

    console.log(`IndexedDB cleanup: Deleted ${queriesDeleted} queries, ${collectionsDeleted} collections`);

    return { queriesDeleted, collectionsDeleted };
  }

  /**
   * Clear all data from IndexedDB
   * Use with caution!
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        [STORES.QUERY_RESULTS, STORES.COLLECTIONS, STORES.EXECUTION_HISTORY, STORES.METADATA],
        'readwrite'
      );

      Object.values(STORES).forEach(storeName => {
        if (tx.objectStoreNames.contains(storeName)) {
          tx.objectStore(storeName).clear();
        }
      });

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
    });
  }

  /**
   * Get database size statistics
   */
  async getDbStats(): Promise<{
    queryResults: number;
    collections: number;
    executionRecords: number;
    estimatedSize: string;
  }> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const counts = {
      queryResults: 0,
      collections: 0,
      executionRecords: 0,
      estimatedSize: '0 MB',
    };

    // Count query results
    await new Promise<void>(resolve => {
      const tx = this.db!.transaction([STORES.QUERY_RESULTS], 'readonly');
      const store = tx.objectStore(STORES.QUERY_RESULTS);
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        counts.queryResults = countRequest.result;
        resolve();
      };
    });

    // Count collections
    await new Promise<void>(resolve => {
      const tx = this.db!.transaction([STORES.COLLECTIONS], 'readonly');
      const store = tx.objectStore(STORES.COLLECTIONS);
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        counts.collections = countRequest.result;
        resolve();
      };
    });

    // Count execution records
    await new Promise<void>(resolve => {
      const tx = this.db!.transaction([STORES.EXECUTION_HISTORY], 'readonly');
      const store = tx.objectStore(STORES.EXECUTION_HISTORY);
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        counts.executionRecords = countRequest.result;
        resolve();
      };
    });

    // Estimate size (rough calculation)
    const metadata = await this.getMetadata();
    if (metadata) {
      const sizeInBytes = metadata.dbSize;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      counts.estimatedSize = `${sizeInMB} MB`;
    }

    return counts;
  }

  /**
   * Update metadata with current stats
   */
  private async updateMetadata(): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata) {
      const stats = await this.getDbStats();
      metadata.totalCached = stats.queryResults;
      metadata.totalCollections = stats.collections;
      await this.setMetadata(metadata);
    }
  }

  /**
   * Generate cache key from code and solution
   */
  private generateCacheKey(code: string, solution: string): string {
    // Simple hash for cache key
    const combined = code + '||' + solution;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `cache-${Math.abs(hash)}`;
  }

  /**
   * Start automatic cleanup interval
   */
  private startAutoCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(err => console.error('Cleanup error:', err));
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy the database connection
   */
  async destroy(): Promise<void> {
    this.stopAutoCleanup();
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
export type { CachedQueryResult, StoredCollection, ExecutionRecord, DbMetadata };