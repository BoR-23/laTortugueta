export function SeoContentSection() {
    return (
        <section className="border-t border-neutral-200 bg-white" aria-labelledby="seo-title">
            <div className="mx-auto flex max-w-6xl 3xl:max-w-8xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">

                <header className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Historia y Tradición</p>
                    <h2 id="seo-title" className="text-3xl font-semibold text-neutral-900">
                        Calcetines para Fallera e Indumentaria Valenciana
                    </h2>
                </header>

                <article className="prose prose-neutral max-w-none text-sm text-neutral-600 sm:text-base leading-relaxed">
                    <div className="grid gap-10 md:grid-cols-2">
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-neutral-900">
                                Artesanía en calcetines tradicionales y cultura valenciana
                            </h3>
                            <p>
                                En <strong>La Tortugueta</strong>, somos artesanos dedicados a la confección de <strong>calcetines tradicionales</strong> para <strong>indumentaria tradicional</strong>. Desde nuestro taller, llevamos más de 30 años recuperando diseños del <strong>siglo XVIII</strong> y adaptándolos a la fiesta actual.
                            </p>
                            <p>
                                Nuestros <strong>calcetines artesanales</strong> están pensados para resistir y lucir en actos de <strong>Fallas</strong>, <strong>Grupos de Danses</strong> y recreación histórica. Utilizamos materiales nobles y técnicas respetuosas para ofrecer un producto auténtico y de máxima calidad.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-neutral-900">
                                Piezas únicas para tu indumentaria
                            </h3>
                            <p>
                                Más allá de ser un simple complemento, los calcetines son una parte fundamental de la riqueza de nuestra vestimenta. Ofrecemos <strong>personalización completa</strong> en colores y motivos para que cada par sea único.
                            </p>
                            <p>
                                Trabajamos mano a mano con quienes aman la fiesta para asegurar que el tono del hilo y el diseño encajen perfectamente. Si buscas <strong>calcetines bordados</strong> hechos con rigor y cariño, aquí encontrarás el detalle que marca la diferencia.
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    )
}
