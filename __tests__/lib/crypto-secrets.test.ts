import {
  decryptSecret,
  encryptSecret,
  hashBackupCode,
  isEncryptedSecret,
  matchAndConsumeBackupCode,
  SECRET_CIPHER_PREFIX,
} from '@/lib/crypto/secrets';

const TEST_KEY =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

describe('crypto secrets', () => {
  it('encrypts and decrypts round-trip', () => {
    const plain = 'JBSWY3DPEHPK3PXP';
    const cipher = encryptSecret(plain);
    expect(cipher.startsWith(SECRET_CIPHER_PREFIX)).toBe(true);
    expect(cipher).not.toContain(plain);
    expect(decryptSecret(cipher)).toBe(plain);
    expect(isEncryptedSecret(cipher)).toBe(true);
  });

  it('supports legacy plaintext decrypt for migration', () => {
    expect(decryptSecret('LEGACYPLAIN')).toBe('LEGACYPLAIN');
    expect(isEncryptedSecret('LEGACYPLAIN')).toBe(false);
  });

  it('hashes and matches backup codes', () => {
    const hash = hashBackupCode('AAAA-BBBB');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    const { matched, remaining } = matchAndConsumeBackupCode('AAAA-BBBB', [
      hash,
      hashBackupCode('CCCC-DDDD'),
    ]);
    expect(matched).toBe(true);
    expect(remaining).toEqual([hashBackupCode('CCCC-DDDD')]);
  });

  it('matches legacy plaintext backup codes', () => {
    const { matched, remaining } = matchAndConsumeBackupCode('old-code', [
      'OLD-CODE',
      'KEEP-ME',
    ]);
    expect(matched).toBe(true);
    expect(remaining).toEqual(['KEEP-ME']);
  });
});
