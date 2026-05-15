import { Link } from 'react-router-dom';
import { JsonLd, SeoHead } from '@/components/seo/SeoHead';
import { SeoConfig, SITE_URL } from '@/lib/seo';

interface Props {
  config: SeoConfig;
  h1: string;
  intro: string;
  faq: Array<{ q: string; a: string }>;
}

export default function SeoLandingPage({ config, h1, intro, faq }: Props) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ChravelApp',
      url: SITE_URL,
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'ChravelApp', url: SITE_URL },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ChravelApp',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: h1, item: `${SITE_URL}${config.path}` },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SeoHead {...config} />
      <JsonLd data={jsonLd} />
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <h1 className="text-4xl font-bold leading-tight">{h1}</h1>
        <p className="text-lg text-muted-foreground">{intro}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border p-5">
            <h2 className="text-xl font-semibold mb-2">For friends and families</h2>
            <p>
              Coordinate dates, budgets, and shared plans without juggling WhatsApp threads, Sheets,
              and separate checklists.
            </p>
          </article>
          <article className="rounded-xl border p-5">
            <h2 className="text-xl font-semibold mb-2">For teams and events</h2>
            <p>
              Align logistics, announcements, and responsibilities across organizers, travelers, and
              operators from one workflow.
            </p>
          </article>
        </div>
        <section>
          <h2 className="text-2xl font-semibold mb-4">FAQs</h2>
          <div className="space-y-4">
            {faq.map(item => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link className="underline" to="/group-trip-planner">
            Group Trip Planner
          </Link>
          <Link className="underline" to="/group-travel">
            Group Travel
          </Link>
          <Link className="underline" to="/trip-planner">
            Trip Planner
          </Link>
          <Link className="underline" to="/how-to-plan-a-trip-with-friends">
            How to plan a trip with friends
          </Link>
        </nav>
        <Link
          to="/auth"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium"
        >
          Start planning in ChravelApp
        </Link>
      </section>
    </main>
  );
}
