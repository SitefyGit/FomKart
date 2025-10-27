export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <div className="h-6 bg-gray-200 w-2/3 rounded" />
              <div className="h-4 bg-gray-100 w-5/6 rounded" />
              <div className="h-4 bg-gray-100 w-1/2 rounded" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-5 bg-gray-200 w-28 rounded mb-3" />
              <div className="h-8 bg-gray-200 w-full rounded" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-5 bg-gray-200 w-32 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 w-full rounded" />
                <div className="h-3 bg-gray-100 w-5/6 rounded" />
                <div className="h-3 bg-gray-100 w-4/6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
