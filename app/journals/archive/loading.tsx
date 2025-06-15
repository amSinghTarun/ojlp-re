export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
