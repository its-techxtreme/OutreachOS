import type { MetadataRoute } from 'next';

import { getPublicSiteUrl } from '@/lib/seo/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getPublicSiteUrl();
  const now = new Date();

  const paths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/import-guide', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/auth/signup', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/auth/login', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/acceptable-use', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/accessibility', changeFrequency: 'yearly', priority: 0.4 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
