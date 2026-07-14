import type { Lead } from './database.types';

export interface LeadPayload {
  name: string;
  niche: string;
  country: string;
  phone?: string;
  address?: string;
  maps_url: string;
}

export interface LeadSubmissionRequest {
  lead: LeadPayload;
  metadata?: {
    source?: string;
    version?: string;
  };
}

export interface LeadCreatedResponse {
  success: true;
  message: string;
  data: {
    id: number;
    created_at: string;
  };
  requestId: string;
  responseTime: number;
}

export interface LeadSkippedResponse {
  success: true;
  message: string;
  skipped: true;
  requestId: string;
  responseTime: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  requestId: string;
  responseTime?: number;
}

export type LeadSubmissionResponse =
  | LeadCreatedResponse
  | LeadSkippedResponse
  | ApiErrorResponse;

export type { Lead };
