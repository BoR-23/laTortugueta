import Link from 'next/link'
import { WHATSAPP_LINK } from '@/lib/contact'
import { dictionaries } from '@/i18n/dictionaries'

interface HowToOrderProps {
  dictionary: typeof dictionaries['es']['home']['howToOrder']
}

export function HowToOrderSection({ dictionary }: HowToOrderProps) {
  const STEPS = [
    dictionary.step1,
    dictionary.step2,
    dictionary.step3,
    dictionary.step4
  ]

  return (
    <section className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{dictionary.eyebrow}</p>
          <h2 className="text-3xl font-semibold text-neutral-900">{dictionary.title}</h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.description}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="rounded-3xl border border-neutral-200 bg-white px-6 py-5 shadow-sm"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-neutral-600">Paso {index + 1}</div>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-neutral-900 px-6 py-5 text-sm text-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium text-neutral-900">
            {dictionary.footer}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="rounded-full border border-neutral-900 px-5 py-3 text-xs uppercase tracking-[0.3em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
              title={dictionary.contactBtn}
            >
              {dictionary.contactBtn}
            </Link>
            <a
              href={WHATSAPP_LINK}
              className="rounded-full border border-neutral-200 px-5 py-3 text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {dictionary.whatsappBtn}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
