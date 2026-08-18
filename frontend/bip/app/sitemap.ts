import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bip.drrkobe.com';

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/diagnosis/form`, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/platform`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/knowledge`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.65 },
  ];
}
