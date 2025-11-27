import React from 'react';
import { YARN_COLORS } from '@/lib/colors/constants';
import { ColorCatalogGrid } from '@/components/catalog/ColorCatalogGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Color Catalog | La Tortugueta',
    description: 'Explore our full color chart. Find the perfect shade for your custom socks.',
};

export default function ColorCatalogPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="text-center max-w-4xl mx-auto space-y-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl font-serif">
                            Color Chart
                        </h1>

                        <div className="text-left md:text-justify text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto space-y-6">
                            <p>
                                At La Tortugueta, we don&apos;t settle for just any yarn. For our socks, we use Giza Egyptian cotton, the authentic &quot;king of cottons,&quot; grown right there in the Nile Delta. It&apos;s a wonder of nature: it has extra-long fibers, and you can feel it the moment you touch it. The sock comes out incredibly soft, with a natural sheen that looks like silk and, most importantly, incredibly durable.
                            </p>
                            <p>
                                And do you know what&apos;s best? How it absorbs dye. The colors remain vivid, intense, and withstand wash after wash without losing that joy and without pilling. We bring it from far away, yes, but we dye and knit it here, in our land, in trusted workshops of a lifetime. Because to do things right, you have to mix the best from abroad with the mastery of home.
                            </p>
                        </div>

                        <p className="pt-4 text-xs text-gray-400 uppercase tracking-wider">
                            * Click on any color to copy its code
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
