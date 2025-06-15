import { AdminSidebar } from "@/components/admin/sidebar"
import { BoardAdvisorForm } from "@/components/admin/board-advisor-form"
import { boardAdvisors } from "@/lib/board-advisors"

interface EditBoardAdvisorPageProps {
  params: {
    id: string
  }
}

export default function EditBoardAdvisorPage({ params }: EditBoardAdvisorPageProps) {
  const advisor = boardAdvisors.find((a) => a.id === params.id)

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Edit Board Advisor</h1>
          </div>
          <div className="border rounded-lg p-4">
            {advisor ? (
              <BoardAdvisorForm advisor={advisor} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Advisor not found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
