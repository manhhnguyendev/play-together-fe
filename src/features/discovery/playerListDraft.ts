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
  get() {
    return draft;
  },
  clear() {
    draft = null;
  },
};
