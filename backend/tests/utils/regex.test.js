const { escapeRegex } = require('../../utils/regex');

describe('escapeRegex', () => {
  it('returns plain strings unchanged', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
    expect(escapeRegex('')).toBe('');
  });

  it('escapes every regex metacharacter', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('produces a pattern that matches the literal input', () => {
    const input = 'a+b (c)[d].*';
    expect(new RegExp(escapeRegex(input)).test(input)).toBe(true);
  });

  it('neutralises a ReDoS style pattern', () => {
    const malicious = '(a+)+$';
    const pattern = new RegExp(escapeRegex(malicious));
    expect(pattern.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaa!')).toBe(false);
    expect(pattern.test('x(a+)+$y')).toBe(true);
  });

  it('returns an empty string for non-string input', () => {
    expect(escapeRegex(undefined)).toBe('');
    expect(escapeRegex(null)).toBe('');
    expect(escapeRegex(42)).toBe('');
    expect(escapeRegex({ $ne: null })).toBe('');
    expect(escapeRegex(['a'])).toBe('');
  });
});
