'use client';
import { useEffect, useState } from 'react';
import api from './api';

export interface Tag { _id: string; name: string; type: string; color: string; colorSelected: string; }

let cache: Tag[] | null = null;
let promise: Promise<Tag[]> | null = null;

export function useTags() {
  const [tags, setTags] = useState<Tag[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) { setTags(cache); setLoading(false); return; }
    if (!promise) promise = api.get('/tags').then(r => { cache = r.data; return cache!; });
    promise.then(t => { setTags(t); setLoading(false); });
  }, []);

  const refresh = async () => {
    cache = null; promise = null;
    const { data } = await api.get('/tags');
    cache = data; setTags(data);
  };

  return { tags, loading, refresh };
}

// Call this from Settings page after tag mutation to invalidate cache
export function invalidateTagCache() { cache = null; promise = null; }
