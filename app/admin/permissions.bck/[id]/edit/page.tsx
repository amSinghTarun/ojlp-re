// // app/admin/permissions/[id]/edit/page.tsx
// import type { Metadata } from "next"
// import { redirect, notFound } from "next/navigation"
// import { Suspense } from "react"
// import Link from "next/link"
// import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
// import { getCurrentUser } from "@/lib/auth"
// import { PermissionForm } from "@/components/admin/permission-form"
// import { getPermission } from "@/lib/actions/permission-actions"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Skeleton } from "@/components/ui/skeleton"

// interface EditPermissionPageProps {
//   params: {
//     id: string
//   }
// }

// // Generate metadata with better error handling
// export async function generateMetadata({ params }: EditPermissionPageProps): Promise<Metadata> {
//   // Validate params
//   if (!params.id || typeof params.id !== 'string') {
//     return {
//       title: "Edit Permission",
//       description: "Edit permission settings",
//     }
//   }

//   try {
//     // Check user permissions first
//     const currentUser = await getCurrentUser()

//     const { permission, error } = await getPermission(params.id)
    
//     if (error || !permission) {
//       return {
//         title: "Permission Not Found",
//         description: "The requested permission could not be found",
//       }
//     }

//     // Create readable display name
//     const displayName = permission.name
//       .split('_')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ')

//     return {
//       title: `Edit Permission: ${displayName}`,
//       description: `Edit permission settings for ${permission.name}${permission.description ? ` - ${permission.description}` : ''}`,
//     }
//   } catch (error) {
//     console.error("Error generating metadata:", error)
//     return {
//       title: "Edit Permission",
//       description: "Edit permission settings",
//     }
//   }
// }

// // Loading component
// function EditPermissionSkeleton() {
//   return (
//     <div className="max-w-4xl mx-auto space-y-6">
//       {/* Header Skeleton */}
//       <div className="flex items-center gap-4">
//         <Skeleton className="h-9 w-32" />
//         <div className="space-y-2">
//           <Skeleton className="h-8 w-64" />
//           <Skeleton className="h-4 w-96" />
//         </div>
//       </div>

//       {/* Form Skeleton */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <Card>
//             <CardHeader>
//               <Skeleton className="h-6 w-48" />
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-2">
//                 <Skeleton className="h-4 w-32" />
//                 <Skeleton className="h-10 w-full" />
//                 <Skeleton className="h-4 w-64" />
//               </div>
//               <div className="space-y-2">
//                 <Skeleton className="h-4 w-32" />
//                 <Skeleton className="h-20 w-full" />
//                 <Skeleton className="h-4 w-48" />
//               </div>
//               <div className="flex gap-4">
//                 <Skeleton className="h-10 w-32" />
//                 <Skeleton className="h-10 w-24" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//         <div className="space-y-4">
//           <Card>
//             <CardHeader>
//               <Skeleton className="h-6 w-40" />
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <Skeleton className="h-4 w-full" />
//                 <Skeleton className="h-4 w-3/4" />
//                 <Skeleton className="h-4 w-1/2" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Error component
// function EditPermissionError({ 
//   error, 
//   retry 
// }: { 
//   error: string
//   retry?: () => void 
// }) {
//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       <div className="flex items-center gap-4">
//         <Button variant="outline" size="sm" asChild>
//           <Link href="/admin/permissions">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Permissions
//           </Link>
//         </Button>
//         <div>
//           <h1 className="text-2xl font-bold text-destructive">Error Loading Permission</h1>
//           <p className="text-muted-foreground">
//             There was a problem loading the permission data
//           </p>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <AlertTriangle className="h-5 w-5 text-destructive" />
//             Failed to Load Permission
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Alert variant="destructive">
//             <AlertTriangle className="h-4 w-4" />
//             <AlertDescription>
//               {error}
//             </AlertDescription>
//           </Alert>

//           <div className="flex items-center gap-4">
//             {retry && (
//               <Button onClick={retry} variant="outline">
//                 Try Again
//               </Button>
//             )}
//             <Button asChild>
//               <Link href="/admin/permissions">
//                 Back to Permissions
//               </Link>
//             </Button>
//           </div>

//           {process.env.NODE_ENV === "development" && (
//             <details className="mt-4">
//               <summary className="cursor-pointer text-sm font-medium">
//                 Debug Information (Development Only)
//               </summary>
//               <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
//                 {JSON.stringify({ error, timestamp: new Date().toISOString() }, null, 2)}
//               </pre>
//             </details>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// // Main permission form wrapper
// async function PermissionFormWrapper({ id }: { id: string }) {
//   try {
//     // Get permission data
//     const { permission, error } = await getPermission(id)

//     // Handle errors
//     if (error) {
//       if (error.includes("not found") || error.includes("Invalid")) {
//         notFound()
//       }
//       throw new Error(error)
//     }

//     if (!permission) {
//       notFound()
//     }

//     return (
//       <PermissionForm
//         permission={permission}
//         mode="edit"
//       />
//     )
//   } catch (error) {
//     console.error("Error in PermissionFormWrapper:", error)
//     throw error
//   }
// }

// // Main page component
// export default async function EditPermissionPage({ params }: EditPermissionPageProps) {
//   // Validate params early
//   if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
//     console.error("Invalid permission ID:", params.id)
//     notFound()
//   }

//   try {
//     // Check authentication and authorization
//     const currentUser = await getCurrentUser()

//     if (!currentUser) {
//       console.warn("No authenticated user found")
//       redirect("/auth/login")
//     }

//     if (!isSuperAdmin(currentUser)) {
//       console.warn(`User ${currentUser.id} attempted to access permission edit without SUPER_ADMIN role`)
//       redirect("/admin")
//     }

//     return (
//       <div className="space-y-6">
//         <Suspense fallback={<EditPermissionSkeleton />}>
//           <PermissionFormWrapper id={params.id} />
//         </Suspense>
//       </div>
//     )
//   } catch (error) {
//     console.error("Error in EditPermissionPage:", error)
    
//     // Determine error type and provide appropriate response
//     const errorMessage = error instanceof Error 
//       ? error.message 
//       : "An unexpected error occurred while loading the permission"

//     return (
//       <EditPermissionError 
//         error={errorMessage}
//         retry={() => window?.location?.reload()}
//       />
//     )
//   }
// }

// // Error boundary for the page
// export function ErrorBoundary({ 
//   error, 
//   reset 
// }: { 
//   error: Error & { digest?: string }
//   reset: () => void 
// }) {
//   console.error("EditPermissionPage Error Boundary:", error)

//   return (
//     <EditPermissionError 
//       error={error.message || "An unexpected error occurred"}
//       retry={reset}
//     />
//   )
// }