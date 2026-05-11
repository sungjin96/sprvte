export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-[var(--g2)] animate-pulse" />
          <div className="h-3 w-8 rounded bg-[var(--g1)] animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded bg-[var(--g2)] animate-pulse" />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-xl bg-[var(--g1)] border border-[var(--border)] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
