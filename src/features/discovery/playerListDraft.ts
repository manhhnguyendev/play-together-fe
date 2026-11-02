import type { GetAllUserModel } from '@/api/types';

export interface PlayerListPayload {
  title: string;
  players: GetAllUserModel[];
}

let draft: PlayerListPayload | null = null;

export const playerListDraft = {
  set(payload: PlayerListPayload) {
    draft = payload;
  },
  /**
   * Read once and forget. The list screen keeps what it took at mount, so a
   * deep link or a return from the background can never render the list some
   * other rail handed over earlier.
   */
  take(): PlayerListPayload | null {
    const payload = draft;
    draft = null;
    return payload;
  },
};
