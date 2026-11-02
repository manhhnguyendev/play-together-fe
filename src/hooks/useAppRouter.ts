import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { claimPush, pushHrefKey } from '@/navigation/pushGuard';

/**
 * The app-wide router: every method of `useRouter`, except that `push` ignores a
 * repeat of a destination that is still on its way in (see `pushGuard`). Screens
 * navigate through this so the guard cannot be forgotten.
 */
export function useAppRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();

  return useMemo(() => {
    const push: ReturnType<typeof useRouter>['push'] = (href, options) => {
      if (!claimPush(pushHrefKey(href))) return;
      router.push(href, options);
    };

    return { ...router, push };
  }, [router]);
}
