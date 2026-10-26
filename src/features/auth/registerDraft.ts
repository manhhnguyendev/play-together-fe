import type { TempRegisterModel } from '@/api/types';

let draft: TempRegisterModel | null = null;

export const registerDraft = {
  set(value: TempRegisterModel) {
    draft = value;
  },
  get() {
    return draft;
  },
  clear() {
    draft = null;
  },
};
