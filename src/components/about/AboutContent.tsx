import Link from 'next/link'
import { dictionaries, Locale } from '@/i18n/dictionaries'
import { CONTACT_NAME, INSTAGRAM_URL, WHATSAPP_LINK } from '@/lib/contact'

interface AboutContentProps {
    totalDesigns: number
    yearsWeaving: number
    locale: Locale
}

export function AboutContent({ totalDesigns, yearsWeaving, locale }: AboutContentProps) {
    const t = dictionaries[locale].about
    const whatsappDisplay = '+34 653 45 22 49'

    const sections = [
        {
            title: t.sections.whoWeAre.title,
            paragraphs: [t.sections.whoWeAre.p1, t.sections.whoWeAre.p2]
        },
        {
            title: t.sections.macuHistory.title,
            paragraphs: [t.sections.macuHistory.p1, t.sections.macuHistory.p2, t.sections.macuHistory.p3]
        },
        {
            title: t.sections.workshopToday.title,
            paragraphs: [t.sections.workshopToday.p1, t.sections.workshopToday.p2(totalDesigns, yearsWeaving)]
        },
        {
            title: t.sections.products.title,
            paragraphs: [t.sections.products.p1, t.sections.products.p2, t.sections.products.p3, t.sections.products.p4]
        },
        {
            title: t.sections.recognitions.title,
            paragraphs: [t.sections.recognitions.p1, t.sections.recognitions.p2]
        },
        {
            title: t.sections.howWeWork.title,
            paragraphs: [t.sections.howWeWork.p1]
        },
        {
            title: t.sections.textileMemory.title,
            paragraphs: [t.sections.textileMemory.p1, t.sections.textileMemory.p2]
        }
    ]

    return (
        <div className="bg-white text-neutral-900">
            <section className="border-b border-neutral-200 bg-white">
                <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{t.sectionTitle}</p>
                    <h1 className="mt-3 text-4xl font-semibold text-neutral-900 sm:text-5xl">
                        {t.heroTitle}
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                        {t.heroDescription}
                    </p>
                </div>
            </section>

            <article className="mx-auto max-w-5xl space-y-10 px-4 py-16 text-[15px] leading-relaxed text-neutral-700 sm:px-6 lg:px-8">
                {sections.map(section => (
                    <section key={section.title} className="space-y-3">
                        <h2 className="text-2xl font-semibold text-neutral-900">{section.title}</h2>
                        {section.paragraphs.map((paragraph, index) => (
                            <p key={`${section.title}-${index}`}>{paragraph}</p>
                        ))}
                    </section>
                ))}

                <section className="space-y-3">
                    <h2 className="text-2xl font-semibold text-neutral-900">{t.contactTitle}</h2>
                    <p>
                        {t.contactText}{' '}
                        <a href={WHATSAPP_LINK} className="underline underline-offset-4">
                            {whatsappDisplay}
                        </a>{' '}
                        (WhatsApp), {t.or} {' '}
                        <a href={INSTAGRAM_URL} className="underline underline-offset-4">
                            Instagram
                        </a>{' '}
                        {t.or} {t.appointment} {CONTACT_NAME}. {t.noIntermediaries}
                    </p>
                </section>

                <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.35em] text-neutral-500">
                    <Link href={locale === 'es' ? "/catalogo" : `/${locale}`} className="rounded-full border border-neutral-900 px-6 py-3">
                        {t.viewCatalog}
                    </Link>
                    <a href={WHATSAPP_LINK} className="rounded-full border border-neutral-900 px-6 py-3">
                        {t.openWhatsapp}
                    </a>
                </div>
            </article>
        </div>
    )
}
