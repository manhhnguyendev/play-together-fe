import {
  MAX_MESSAGE_LENGTH,
  OTP_LENGTH,
  isSixDigitOtp,
  messages,
  passwordRules,
  validateConfirmPassword,
  validateEmail,
  validateStrongPassword,
} from '@/lib/validators';

describe('email', () => {
  it('asks for a value before judging its shape', () => {
    expect(validateEmail('')).toBe(messages.emailNull);
    expect(validateEmail('   ')).toBe(messages.emailNull);
  });

  it('accepts the addresses the demo and Google accounts use', () => {
    expect(validateEmail('demo.player1@playtogether.local')).toBeNull();
    expect(validateEmail('someone@gmail.com')).toBeNull();
  });

  it('rejects anything without a dotted domain', () => {
    expect(validateEmail('no-at-sign')).toBe(messages.invalidEmail);
    expect(validateEmail('a@b')).toBe(messages.invalidEmail);
  });
});

describe('password', () => {
  it('accepts a password that satisfies every rule', () => {
    expect(validateStrongPassword('Demo@12345')).toBeNull();
    expect(passwordRules('Demo@12345').every((rule) => rule.satisfied)).toBe(true);
  });

  it('refuses each weakness on its own', () => {
    const failing = [
      'alllower1@',
      'ALLUPPER1@',
      'NoDigits!!',
      'NoSpecial1',
      'Aa1@',
      'waytoolongwaytoolongwaytoolongwaytoolong1@',
    ];
    failing.forEach((value) => {
      expect(validateStrongPassword(value)).toBe(messages.invalidPass);
    });
  });

  it('shows one unsatisfied rule per weakness, not a generic error', () => {
    const unsatisfied = passwordRules('nocaps1234')
      .filter((rule) => !rule.satisfied)
      .map((rule) => rule.label);
    expect(unsatisfied).toContain('Chữ hoa');
    expect(unsatisfied).toContain('Kí tự đặc biệt');
  });

  it('asks for the password before comparing the confirmation', () => {
    expect(validateConfirmPassword('Demo@12345', '')).toBe(messages.confirmNull);
    expect(validateConfirmPassword('Demo@12345', 'Demo@1234')).toBe(messages.matchPass);
    expect(validateConfirmPassword('Demo@12345', 'Demo@12345')).toBeNull();
  });
});

describe('otp', () => {
  it('needs exactly six digits, and the field length matches the check', () => {
    expect(OTP_LENGTH).toBe(6);
    expect(isSixDigitOtp('123456')).toBe(true);
    expect(isSixDigitOtp('12345')).toBe(false);
    expect(isSixDigitOtp('1234567')).toBe(false);
    expect(isSixDigitOtp('1234a6')).toBe(false);
  });
});

describe('message length', () => {
  it('caps hire, rating and report text at what the API column holds', () => {
    // varchar(500) behind a @MaxLength(500) DTO — see docs/product-audit.md §34.
    expect(MAX_MESSAGE_LENGTH).toBe(500);
  });
});
