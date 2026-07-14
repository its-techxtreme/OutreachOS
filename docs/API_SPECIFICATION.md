# API Specification
**ChatGPT Integration & Endpoint Documentation**

## API Authentication Pattern

### Endpoint: `/api/agent/leads`
The `/api/agent/leads` route enforces a strict custom header verification handshake.

### Authentication Requirements
- **Header Key:** `X-Agent-Secret` 
- **Validation:** Must be verified server-side inside the Next.js runtime against an explicit environment variable stored securely in Vercel (`AGENT_SECRET`)
- **Security:** The database service role keys (`SUPABASE_SERVICE_ROLE_KEY`) must never be bundled into the client-side build or shared within any Custom GPT prompt file

## Request Specification

### HTTP Method
`POST /api/agent/leads`

### Required Headers
```http
Content-Type: application/json
X-Agent-Secret: [AGENT_SECRET_VALUE]
```

### Request Payload Schema
```json
{
  "lead": {
    "name": "string (required)",
    "niche": "string (required)", 
    "country": "string (required)",
    "phone": "string (optional)",
    "address": "string (optional)",
    "maps_url": "string (required, unique key)"
  },
  "metadata": {
    "source": "chatgpt",
    "version": "1.0"
  }
}
```

## Response Specification

### Success Response (New Lead)
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "id": 123,
    "created_at": "2026-06-13T07:33:37.530Z"
  },
  "requestId": "uuid-string",
  "responseTime": 245
}
```

### Success Response (Duplicate Lead)
```json
{
  "success": true,
  "message": "Lead already exists",
  "skipped": true,
  "requestId": "uuid-string",
  "responseTime": 134
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "requestId": "uuid-string"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["lead", "name"],
      "message": "String must contain at least 1 character(s)"
    }
  ],
  "requestId": "uuid-string"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "requestId": "uuid-string"
}
```

## ChatGPT Custom GPT Configuration

### GPT Instructions Template
```markdown
You are a lead collection agent for a B2B lead management system. Your job is to collect business information and submit it to the lead database via API calls.

### Data Collection Guidelines:
1. Extract business name, industry/niche, country, phone, and address
2. Always include Google Maps URL as the unique identifier
3. Ensure data quality and completeness before submission
4. Handle API responses appropriately

### API Integration:
- Endpoint: https://your-domain.vercel.app/api/agent/leads
- Method: POST
- Authentication: X-Agent-Secret header required
- Content-Type: application/json

### Error Handling:
- Status 200 with skipped=true: Lead already exists (continue)
- Status 401: Authentication failed (check headers)
- Status 400: Invalid data (fix and retry)
- Status 500: Server error (retry with backoff)
```

### OpenAPI Specification
```yaml
openapi: 3.0.0
info:
  title: Lead Management API
  version: 1.0.0
servers:
  - url: https://your-domain.vercel.app
paths:
  /api/agent/leads:
    post:
      operationId: submitLead
      summary: Submit a new lead to the database
      security:
        - AgentSecret: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LeadSubmission'
      responses:
        '200':
          description: Success or duplicate detected
        '400':
          description: Invalid request data
        '401':
          description: Unauthorized
        '500':
          description: Server error

components:
  schemas:
    LeadSubmission:
      type: object
      required:
        - lead
      properties:
        lead:
          type: object
          required:
            - name
            - niche
            - country
            - maps_url
          properties:
            name:
              type: string
              description: Business or company name
            niche:
              type: string
              description: Industry or business category
            country:
              type: string
              description: Country where business is located
            phone:
              type: string
              description: Contact phone number
            address:
              type: string
              description: Full business address
            maps_url:
              type: string
              format: uri
              description: Google Maps URL (unique identifier)
        metadata:
          type: object
          properties:
            source:
              type: string
              default: chatgpt
            version:
              type: string
              default: "1.0"
  
  securitySchemes:
    AgentSecret:
      type: apiKey
      in: header
      name: X-Agent-Secret
```

## Error Handling for Autonomous Operation

### Duplicate Lead Handling
- **Database Constraint:** Unique constraint on `maps_url` field
- **Error Code:** PostgreSQL 23505 (unique_violation)
- **API Response:** Transform to 200 OK with `skipped: true` flag
- **ChatGPT Action:** Continue processing (no retry needed)

### Rate Limiting
- **Implementation:** Server-side rate limiting per IP/header
- **Limits:** 100 requests per minute per source
- **Response:** 429 Too Many Requests
- **ChatGPT Action:** Wait 60 seconds before retry

### Authentication Failures
- **Validation:** X-Agent-Secret header against environment variable
- **Response:** 401 Unauthorized immediately
- **ChatGPT Action:** Check header configuration, do not retry

### Server Errors
- **Scenarios:** Database connectivity, internal processing errors
- **Response:** 500 Internal Server Error
- **ChatGPT Action:** Retry with exponential backoff (2s, 4s, 8s, 16s)

## Performance Specifications

### Response Time Targets
- **95th Percentile:** <500ms for successful requests
- **Duplicate Detection:** <300ms for constraint violation handling
- **Authentication:** <50ms for header validation

### Throughput Capacity
- **Concurrent Requests:** 50+ simultaneous connections
- **Daily Volume:** 10,000+ lead submissions
- **Peak Load:** 100 requests per minute sustained