import { useState, useCallback } from 'react';
import { get, post, patch, del } from '../api/client';
import toast from 'react-hot-toast';

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      switch (method) {
        case 'GET':
          res = await get(url, data);
          break;
        case 'POST':
          res = await post(url, data, options);
          break;
        case 'PATCH':
          res = await patch(url, data);
          break;
        case 'DELETE':
          res = await del(url);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred';
      setError(message);
      if (!options.silent) {
        toast.error(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const apiGet = useCallback((url, params, opts) => request('GET', url, params, opts), [request]);
  const apiPost = useCallback((url, data, opts) => request('POST', url, data, opts), [request]);
  const apiPatch = useCallback((url, data, opts) => request('PATCH', url, data, opts), [request]);
  const apiDelete = useCallback((url, opts) => request('DELETE', url, null, opts), [request]);

  return { loading, error, apiGet, apiPost, apiPatch, apiDelete };
}
