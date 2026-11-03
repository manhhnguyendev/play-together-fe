import { googleFailureMessage } from '../googleFailureMessage';

describe('googleFailureMessage', () => {
  it('names the redirect-URI fix instead of a dead button', () => {
    expect(
      googleFailureMessage({
        code: 'redirect_uri_mismatch',
        description: 'If you\'re setting your redirect URI on the Credentials page of the Console',
      }),
    ).toBe(
      'Google không nhận URL chuyển hướng của app. Thêm đúng URL đó vào mục Redirect URI của OAuth client trên Google Cloud.',
    );
  });

  it('treats a consent-screen cancel as the user\'s own action, not a failure', () => {
    expect(googleFailureMessage({ code: 'access_denied' })).toBe(
      'Bạn đã hủy trên màn hình Google.',
    );
  });

  it('separates a wrong client type from an unknown client ID', () => {
    expect(googleFailureMessage({ code: 'unauthorized_client' })).toContain('Web client');
    expect(googleFailureMessage({ code: 'invalid_client' })).toContain(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    );
  });

  it('keeps an unrecognised code visible so it can be searched', () => {
    expect(googleFailureMessage({ code: 'some_new_google_code' })).toBe(
      'Đăng nhập Google thất bại. (some_new_google_code)',
    );
  });

  it('falls back to Google\'s own text when there is no code to map', () => {
    expect(googleFailureMessage({ description: 'Cookies are disabled or blocked' })).toBe(
      'Đăng nhập Google thất bại. — Cookies are disabled or blocked',
    );
  });

  it('says nothing invented when Google returns nothing', () => {
    expect(googleFailureMessage({})).toBe('Đăng nhập Google thất bại.');
    expect(googleFailureMessage({ code: null, description: null })).toBe(
      'Đăng nhập Google thất bại.',
    );
  });

  it('truncates a long description — the toast dismisses itself before a paragraph ends', () => {
    const message = googleFailureMessage({
      code: 'unknown_thing',
      description: 'x'.repeat(400),
    });
    expect(message.length).toBeLessThanOrEqual(
      'Đăng nhập Google thất bại. (unknown_thing) — '.length + 140,
    );
    expect(message.endsWith('…')).toBe(true);
  });

  it('collapses the newlines Google pads its descriptions with', () => {
    expect(
      googleFailureMessage({ code: 'z', description: '  a\n\tb   c  ' }),
    ).toBe('Đăng nhập Google thất bại. (z) — a b c');
  });

  it('never leaks Google\'s English explanation once a code is mapped', () => {
    const message = googleFailureMessage({
      code: 'unsupported_response_type',
      description: 'The authorization server does not support obtaining an authorization code',
    });
    expect(message).not.toContain('authorization server');
    expect(message).toContain('id_token');
  });
});
