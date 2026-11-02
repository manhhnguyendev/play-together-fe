import { useCallback } from 'react';
import { hobbyService } from '@/api/services/catalog';
import { useAppRouter } from '@/hooks/useAppRouter';

export function useContinueAfterSignIn() {
  const router = useAppRouter();

  return useCallback(
    async (userId: string) => {
      try {
        const hobbies = await hobbyService.getOfUser(userId);
        if (hobbies.content.length === 0) {
          router.replace('/onboarding/take-categories');
          return;
        }
      } catch {
        // On a failed hobby lookup the user can still pick games from the profile.
      }
      router.replace('/(tabs)/home');
    },
    [router],
  );
}
