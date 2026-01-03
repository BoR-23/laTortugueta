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
                                Confección a medida y reproducciones históricas desde 1989
                            </h3>
                            <p>
                                En <strong>La Tortugueta</strong>, llevamos más de 30 años dedicados a la investigación y confección
                                de <em>calcetines tradicionales valencianos</em>. Desde nuestro taller artesanal en <strong>Alcoi</strong>,
                                recuperamos diseños antiguos de los siglos XVIII y XIX para adaptarlos a las necesidades de la
                                indumentaria actual, ofreciendo un <strong>catálogo de calidad</strong> que mantiene siempre la esencia y el rigor histórico que exige nuestra fiesta.
                            </p>
                            <p>
                                Nuestra especialidad son los <strong>calcetines bordados para fallera</strong> y fallero, así como
                                medias para grupos de Danses y folklore. Cada pieza se teje pensando en la durabilidad y la estética,
                                utilizando hilos de alta calidad (algodón, seda, hilo de Escocia) que garantizan un ajuste perfecto
                                sin renunciar a la comodidad durante las largas jornadas de ofrenda y pasacalle.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-neutral-900">
                                El valor de lo artesanal en la indumentaria regional
                            </h3>
                            <p>
                                Más allá de ser un simple complemento, los calcetines son una parte fundamental de la
                                <strong>indumentaria valenciana</strong>. Ya sea para un traje de torrentí, saragüell o el rico
                                traje de valenciana, ofrecemos personalización completa en colores y motivos. Trabajamos mano a mano
                                con indumentaristas de toda la Comunidad Valenciana para asegurar que el tono del hilo combine
                                exactamente con la seda del espolín o el damasco del jubón.
                            </p>
                            <p>
                                Realizamos <strong>reproducciones históricas</strong> a partir de fragmentos antiguos o fotografías
                                de museo. Si buscas una pieza única para completar tu atuendo regional con rigor y elegancia,
                                nuestro catálogo vivo es el punto de partida para encontrar ese detalle que marca la diferencia.
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    )
}
