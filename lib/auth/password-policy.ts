export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true,
};

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  'password123',
  'admin',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'abc123',
  'password1',
  'iloveyou',
  'admin123',
  'welcome1',
  'passw0rd',
]);

export type PasswordStrength =
  | 'Very Weak'
  | 'Weak'
  | 'Fair'
  | 'Good'
  | 'Strong';

export class PasswordPolicyService {
  static validatePassword(
    password: string,
    userInfo?: { email?: string; name?: string },
    policy: PasswordPolicyConfig = DEFAULT_PASSWORD_POLICY
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(
        `Password must be at least ${policy.minLength} characters long`
      );
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    if (
      policy.preventCommonPasswords &&
      COMMON_PASSWORDS.has(password.toLowerCase())
    ) {
      errors.push(
        'Password is too common. Please choose a more unique password'
      );
    }

    if (policy.preventPersonalInfo && userInfo) {
      const personalInfo = [
        userInfo.email?.split('@')[0],
        userInfo.name?.split(' ')[0],
        userInfo.name?.split(' ')[1],
      ].filter(Boolean) as string[];

      const lowercasePassword = password.toLowerCase();
      for (const info of personalInfo) {
        if (info.length >= 3 && lowercasePassword.includes(info.toLowerCase())) {
          errors.push('Password should not contain personal information');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static generateStrongPassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + specialChars;

    const chars: string[] = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      specialChars[Math.floor(Math.random() * specialChars.length)],
    ];

    for (let i = 4; i < length; i++) {
      chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }

  static getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    strength: PasswordStrength;
  } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    else if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Mix uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Include numbers');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score++;
    } else {
      feedback.push('Include special characters');
    }

    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common passwords');
    }

    const strengthLevels: PasswordStrength[] = [
      'Very Weak',
      'Weak',
      'Fair',
      'Good',
      'Strong',
    ];

    const cappedScore = Math.min(4, score);

    return {
      score: cappedScore,
      feedback,
      strength: strengthLevels[cappedScore],
    };
  }
}
