export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-72 bg-gray-200 animate-pulse" />
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border p-6 flex gap-8">
          <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-gray-200 w-1/2 rounded" />
            <div className="h-4 bg-gray-100 w-5/6 rounded" />
            <div className="h-4 bg-gray-100 w-2/3 rounded" />
            <div className="flex gap-4">
              <div className="h-8 w-28 bg-gray-200 rounded" />
              <div className="h-8 w-28 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="h-6 bg-gray-200 w-48 rounded mb-4" />
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
