import Link from 'next/link'

export const metadata = {
    title: 'Página no encontrada | La Tortugueta'
}

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4 text-center">
            <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Error 404</p>
                <h1 className="font-serif text-4xl font-bold text-neutral-900 sm:text-5xl">
                    Página no encontrada
                </h1>
                <p className="mx-auto max-w-md text-neutral-600">
                    Lo sentimos, no hemos podido encontrar lo que buscabas.
                    Puede que el enlace esté roto o que la página haya sido movida.
                </p>
                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-neutral-800"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}
