import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://bip.drrkobe.com/sitemap.xml',
    host: 'https://bip.drrkobe.com',
  };
}
