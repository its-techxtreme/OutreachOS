import type { MetadataRoute } from 'next';

import { getPublicSiteUrl } from '@/lib/seo/site-url';

export default function robots(): MetadataRoute.Robots {
  const site = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/import-guide', '/privacy', '/terms', '/cookies', '/acceptable-use', '/auth/login', '/auth/signup'],
        disallow: [
          '/dashboard',
          '/settings',
          '/api/',
          '/admin/',
          '/auth/callback',
          '/auth/username',
          '/auth/reset-password',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
