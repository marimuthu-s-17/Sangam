import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook with loading/error states.
 * @param {Function} fetchFn - The async function to call
 * @param {Array} deps - Dependencies to trigger re-fetch
 * @param {boolean} immediate - Whether to fetch immediately
 */
export default function useApi(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, execute, refetch };
}
