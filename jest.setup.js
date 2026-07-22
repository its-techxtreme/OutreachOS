// Jest setup file for testing utilities
require('@testing-library/jest-dom');

const React = require('react');

class MockHeaders {
  constructor(init = {}) {
    this.map = new Map(
      Object.entries(init).map(([key, value]) => [key.toLowerCase(), value])
    );
  }

  get(name) {
    return this.map.get(name.toLowerCase()) ?? null;
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), String(value));
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  entries() {
    return this.map.entries();
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  forEach(callback) {
    this.map.forEach((value, key) => callback(value, key, this));
  }

  [Symbol.iterator]() {
    return this.map.entries();
  }
}

class MockRequest {
  constructor(input, init = {}) {
    const urlValue = typeof input === 'string' ? input : input.url;
    Object.defineProperty(this, 'url', {
      value: urlValue,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    this.method = init.method || 'GET';
    this.headers = new MockHeaders(init.headers || {});
    this._body = init.body;
  }

  async json() {
    return JSON.parse(this._body);
  }

  async text() {
    return this._body ?? '';
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.headers = new MockHeaders(init.headers || {});
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    });
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

global.Request = MockRequest;
global.Headers = MockHeaders;
global.Response = MockResponse;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    p: ({ children, initial, animate, transition, ...props }) => {
      const React = require('react');
      return React.createElement('p', props, children);
    },
  },
  useReducedMotion: () => true,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) =>
    React.createElement('img', { src, alt, ...props }),
}));

jest.mock('otpauth', () => {
  class Secret {
    constructor(options) {
      this.base32 =
        typeof options === 'string' ? options : 'JBSWY3DPEHPK3PXP';
    }
    static fromBase32(value) {
      return new Secret(value);
    }
  }

  class TOTP {
    constructor(options) {
      this.secret = options.secret;
    }
    toString() {
      return `otpauth://totp/OutreachOS?secret=${this.secret.base32}`;
    }
    generate() {
      return '123456';
    }
    validate({ token }) {
      return token === '123456' ? 0 : null;
    }
  }

  return { Secret, TOTP, HOTP: class {}, URI: {}, version: '0.0.0' };
});

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn(async () => 'data:image/png;base64,aaa'),
  },
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-admin-user',
      email: 'admin@test.com',
      app_metadata: { roles: ['admin'] },
      user_metadata: {},
    },
    session: {
      user: { id: 'test-admin-user', email: 'admin@test.com' },
      access_token: 'test-token',
    },
    loading: false,
    error: null,
    isAuthenticated: true,
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    clearError: jest.fn(),
  })),
  AuthProvider: ({ children }) => children,
}));

jest.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    })),
  })),
}));

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(async () => ({
    id: 'test-admin-user',
    email: 'admin@test.com',
    app_metadata: { roles: ['admin'] },
    user_metadata: {},
  })),
  requireServerAuth: jest.fn(async () => ({
    id: 'test-admin-user',
    email: 'admin@test.com',
    app_metadata: { roles: ['admin'] },
    user_metadata: {},
  })),
  unauthorizedJsonResponse: jest.fn((requestId) =>
    global.Response.json(
      { error: 'Unauthorized', ...(requestId ? { requestId } : {}) },
      { status: 401 }
    )
  ),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      exchangeCodeForSession: jest.fn(),
    },
  })),
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      exchangeCodeForSession: jest.fn(),
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.AGENT_SECRET = 'test-agent-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
