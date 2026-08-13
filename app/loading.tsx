export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-56 rounded-3xl" />
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="skeleton w-10 h-10 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
