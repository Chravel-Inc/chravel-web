import { useEffect } from 'react';
import { SeoConfig, SITE_NAME, DEFAULT_OG_IMAGE, canonicalUrl } from '@/lib/seo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let meta = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertLink(rel: string, href: string) {
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

export function SeoHead({ title, description, path, noindex, ogImage }: SeoConfig) {
  useEffect(() => {
    const image = ogImage || DEFAULT_OG_IMAGE;
    const url = canonicalUrl(path);

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, path, noindex, ogImage]);

  return null;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
