export default function ProductSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-[12px] overflow-hidden animate-pulse">
          <div className="aspect-square bg-neutral-light" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-neutral-light rounded w-3/4" />
            <div className="h-3 bg-neutral-light rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
