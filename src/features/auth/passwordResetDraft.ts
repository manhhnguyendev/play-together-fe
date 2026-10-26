interface PasswordResetDraft {
  email: string;
  token: string;
}

let draft: PasswordResetDraft | null = null;

export const passwordResetDraft = {
  set(value: PasswordResetDraft) {
    draft = value;
  },
  get() {
    return draft;
  },
  clear() {
    draft = null;
  },
};
