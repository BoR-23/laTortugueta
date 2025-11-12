interface CatalogPanelSkeletonProps {
  items?: number
}

export function CatalogPanelSkeleton({ items = 6 }: CatalogPanelSkeletonProps) {
  const placeholders = Array.from({ length: items })

  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 text-center">
          <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-neutral-200" />
          <div className="mx-auto h-10 w-3/4 animate-pulse rounded-full bg-neutral-200" />
          <div className="mx-auto h-16 w-full animate-pulse rounded-xl bg-neutral-200" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full flex-col gap-4 lg:max-w-xs">
            <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="space-y-3 rounded-2xl border border-neutral-200 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
              ))}
            </div>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {placeholders.map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-neutral-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
