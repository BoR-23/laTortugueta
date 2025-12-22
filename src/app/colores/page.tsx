import React from 'react';
import { YARN_COLORS } from '@/lib/colors/constants';
import { ColorBrowser } from '@/components/catalog/ColorBrowser';
import { Metadata } from 'next';
import { absoluteUrl, buildBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Catálogo de Colores | La Tortugueta',
    description: 'Explora nuestra carta de colores completa. Encuentra el tono perfecto para tus calcetines personalizados.',
    alternates: {
        canonical: absoluteUrl('/colores')
    }
};


export default function ColorCatalogPage() {
    const breadcrumbJsonLd = buildBreadcrumbJsonLd([
        { name: 'Inicio', url: '/' },
        { name: 'Carta de Colores', url: '/colores' }
    ])

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="text-center max-w-4xl mx-auto space-y-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl font-serif">
                            Carta de Colores
                        </h1>

                        <div className="text-left md:text-justify text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto space-y-6">
                            <p>
                                En La Tortugueta no nos conformamos con cualquier hilo. Para nuestros calcetines gastamos algodón egipcio Giza, el auténtico &quot;rey de los algodones&quot;, que se cultiva allí mismo, en el Delta del Nilo. Es una maravilla de la naturaleza: tiene la fibra extra larga, y eso se nota nada más tocarlo. El calcetín sale con una suavidad increíble, con un brillo natural que parece seda y, lo más importante, resistente a rabiar.
                            </p>
                            <p>
                                ¿Y sabes qué es lo mejor? Cómo absorbe el tinte. Los colores quedan vivos, intensos, y aguantan lavado tras lavado sin perder esa alegría y sin hacer esas bolitas molestas que tanto afean. Lo traemos de muy lejos, sí, pero lo tintamos y lo tejemos aquí, en nuestra tierra, en talleres de confianza de toda la vida. Porque para hacer las cosas bien, hay que mezclar lo mejor de fuera con la maestría de casa.
                            </p>
                        </div>

                        <p className="pt-4 text-xs text-gray-400 uppercase tracking-wider">
                            * Haz clic en cualquier color para copiar su código
                        </p>
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <ColorBrowser colors={YARN_COLORS} />
            </div>
        </div>
    );
}
