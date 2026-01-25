export default function AdminLoading() {
  return (
    <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-neutral-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="h-6 w-8 rounded bg-neutral-200 animate-pulse" />
              <div className="h-8 w-16 rounded bg-neutral-200 animate-pulse" />
              <div className="h-4 w-24 rounded bg-neutral-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-4 w-full max-w-xl rounded bg-neutral-200 animate-pulse" />
        <div className="h-4 w-full max-w-2xl rounded bg-neutral-200 animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-neutral-200 animate-pulse" />
    </div>
  );
}
