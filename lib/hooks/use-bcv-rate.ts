'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BcvRateInfo } from '@/lib/bcv';

// Singleton in-memory state shared across all components in the client
let globalBcvData: BcvRateInfo | null = null;
let globalLoading = false;
let globalListeners: Array<(data: BcvRateInfo | null, loading: boolean) => void> = [];

const LOCAL_STORAGE_KEY = 'bites_last_known_bcv';

function notifyListeners() {
  for (const listener of globalListeners) {
    listener(globalBcvData, globalLoading);
  }
}

async function fetchBcvRateInternal(forceRefresh = false): Promise<BcvRateInfo | null> {
  globalLoading = true;
  notifyListeners();

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}${basePath}/api/bcv${forceRefresh ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const data: BcvRateInfo = await res.json();
      globalBcvData = data;
      try {
        if (typeof window !== 'undefined' && !data.isStale && data.source !== 'manual_override') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
      } catch {
        // Ignorar si localStorage no está disponible
      }
      return data;
    }
  } catch (err) {
    console.warn('[useBcvRate] Error al obtener tasa BCV:', err);
    // Recuperar de localStorage si no hay datos en memoria
    if (!globalBcvData && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          globalBcvData = {
            ...parsed,
            isStale: true,
            notes: 'Sin conexión. Mostrando última tasa guardada en el dispositivo.',
          };
        }
      } catch {}
    }
  } finally {
    globalLoading = false;
    notifyListeners();
  }
  return globalBcvData;
}

function getInitialBcvData(): BcvRateInfo | null {
  if (globalBcvData) return globalBcvData;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        globalBcvData = { ...parsed, isStale: false };
        return globalBcvData;
      }
    } catch {}
  }
  return null;
}

export function useBcvRate() {
  const [bcvData, setBcvData] = useState<BcvRateInfo | null>(getInitialBcvData);
  const [loading, setLoading] = useState<boolean>(globalLoading);

  useEffect(() => {
    const listener = (data: BcvRateInfo | null, isLoading: boolean) => {
      setBcvData(data);
      setLoading(isLoading);
    };

    globalListeners.push(listener);

    // Si aún no se ha hecho la primera petición o está vacía, ejecutarla
    if (!globalBcvData && !globalLoading) {
      fetchBcvRateInternal();
    }

    // Auto-actualización cada 15 minutos
    const interval = setInterval(() => {
      fetchBcvRateInternal(true);
    }, 15 * 60 * 1000);

    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
      clearInterval(interval);
    };
  }, []);

  const refresh = useCallback(async () => {
    return fetchBcvRateInternal(true);
  }, []);

  const setManualRate = useCallback(async (manualRate: number) => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
      const res = await fetch(`${origin}${basePath}/api/bcv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualRate }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.rateInfo) {
          globalBcvData = json.rateInfo;
          notifyListeners();
          return json.rateInfo;
        }
      }
    } catch (err) {
      console.error('[useBcvRate] Error al fijar tasa manual:', err);
    }
    return null;
  }, []);

  const clearManualRate = useCallback(async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
      const res = await fetch(`${origin}${basePath}/api/bcv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearManual: true }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.rateInfo) {
          globalBcvData = json.rateInfo;
          notifyListeners();
          return json.rateInfo;
        }
      }
    } catch (err) {
      console.error('[useBcvRate] Error al limpiar tasa manual:', err);
    }
    return null;
  }, []);

  // Tasa numérica efectiva (si no ha cargado, retorna 886.22 como salvaguarda)
  const currentRate = bcvData?.rate || 886.22;

  return {
    bcvData,
    rate: currentRate,
    formattedRate: bcvData?.formattedRate || currentRate.toFixed(2),
    loading,
    isStale: bcvData?.isStale || false,
    source: bcvData?.source || 'fallback',
    date: bcvData?.date || new Date().toISOString().split('T')[0],
    refresh,
    setManualRate,
    clearManualRate,
  };
}
