import {
  addHours,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  formatVnd,
  isEmptyDate,
  parseAmount,
  secondsBetween,
} from '@/lib/format';

describe('formatVnd', () => {
  it('groups thousands with dots and appends the dong sign', () => {
    expect(formatVnd(10000)).toBe('10.000 đ');
    expect(formatVnd(1000000)).toBe('1.000.000 đ');
    expect(formatVnd(1234567)).toBe('1.234.567 đ');
    expect(formatVnd(0)).toBe('0 đ');
  });

  it('rounds before grouping, so a fraction never leaks into the UI', () => {
    expect(formatVnd(50000.6)).toBe('50.001 đ');
  });

  it('keeps the minus sign outside the groups', () => {
    expect(formatVnd(-250000)).toBe('-250.000 đ');
  });

  it('treats null and undefined as zero instead of printing "null đ"', () => {
    expect(formatVnd(null)).toBe('0 đ');
    expect(formatVnd(undefined)).toBe('0 đ');
  });
});

describe('formatNumber / parseAmount', () => {
  it('formats a count without the currency suffix', () => {
    expect(formatNumber(24)).toBe('24');
    expect(formatNumber(1500000)).toBe('1.500.000');
    expect(formatNumber(null)).toBe('0');
  });

  it('reads back what the amount fields are typed as', () => {
    expect(parseAmount('12.000')).toBe(12000);
    expect(parseAmount('50 000 đ')).toBe(50000);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('')).toBe(0);
  });
});

describe('dates', () => {
  it('prints the day before the month, the way the Vietnamese screens read it', () => {
    expect(formatDate('2026-11-02T14:30:00')).toBe('02/11/2026');
    expect(formatDateTime('2026-11-02T14:30:00')).toBe('14:30 02/11/2026');
    expect(formatTime('2026-11-02T04:05:00')).toBe('04:05');
  });

  it('returns an empty string for nothing and the raw text for garbage', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDateTime('chưa rõ')).toBe('chưa rõ');
  });

  it('recognises the zero date the .NET-era API used for "never"', () => {
    expect(isEmptyDate('0001-01-01T00:00:00Z')).toBe(true);
    expect(isEmptyDate(null)).toBe(true);
    expect(isEmptyDate('2026-11-02T14:30:00Z')).toBe(false);
  });

  it('does the arithmetic the complaint window and countdowns depend on', () => {
    expect(secondsBetween('2026-11-02T14:00:00Z', '2026-11-02T14:01:30Z')).toBe(90);
    expect(secondsBetween('2026-11-02T14:00:00Z', 'not a date')).toBe(0);
    expect(addHours('2026-11-02T14:00:00.000Z', 6)).toBe('2026-11-02T20:00:00.000Z');
  });
});
