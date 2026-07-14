# Technical Architecture
**System Design & Data Flow Diagrams**

## Component Topology Map

```text
+------------------------------------------------------------+
|                  ChatGPT Plus Agent Mode                   |
|  - Google Maps Scraper Loop                                |
|  - Formats payload to JSON                                 |
|  - Appends secret handshake token header                   |
+-----------------------------+------------------------------+
                              |
                              | HTTP POST (JSON Payload)
                              v
+------------------------------------------------------------+
|             Next.js Secure Edge / Serverless API           |
|  - Validates 'X-Agent-Secret' against system environment    |
|  - Acts as a proxy firewall to hide master database keys    |
+-----------------------------+------------------------------+
                              |
                              | Internal Secure Handshake
                              v
+------------------------------------------------------------+
|             Supabase Relational Database (Postgres)        |
|  - Evaluates unique constraints on `maps_url`              |
|  - Executes lightning-fast B-Tree / GIN fuzzy index lookup   |
+-----------------------------+------------------------------+
                              |
                              | Authenticated Client Sessions
                              v
+------------------------------------------------------------+
|            Next.js Admin Management Dashboard              |
|  - Tailwind CSS + shadcn/ui stateful interface             |
|  - Real-time client-side sorting, filtering, and searching |
|  - Client-side CSV generation via PapaParse processing     |
+------------------------------------------------------------+
```

## Programmatic Step-by-Step Data Flow

### 1. Extraction
The ChatGPT Custom GPT identifies a candidate business on Google Maps.

### 2. Ingestion Request
The Agent generates a POST request to `/api/agent/leads` carrying the prospect dataset and the X-Agent-Secret verification token header.

### 3. Firewall Validation
The Next.js API route evaluates the header. If invalid, it returns a 401 Unauthorized response immediately. If valid, it forwards the dataset to Supabase.

### 4. Database Evaluation

#### Scenario A (New Lead)
The maps_url is unique. The record inserts successfully, returning a 201 Created status code.

#### Scenario B (Duplicate Lead)
The maps_url already exists. The database triggers a unique constraint violation error (Postgres error code 23505). The Next.js firewall layer catches this error and transforms it into a 200 OK status with a skipped payload flag, preventing the ChatGPT Agent loop from breaking.

### 5. Dashboard Sync
The Admin views the real-time Next.js web application. The frontend queries Supabase using a secure connection string protected by strict Row Level Security (RLS).

## Production Core Technologies

### Runtime & Meta-Framework
Next.js 14+ (App Router architecture utilizing Server Actions where appropriate)

### Database Engine
Supabase PostgreSQL instance

### Hosting Platform
Vercel (Hobby/Free Tier optimization)

### State Management & Parsing
React hooks (useState, useMemo) combined with papaparse for high-speed local data transformation

## Database Relational Schema Blueprint

```sql
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    maps_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New', -- Tracking: New, Contacted, Replied, Converted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_maps_url UNIQUE (maps_url)
);
```

## Performance Index Requirements

### B-Tree Indexes
Required on niche, country, and status columns to ensure instant data rendering when filtering thousands of prospects.

### GIN Index
Required on the name column utilizing the pg_trgm extension to allow real-time fuzzy text matching as the admin types into the dashboard.

## Directory Structure & File Tree

```text
├── .env.local
├── middleware.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx
│   └── api/
│       └── agent/
│           └── leads/
│               └── route.ts
├── components/
│   ├── ui/                 # Scaffolding target for shadcn/ui
│   │   ├── button.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── dashboard-metrics.tsx
│   ├── filter-toolbar.tsx
│   └── lead-table.tsx
├── lib/
│   ├── supabase-client.ts  # Client-side initialized wrapper
│   ├── supabase-server.ts  # Server-side administration wrapper
│   └── utils.ts
└── types/
    └── database.types.ts   # Auto-generated or explicit Postgres types
```