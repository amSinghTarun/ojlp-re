import { Skeleton } from "@/components/ui/skeleton"
import { DecorativeHeading } from "@/components/decorative-heading"

export default function CallForPapersLoading() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <div className="mb-8">
        <DecorativeHeading level={1}>Call For Papers</DecorativeHeading>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto">
          Submit your research for upcoming journal issues
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                <div className="mb-6">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>

                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
