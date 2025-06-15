export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>

        <div className="border rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="aspect-[3/4] bg-gray-200 rounded"></div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
