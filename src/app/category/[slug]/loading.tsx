export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-12 bg-white border-b border-gray-200 sticky top-0" />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
              <div className="aspect-video bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
