# Security notes

Auth, secrets, and RLS expectations for OutreachOS. Code samples below are illustrative — prefer the live routes under `src/app/api/`.

## Legacy agent route

`POST /api/agent/leads` still exists from an early ChatGPT experiment (**scrapped as a product feature**). If the env var is set, it expects header `X-Agent-Secret` matching `AGENT_SECRET`. Normal users should use Excel import instead.
```typescript
// illustrative — real route lives under src/app/api/agent/leads
export async function POST(request: Request) {
  const agentSecret = request.headers.get('X-Agent-Secret');

  if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // …insert lead
}
```

Keep `AGENT_SECRET` in Vercel env only. Rotate it when you need to. Log failed attempts without printing the secret.

## Service role key

`SUPABASE_SERVICE_ROLE_KEY` must **never** be:
- Bundled into the client-side build
- Exposed in browser environments
- Shared in client bundles or public docs
- Logged or transmitted in plain text

#### Example (server client)
```typescript
// lib/supabase-server.ts - Server-side only
import { createClient } from '@supabase/supabase-js';

// This should ONLY be imported in API routes and server components
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVER SIDE ONLY
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// lib/supabase-client.ts - Client-side safe
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // PUBLIC KEY ONLY
);
```

## Database Security (Row Level Security)

### RLS Configuration
Row Level Security (RLS) must be enabled on the `leads` table in the Supabase production console to prevent unauthorized data access.

#### Required RLS Policies
```sql
-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin Full Access (Authenticated Users)
CREATE POLICY "Admin full access" ON leads
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Service Role Access (API Routes)  
CREATE POLICY "Service role access" ON leads
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Deny Anonymous Access
CREATE POLICY "Deny anonymous access" ON leads
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Policy 4: Read-only for specific operations (optional)
CREATE POLICY "Read only for reports" ON leads
    FOR SELECT
    USING (auth.role() = 'authenticated');
```

### Data Access Control
All data selection, updates, and deletion rights are restricted to authenticated admin accounts via native Supabase Auth sessions. The unauthenticated public API key has **zero** read permissions.

#### Access Matrix
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|---------|---------|---------|---------|
| Anonymous | ❌ | ❌ | ❌ | ❌ |
| Authenticated Admin | ✅ | ✅ | ✅ | ✅ |
| Service Role (API) | ✅ | ✅ | ✅ | ❌ |

## Input Validation & Sanitization

### Request Validation Schema
```typescript
import { z } from 'zod';

export const LeadSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  niche: z.string().min(1).max(100).trim(),
  country: z.string().min(1).max(100).trim(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  maps_url: z.string().url().max(2000),
});

export const LeadSubmissionSchema = z.object({
  lead: LeadSchema,
  metadata: z.object({
    source: z.string().default('chatgpt'),
    version: z.string().default('1.0'),
  }).optional(),
});
```

### SQL Injection Prevention
- **Parameterized Queries:** All database queries use parameterized statements via Supabase client
- **Input Sanitization:** Zod schema validation before database operations
- **Type Safety:** TypeScript ensures type-safe database operations

### XSS Protection
```typescript
// Utility function for HTML sanitization
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
}

// Usage in components
const SafeLeadName = ({ name }: { name: string }) => {
  return <span>{sanitizeHtml(name)}</span>;
};
```

## Authentication & Authorization

### Admin Authentication Flow
```typescript
// lib/auth.ts
import { supabaseClient } from './supabase-client';

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }
  
  static async getSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
  }
  
  static async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }
}
```

### Route Protection Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect API routes (except agent endpoint)
  if (req.nextUrl.pathname.startsWith('/api') && 
      !req.nextUrl.pathname.startsWith('/api/agent')) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
```

## Rate Limiting & DDoS Protection

### API Rate Limiting
```typescript
// lib/rate-limiter.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'localhost';
    await limiter.check(100, ip); // 100 requests per minute per IP
    
    // Continue with request processing
  } catch {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
}
```

### CORS Configuration
```typescript
// app/api/agent/leads/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://chat.openai.com',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Secret',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { status: 200, headers });
  }

  // Process POST request with headers
  const response = NextResponse.json(data, { status: 200 });
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
```

## Security Monitoring & Logging

### Security Event Logging
```typescript
// lib/security-logger.ts
export enum SecurityEventType {
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  DATA_ACCESS_DENIED = 'DATA_ACCESS_DENIED',
}

export class SecurityLogger {
  static log(event: SecurityEventType, details: any, ip?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
    };

    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (DataDog, CloudWatch, etc.)
      console.error('SECURITY_EVENT', logEntry);
    } else {
      console.warn('Security Event:', logEntry);
    }
  }
}
```

### Intrusion Detection
```typescript
// lib/intrusion-detection.ts
export class IntrusionDetection {
  private static suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter)\b/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /onload|onerror|onclick/gi,
  ];

  static detectSuspiciousContent(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  static validateRequest(request: any): void {
    const content = JSON.stringify(request);
    
    if (this.detectSuspiciousContent(content)) {
      SecurityLogger.log(
        SecurityEventType.SUSPICIOUS_REQUEST,
        { content: content.substring(0, 1000) }
      );
      throw new Error('Suspicious content detected');
    }
  }
}
```

## Environment Security

### Environment Variable Management
```bash
# Production Environment Variables (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... # Public key (safe)
SUPABASE_SERVICE_ROLE_KEY=eyJ... # SECRET - Server only
AGENT_SECRET=your_complex_secret_key_here # SECRET
NEXTAUTH_SECRET=your_nextauth_secret # SECRET (if using NextAuth)
```

### Secret Rotation Strategy
1. **Regular Rotation:** Rotate secrets every 90 days
2. **Emergency Rotation:** Immediate rotation if compromise suspected
3. **Zero-Downtime:** Implement gradual secret rotation
4. **Documentation:** Maintain secure documentation of rotation procedures

## Security Audit Checklist

### Code Security
- [ ] No hardcoded secrets or API keys
- [ ] All environment variables properly configured
- [ ] Input validation implemented on all endpoints
- [ ] SQL injection protection via parameterized queries
- [ ] XSS protection with content sanitization

### Authentication & Authorization
- [ ] RLS policies correctly configured in Supabase
- [ ] Admin authentication required for dashboard access
- [ ] API authentication via X-Agent-Secret header
- [ ] Session management secure and properly configured

### Infrastructure Security
- [ ] HTTPS enforced for all connections
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting implemented and tested
- [ ] CORS properly configured and restrictive

### Monitoring & Incident Response
- [ ] Security event logging implemented
- [ ] Intrusion detection patterns configured
- [ ] Incident response procedures documented
- [ ] Security monitoring dashboards configured

### Compliance
- [ ] Data retention policies defined
- [ ] Privacy policy covers data collection
- [ ] GDPR compliance (if applicable)
- [ ] Regular security assessments scheduled