import { PasswordPolicyService } from '@/lib/auth/password-policy';

describe('PasswordPolicyService', () => {
  it('rejects weak passwords', () => {
    const result = PasswordPolicyService.validatePassword('123456');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts strong passwords', () => {
    const result = PasswordPolicyService.validatePassword('SecureP@ssw0rd2024!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects passwords containing personal info', () => {
    const result = PasswordPolicyService.validatePassword('AliceSecure1!', {
      email: 'alice@example.com',
      name: 'Alice Admin',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => /personal/i.test(error))).toBe(true);
  });

  it('generates strong passwords that pass validation', () => {
    const password = PasswordPolicyService.generateStrongPassword(20);
    const result = PasswordPolicyService.validatePassword(password);
    expect(password.length).toBe(20);
    expect(result.isValid).toBe(true);
  });

  it('reports each character-class requirement separately', () => {
    expect(
      PasswordPolicyService.validatePassword('alllowercase1!').errors
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/uppercase/i),
      ])
    );
    expect(
      PasswordPolicyService.validatePassword('ALLUPPERCASE1!').errors
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/lowercase/i),
      ])
    );
    expect(
      PasswordPolicyService.validatePassword('NoNumbersHere!').errors
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/number/i),
      ])
    );
    expect(
      PasswordPolicyService.validatePassword('NoSpecialChars1').errors
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/special character/i),
      ])
    );
  });

  it('rejects common passwords even when otherwise complex-looking', () => {
    const result = PasswordPolicyService.validatePassword('password');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => /common/i.test(error))).toBe(true);
  });

  it('scores password strength across weak and strong inputs', () => {
    const weak = PasswordPolicyService.getPasswordStrength('abc');
    const medium = PasswordPolicyService.getPasswordStrength('Password1');
    const strong = PasswordPolicyService.getPasswordStrength(
      'SecureP@ssw0rd2024!'
    );
    const common = PasswordPolicyService.getPasswordStrength('password');

    expect(weak.score).toBeLessThan(strong.score);
    expect(weak.feedback.length).toBeGreaterThan(0);
    expect(medium.feedback.length).toBeGreaterThan(0);
    expect(strong.strength).toMatch(/Good|Strong/);
    expect(common.score).toBeLessThanOrEqual(2);
  });

  it('generates default-length strong passwords', () => {
    const password = PasswordPolicyService.generateStrongPassword();
    expect(password.length).toBe(16);
    expect(PasswordPolicyService.validatePassword(password).isValid).toBe(true);
  });
});
