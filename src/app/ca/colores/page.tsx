import React from 'react';
import { YARN_COLORS } from '@/lib/colors/constants';
import { ColorCatalogGrid } from '@/components/catalog/ColorCatalogGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Carta de Colors | La Tortugueta',
    description: 'Explora la nostra carta de colors completa. Troba el to perfecte per als teus mitjons personalitzats.',
};

export default function ColorCatalogPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="text-center max-w-4xl mx-auto space-y-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl font-serif">
                            Carta de Colors
                        </h1>

                        <div className="text-left md:text-justify text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto space-y-6">
                            <p>
                                A La Tortugueta no ens conformem amb qualsevol fil. Per als nostres mitjons gastem cotó egipci Giza, l&apos;autèntic &quot;rei dels cotons&quot;, que es cultiva allà mateix, al Delta del Nil. És una meravella de la naturalesa: té la fibra extra llarga, i això es nota només tocar-lo. El mitjó surt amb una suavitat increïble, amb una brillantor natural que sembla seda i, el més important, resistent a rabiar.
                            </p>
                            <p>
                                I saps què és el millor? Com absorbeix el tint. Els colors queden vius, intensos, i aguanten rentat rere rentat sense perdre aquesta alegria i sense fer aquestes boletes molestes que tant enlletgeixen. El portem de molt lluny, sí, però el tintem i el teixim aquí, a la nostra terra, en tallers de confiança de tota la vida. Perquè per fer les coses bé, cal barrejar el millor de fora amb el mestratge de casa.
                            </p>
                        </div>

                        <p className="pt-4 text-xs text-gray-400 uppercase tracking-wider">
                            * Fes clic a qualsevol color per copiar el seu codi
                        </p>
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <ColorCatalogGrid colors={YARN_COLORS} />
            </div>
        </div>
    );
}
