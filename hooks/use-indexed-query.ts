// hooks/use-indexed-query.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import indexedDBService from '@/lib/index-db'
import { MongoEngine } from '@/lib/mongo-engine';

interface QueryRequest {
  code: string;
  solution: string;
  collections: Record<string, any[]>;
}

interface QueryResult {
  userResult: any;
  expectedResult: any;
  isCorrect: boolean;
  cacheHit: boolean;
  executionTime: number;
}

interface UseIndexedDBQueryReturn {
  executeQuery: (request: QueryRequest) => Promise<QueryResult | null>;
  isLoading: boolean;
  clearCache: () => Promise<void>;
  getStats: () => Promise<any>;
  clearAll: () => Promise<void>;
}

/**
 * Hook to execute MongoDB queries with IndexedDB caching
 * 
 * Features:
 * - Automatic caching in IndexedDB (5 min TTL)
 * - Collections stored in IndexedDB (30 min TTL)
 * - Execution history tracking
 * - Query statistics (cache hit rate, avg execution time)
 * - Automatic cleanup of expired entries every 5 minutes
 * 
 * Usage:
 * const { executeQuery, isLoading } = useIndexedDBQuery();
 * 
 * const result = await executeQuery({
 *   code: userCode,
 *   solution: solutionCode,
 *   collections: collectionsData,
 * });
 */
export function useIndexedDBQuery(): UseIndexedDBQueryReturn {
  const engineRef = useRef<MongoEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize IndexedDB on mount
  useEffect(() => {
    if (!initPromiseRef.current) {
      initPromiseRef.current = indexedDBService.init()
        .then(() => {
          // Store collections in IndexedDB on init
          console.log('IndexedDB initialized');
        })
        .catch(err => {
          console.error('Failed to initialize IndexedDB:', err);
        });
    }

    return () => {
      // Cleanup on unmount
      // Don't destroy, keep IndexedDB for persistence
      indexedDBService.stopAutoCleanup();
    };
  }, []);

  // Initialize MongoEngine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MongoEngine();
    }
  }, []);

  /**
   * Execute a query with IndexedDB caching
   */
  const executeQuery = useCallback(async (request: QueryRequest): Promise<QueryResult | null> => {
    if (!engineRef.current) {
      console.error('MongoEngine not initialized');
      return null;
    }

    setIsLoading(true);

    try {
      // Ensure IndexedDB is initialized
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }

      const startTime = performance.now();

      // Step 1: Check if result is cached in IndexedDB
      const cachedResult = await indexedDBService.getCachedQueryResult(
        request.code,
        request.solution
      );

      if (cachedResult) {
        const executionTime = performance.now() - startTime;

        // Record this cache hit
        await indexedDBService.recordExecution(
          request.code,
          request.solution,
          cachedResult.isCorrect,
          cachedResult.executionTime,
          true // cacheHit = true
        );

        return {
          userResult: cachedResult.userResult,
          expectedResult: cachedResult.expectedResult,
          isCorrect: cachedResult.isCorrect,
          cacheHit: true,
          executionTime,
        };
      }

      // Step 2: No cache hit, check if collections are in IndexedDB
      let collectionsToUse = request.collections;
      const storedCollections = await indexedDBService.getStoredCollections();

      if (storedCollections) {
        collectionsToUse = storedCollections;
      } else {
        // Store fresh collections in IndexedDB for future use
        await indexedDBService.storeCollections(request.collections);
      }

      // Step 3: Execute query using MongoEngine (in-memory, fast)
      const userResult = await engineRef.current.execute(request.code);
      const expectedResult = await engineRef.current.execute(request.solution);

      // Step 4: Compare results
      const isCorrect = compareResults(userResult, expectedResult);
      const executionTime = performance.now() - startTime;

      // Step 5: Cache the result in IndexedDB
      await indexedDBService.cacheQueryResult(
        request.code,
        request.solution,
        userResult,
        expectedResult,
        isCorrect,
        executionTime,
        5 // 5 minute TTL
      );

      // Step 6: Record execution in history
      await indexedDBService.recordExecution(
        request.code,
        request.solution,
        isCorrect,
        executionTime,
        false // cacheHit = false
      );

      return {
        userResult,
        expectedResult,
        isCorrect,
        cacheHit: false,
        executionTime,
      };

    } catch (error) {
      console.error('Query execution error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Compare two results for equality
   * Handles deep comparison and normalization
   */
  const compareResults = (userResult: any, expectedResult: any): boolean => {
    try {
      // Normalize both results
      const userNorm = JSON.stringify(
        normalizeForComparison(userResult)
      );
      const expectedNorm = JSON.stringify(
        normalizeForComparison(expectedResult)
      );

      return userNorm === expectedNorm;
    } catch {
      return false;
    }
  };

  /**
   * Normalize results for comparison
   * Ensures key ordering doesn't affect equality
   */
  const normalizeForComparison = (value: any): any => {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      return value.map(item => normalizeForComparison(item));
    }

    if (typeof value === 'object') {
      const normalized: any = {};
      Object.keys(value)
        .sort() // Sort keys for consistent comparison
        .forEach(key => {
          normalized[key] = normalizeForComparison(value[key]);
        });
      return normalized;
    }

    return value;
  };

  /**
   * Clear all cached query results
   * Keep collections and history
   */
  const clearCache = useCallback(async () => {
    try {
      // Instead of clearing all, we just let auto-cleanup handle it
      // Or manually trigger cleanup to remove expired entries
      const result = await indexedDBService.cleanup();
      console.log('Cache cleared:', result);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  /**
   * Get execution statistics
   */
  const getStats = useCallback(async () => {
    try {
      const stats = await indexedDBService.getExecutionStats(7); // Last 7 days
      const dbStats = await indexedDBService.getDbStats();
      return {
        ...stats,
        ...dbStats,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }, []);

  /**
   * Clear all IndexedDB data
   * This is destructive - use with caution!
   */
  const clearAll = useCallback(async () => {
    try {
      await indexedDBService.clearAll();
      console.log('All IndexedDB data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, []);

  return {
    executeQuery,
    isLoading,
    clearCache,
    getStats,
    clearAll,
  };
}

export type { QueryResult, QueryRequest };