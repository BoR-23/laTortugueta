'use client';

import React, { useState } from 'react';
import { PublicColorCard } from './PublicColorCard';
import { ColorDef } from '@/lib/colors/types';

interface ColorCatalogGridProps {
    colors: ColorDef[];
    loadMoreText: string;
}

export function ColorCatalogGrid({ colors }: { colors: ColorDef[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
            {colors.map((color, index) => (
                <PublicColorCard
                    key={color.id}
                    color={color}
                    priority={index < 16}
                />
            ))}
        </div>
    );
}
