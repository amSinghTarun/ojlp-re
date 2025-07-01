// // app/admin/permissions/[id]/not-found.tsx
// import Link from "next/link"
// import { ArrowLeft, Search, PlusCircle } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// export default function PermissionNotFound() {
//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-4">
//         <Button variant="outline" size="sm" asChild>
//           <Link href="/admin/permissions">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Permissions
//           </Link>
//         </Button>
//         <div>
//           <h1 className="text-2xl font-bold">Permission Not Found</h1>
//           <p className="text-muted-foreground">
//             The requested permission could not be located
//           </p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Search className="h-5 w-5" />
//             Permission Not Found
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <Alert>
//             <AlertDescription>
//               The permission you're looking for doesn't exist, may have been deleted, 
//               or you don't have permission to access it.
//             </AlertDescription>
//           </Alert>

//           <div className="space-y-4">
//             <h3 className="font-medium">What you can do:</h3>
//             <ul className="space-y-2 text-sm text-muted-foreground">
//               <li>• Check if the permission ID in the URL is correct</li>
//               <li>• Verify that the permission hasn't been deleted</li>
//               <li>• Make sure you have the necessary permissions to access this resource</li>
//               <li>• Browse all available permissions to find what you're looking for</li>
//             </ul>
//           </div>

//           <div className="flex flex-col sm:flex-row gap-3">
//             <Button asChild>
//               <Link href="/admin/permissions">
//                 <Search className="mr-2 h-4 w-4" />
//                 Browse All Permissions
//               </Link>
//             </Button>
//             <Button variant="outline" asChild>
//               <Link href="/admin/permissions/new">
//                 <PlusCircle className="mr-2 h-4 w-4" />
//                 Create New Permission
//               </Link>
//             </Button>
//           </div>

//           <div className="pt-4 border-t">
//             <p className="text-xs text-muted-foreground">
//               If you believe this is an error, please contact your system administrator.
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }