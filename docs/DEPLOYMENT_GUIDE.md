# Deployment Guide
**Production Setup & Configuration**

## Execution Directives

When building this project, use this guide as the deployment blueprint. Refer to individual sections when configuring production environments:

### Database Provisioning
Run the schema setup from the Technical Architecture document inside the Supabase SQL terminal.

### UI Components  
Invoke the /ui-ux-pro-max skill or use Google Stitch MCP to generate the visual mockups and frontend code matching the strict layout constraints in the UI Design System Guide.

### Security Layer
Ensure the Next.js endpoint logic perfectly matches the secure proxy data flow documented in the Technical Architecture and Security Requirements.

## Production Environment Setup

### Vercel Deployment Configuration

#### 1. Project Setup
```bash
# Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod
```

#### 2. Environment Variables (Vercel Dashboard)
```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# API Security
AGENT_SECRET=your_production_agent_secret_key

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 3. Build Configuration
```javascript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

### Supabase Production Configuration

#### 1. Database Setup
```sql
-- Run in Supabase SQL Editor (Production Instance)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create optimized leads table
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    maps_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_maps_url UNIQUE (maps_url),
    CONSTRAINT valid_status CHECK (status IN ('New', 'Contacted', 'Replied', 'Converted', 'Archived'))
);

-- Performance indexes
CREATE INDEX idx_leads_niche ON leads(niche);
CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_niche_country ON leads(niche, country);

-- GIN index for fuzzy search
CREATE INDEX idx_leads_name_gin ON leads USING gin (name gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access" ON leads
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role access" ON leads
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Deny anonymous access" ON leads
    FOR ALL
    USING (false);
```

#### 2. Performance Tuning
```sql
-- Update table statistics for query optimization
VACUUM ANALYZE leads;

-- Monitor query performance
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%leads%';
```

### Domain & SSL Configuration

#### 1. Custom Domain Setup (Optional)
```bash
# Add custom domain in Vercel Dashboard
# Configure DNS records:
# Type: CNAME
# Name: your-subdomain (or @)
# Value: your-app.vercel.app

# SSL Certificate (Automatic with Vercel)
# - Vercel automatically provisions SSL certificates
# - Supports custom domains with automatic renewal
```

#### 2. Security Headers Configuration
```javascript
// next.config.ts - Security Headers
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ];
},
```

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npx @next/bundle-analyzer

# Build performance
npm run build

# Performance audit
npm run audit:lighthouse
```

### Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC;

-- Index usage analysis
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'leads';
```

### CDN & Caching Strategy
- **Vercel Edge Network:** Automatic global CDN distribution
- **Static Assets:** Optimized caching for images, CSS, JS
- **API Routes:** Appropriate cache headers for dynamic content
- **Database:** Connection pooling via Supabase

## Monitoring & Analytics

### Application Monitoring
```javascript
// lib/monitoring.ts
export class ProductionMonitoring {
  static trackApiCall(endpoint: string, duration: number, status: number) {
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (DataDog, New Relic, etc.)
      console.log('API_METRIC', { endpoint, duration, status, timestamp: Date.now() });
    }
  }
  
  static trackError(error: Error, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('APPLICATION_ERROR', { 
        message: error.message, 
        stack: error.stack,
        context,
        timestamp: Date.now() 
      });
    }
  }
}
```

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Database connectivity check
    const { error } = await supabase.from('leads').select('count');
    
    return NextResponse.json({
      status: error ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: !error,
        environment: !!(process.env.AGENT_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY)
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed'
    }, { status: 503 });
  }
}
```

## Backup & Disaster Recovery

### Database Backups
- **Supabase Automatic Backups:** Daily automated backups included
- **Point-in-Time Recovery:** Available for production instances
- **Manual Backup:** Use `pg_dump` for additional backup security

### Application Backup
```bash
# Export environment configuration
vercel env ls > production-env-backup.txt

# Git repository backup (ensure all code is committed)
git remote -v
git push --all origin
```

### Disaster Recovery Plan
1. **Database Recovery:** Restore from Supabase backup or point-in-time recovery
2. **Application Recovery:** Redeploy from Git repository via Vercel
3. **Environment Recovery:** Restore environment variables from backup
4. **DNS Recovery:** Update DNS if domain configuration changes

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (npm run test:all)
- [ ] Security audit completed (npm audit)
- [ ] Performance audit completed
- [ ] Environment variables configured
- [ ] Database migration scripts ready

### Deployment Process
- [ ] Deploy to Vercel production
- [ ] Run database migrations in Supabase
- [ ] Configure custom domain (if applicable)
- [ ] Verify SSL certificate provisioning
- [ ] Test API endpoints functionality

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] ChatGPT integration tested
- [ ] Admin authentication working
- [ ] CSV export functionality verified
- [ ] Performance metrics within targets

### Monitoring Setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring enabled
- [ ] Alert notifications configured
- [ ] Log aggregation setup

## Scaling Considerations

### Horizontal Scaling
- **Vercel Serverless:** Automatic scaling based on traffic
- **Database Scaling:** Supabase connection pooling and read replicas
- **CDN Distribution:** Global edge network for static assets

### Performance Targets
- **API Response Time:** <500ms (95th percentile)
- **Dashboard Load Time:** <2 seconds with 10k+ records
- **Database Queries:** <200ms for complex filters
- **Uptime:** 99.9% availability target

### Cost Optimization
- **Vercel Hobby Tier:** Optimized for small to medium applications
- **Supabase Free Tier:** Suitable for development and small production loads
- **Monitoring:** Track usage to optimize resource allocation