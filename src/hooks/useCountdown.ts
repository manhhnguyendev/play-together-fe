import { useEffect, useState } from 'react';
import { secondsBetween } from '@/lib/format';

export function useCountdown(target?: string | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return 0;
  return Math.max(0, secondsBetween(new Date().toISOString(), target));
}
