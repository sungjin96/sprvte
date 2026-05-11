export default function EntitiesLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-[var(--g2)] animate-pulse" />
          <div className="h-3 w-6 rounded bg-[var(--g2)] animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-[var(--g2)] animate-pulse" />
      </div>

      {/* Category sections skeleton */}
      <div className="p-6 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--g2)] animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: i === 1 ? 4 : i === 2 ? 2 : 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-[120px] rounded-xl bg-[var(--g1)] border border-[var(--border)] animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
