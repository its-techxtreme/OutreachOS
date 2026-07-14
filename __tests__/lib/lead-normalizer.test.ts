import {
  cleanPhone,
  cleanText,
  mapsSearchUrl,
  neutralizeFormula,
  normalizeImportRow,
} from '@/lib/import/lead-normalizer';

describe('lead-normalizer', () => {
  it('neutralizes formula injection prefixes', () => {
    expect(neutralizeFormula('=HYPERLINK("http://evil")')).toBe(
      "'=HYPERLINK(\"http://evil\")"
    );
    expect(neutralizeFormula('Safe Name')).toBe('Safe Name');
  });

  it('formats Indian 10-digit phones', () => {
    expect(cleanPhone('9876543210')).toBe('+91 9876543210');
    expect(cleanPhone('N/A')).toBeNull();
    expect(cleanPhone('+1 555-0100')).toBe('+1 555-0100');
  });

  it('builds maps search URLs', () => {
    const url = mapsSearchUrl('Acme Co', '1 Main St', 'Australia');
    expect(url).toContain('https://www.google.com/maps/search/');
    expect(url).toContain(encodeURIComponent('Acme Co 1 Main St Australia'));
  });

  it('normalizes Business Name style rows', () => {
    const result = normalizeImportRow(
      {
        'Business Name': 'Bright Interiors',
        Niche: 'Interior Design',
        Country: 'Australia',
        'Phone Number': '0412345678',
        Address: 'Sydney',
        'Google Maps Link':
          'https://www.google.com/maps/place/Bright+Interiors',
      },
      2
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lead.name).toBe('Bright Interiors');
      expect(result.lead.niche).toBe('Interior Design');
      expect(result.lead.country).toBe('Australia');
      expect(result.lead.maps_url).toContain('google.com/maps');
    }
  });

  it('skips rows missing a name', () => {
    const result = normalizeImportRow({ Niche: 'SaaS' }, 3);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_name');
    }
  });

  it('skips reject Final Status rows', () => {
    const result = normalizeImportRow(
      {
        Name: 'Bad Lead',
        'Final Status': 'REJECT',
        Niche: 'General',
        Country: 'India',
      },
      4
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('final_status_excluded');
    }
  });

  it('synthesizes maps URL when only social Source URL is present', () => {
    const result = normalizeImportRow(
      {
        Name: 'Studio One',
        Niche: 'Design',
        Country: 'India',
        Address: 'Mumbai',
        'Source URL': 'https://instagram.com/studioone',
      },
      5
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lead.maps_url).toContain('google.com/maps/search');
      expect(result.lead.maps_url).not.toContain('instagram');
    }
  });

  it('treats empty tokens as null', () => {
    expect(cleanText('NULL')).toBeNull();
    expect(cleanText('  ')).toBeNull();
    expect(cleanText('Acme')).toBe('Acme');
  });
});
