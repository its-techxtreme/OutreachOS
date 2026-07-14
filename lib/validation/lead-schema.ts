import { z } from 'zod';

import { sanitizeOptionalText, sanitizeText } from '../sanitize';

export const LeadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255)
    .transform((value) => sanitizeText(value)),
  niche: z
    .string()
    .min(1, 'Niche is required')
    .max(100)
    .transform((value) => sanitizeText(value)),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100)
    .transform((value) => sanitizeText(value)),
  phone: z
    .string()
    .max(50)
    .optional()
    .transform((value) => sanitizeOptionalText(value)),
  address: z
    .string()
    .max(500)
    .optional()
    .transform((value) => sanitizeOptionalText(value)),
  maps_url: z.string().url('maps_url must be a valid URL').max(2000),
});

export const LeadSubmissionSchema = z.object({
  lead: LeadSchema,
  metadata: z
    .object({
      source: z.string().default('chatgpt'),
      version: z.string().default('1.0'),
    })
    .optional(),
});

export type ValidatedLead = z.infer<typeof LeadSchema>;
export type ValidatedLeadSubmission = z.infer<typeof LeadSubmissionSchema>;
