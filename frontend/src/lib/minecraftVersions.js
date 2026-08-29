import { useState, useEffect } from 'react';
import api from './api'; // Ensure we use the existing axios instance

export function useMinecraftVersions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/minecraft/versions')
      .then(res => {
        if (isMounted) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Failed to fetch Minecraft versions:", err);
          setError(err);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Helpers to get specific lists
  const getReleases = () => {
    if (!data || !data.versions) return [];
    return data.versions.filter(v => v.type === 'release');
  };

  const getSnapshots = () => {
    if (!data || !data.versions) return [];
    return data.versions.filter(v => v.type === 'snapshot');
  };

  const getAll = () => {
    if (!data || !data.versions) return [];
    return data.versions;
  };

  return {
    loading,
    error,
    latest: data?.latest || { release: '1.20.4', snapshot: '24w03a' }, // Fallback in case of failure
    getReleases,
    getSnapshots,
    getAll
  };
}
