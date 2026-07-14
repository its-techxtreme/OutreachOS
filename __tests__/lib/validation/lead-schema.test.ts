import { LeadSchema, LeadSubmissionSchema } from '@/lib/validation/lead-schema';

describe('lead validation schemas', () => {
  const validLead = {
    name: 'Acme Interiors',
    niche: 'Interior Design',
    country: 'United States',
    phone: '+1-555-0100',
    address: '123 Design Ave',
    maps_url: 'https://maps.google.com/?q=acme-interiors',
  };

  it('validates a complete lead payload', () => {
    expect(LeadSchema.safeParse(validLead).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(LeadSchema.safeParse({ ...validLead, name: '' }).success).toBe(false);
  });

  it('rejects invalid maps_url values', () => {
    expect(LeadSchema.safeParse({ ...validLead, maps_url: 'not-a-url' }).success).toBe(
      false
    );
  });

  it('sanitizes lead text fields during validation', () => {
    const result = LeadSchema.parse({
      ...validLead,
      name: '  <b>Acme</b> Interiors  ',
    });
    expect(result.name).toBe('Acme Interiors');
  });

  it('validates lead submission wrapper payloads', () => {
    expect(
      LeadSubmissionSchema.safeParse({
        lead: validLead,
        metadata: { source: 'chatgpt', version: '1.0' },
      }).success
    ).toBe(true);
  });
});
