jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

const ORIGINAL_MASTER_KEY = process.env.PASSWORD_MASTER_KEY;

const loadService = () => {
  let service;
  jest.isolateModules(() => {
    service = require('../../services/passwordService');
  });
  return service;
};

describe('passwordService', () => {
  beforeEach(() => {
    process.env.PASSWORD_MASTER_KEY = 'test-master-key';
  });

  afterAll(() => {
    if (ORIGINAL_MASTER_KEY === undefined) {
      delete process.env.PASSWORD_MASTER_KEY;
    } else {
      process.env.PASSWORD_MASTER_KEY = ORIGINAL_MASTER_KEY;
    }
  });

  describe('encrypt / decrypt', () => {
    it('round-trips a plaintext password', () => {
      const { encrypt, decrypt } = loadService();
      const encrypted = encrypt('S3cret!Pass', 'user-salt');
      expect(decrypt(encrypted, 'user-salt')).toBe('S3cret!Pass');
    });

    it('round-trips unicode and empty plaintext', () => {
      const { encrypt, decrypt } = loadService();
      expect(decrypt(encrypt('påsswørd — 密码', 'salt'), 'salt')).toBe('påsswørd — 密码');
      expect(decrypt(encrypt('', 'salt'), 'salt')).toBe('');
    });

    it('produces salt:iv:authTag:ciphertext and never leaks the plaintext', () => {
      const { encrypt } = loadService();
      const parts = encrypt('S3cret!Pass', 'user-salt').split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toHaveLength(64); // 32-byte salt, hex
      expect(parts[1]).toHaveLength(32); // 16-byte IV, hex
      expect(parts[2]).toHaveLength(32); // 16-byte auth tag, hex
      expect(parts[3]).not.toContain('S3cret!Pass');
    });

    it('produces a different ciphertext each time for the same input', () => {
      const { encrypt, decrypt } = loadService();
      const a = encrypt('same', 'salt');
      const b = encrypt('same', 'salt');
      expect(a).not.toBe(b);
      expect(decrypt(a, 'salt')).toBe(decrypt(b, 'salt'));
    });

    it('fails to decrypt with a different user salt', () => {
      const { encrypt, decrypt } = loadService();
      const encrypted = encrypt('S3cret!Pass', 'user-salt');
      expect(() => decrypt(encrypted, 'other-salt')).toThrow('Failed to decrypt password');
    });

    it('fails to decrypt tampered ciphertext', () => {
      const { encrypt, decrypt } = loadService();
      const parts = encrypt('S3cret!Pass', 'user-salt').split(':');
      parts[3] = parts[3].replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
      expect(() => decrypt(parts.join(':'), 'user-salt')).toThrow('Failed to decrypt password');
    });

    it('rejects malformed encrypted data', () => {
      const { decrypt } = loadService();
      expect(() => decrypt('not-encrypted', 'salt')).toThrow('Failed to decrypt password');
      expect(() => decrypt('a:b:c', 'salt')).toThrow('Failed to decrypt password');
    });

    it('throws when PASSWORD_MASTER_KEY is missing', () => {
      delete process.env.PASSWORD_MASTER_KEY;
      const { encrypt } = loadService();
      expect(() => encrypt('S3cret!Pass', 'salt')).toThrow('Failed to encrypt password');
    });

    it('cannot decrypt data encrypted under a different master key', () => {
      const { encrypt } = loadService();
      const encrypted = encrypt('S3cret!Pass', 'salt');

      process.env.PASSWORD_MASTER_KEY = 'a-different-master-key';
      const { decrypt } = loadService();
      expect(() => decrypt(encrypted, 'salt')).toThrow('Failed to decrypt password');
    });
  });

  describe('generatePassword', () => {
    it('defaults to 16 characters from the full charset', () => {
      const { generatePassword } = loadService();
      expect(generatePassword()).toHaveLength(16);
    });

    it('honours the requested length', () => {
      const { generatePassword } = loadService();
      expect(generatePassword(1)).toHaveLength(1);
      expect(generatePassword(64)).toHaveLength(64);
      expect(generatePassword(0)).toBe('');
    });

    it('restricts the charset to the enabled options', () => {
      const { generatePassword } = loadService();
      const digitsOnly = generatePassword(50, {
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false
      });
      expect(digitsOnly).toMatch(/^[0-9]{50}$/);

      const lowerOnly = generatePassword(50, {
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false
      });
      expect(lowerOnly).toMatch(/^[a-z]{50}$/);
    });

    it('falls back to alphanumerics when every option is disabled', () => {
      const { generatePassword } = loadService();
      const password = generatePassword(50, {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false
      });
      expect(password).toMatch(/^[a-zA-Z0-9]{50}$/);
    });

    it('returns a different password on each call', () => {
      const { generatePassword } = loadService();
      const passwords = new Set(Array.from({ length: 20 }, () => generatePassword(24)));
      expect(passwords.size).toBe(20);
    });
  });
});
