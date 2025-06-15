"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, Download, MoreHorizontal, Pencil, Trash, Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Sample media items for demonstration
const mediaItems = [
  {
    id: "1",
    name: "courthouse.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "1.2 MB",
    dimensions: "1920x1080",
    uploadedAt: "2023-10-15",
  },
  {
    id: "2",
    name: "legal-document.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "0.8 MB",
    dimensions: "1200x800",
    uploadedAt: "2023-10-14",
  },
  {
    id: "3",
    name: "constitution.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "1.5 MB",
    dimensions: "2000x1500",
    uploadedAt: "2023-10-12",
  },
  {
    id: "4",
    name: "judge-gavel.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "0.9 MB",
    dimensions: "1600x900",
    uploadedAt: "2023-10-10",
  },
  {
    id: "5",
    name: "law-books.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "1.1 MB",
    dimensions: "1800x1200",
    uploadedAt: "2023-10-08",
  },
  {
    id: "6",
    name: "supreme-court.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
    size: "2.0 MB",
    dimensions: "2400x1600",
    uploadedAt: "2023-10-05",
  },
]

export function MediaLibrary() {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMedia = mediaItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return

    setIsUploading(true)

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false)
      setSelectedFile(null)
      setUploadDialogOpen(false)

      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been uploaded successfully.`,
      })
    }, 1500)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copied",
      description: "The image URL has been copied to your clipboard.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>Upload images to use in your blog posts.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {selectedFile && (
                <div className="text-sm">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="grid">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <div className="text-sm text-muted-foreground">{filteredMedia.length} items</div>
        </div>
        <TabsContent value="grid" className="mt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image src={item.url || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-2">
                  <div className="truncate text-sm">{item.name}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyUrl(item.url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Name</th>
                  <th className="p-2 text-left font-medium">Type</th>
                  <th className="p-2 text-left font-medium">Size</th>
                  <th className="p-2 text-left font-medium">Dimensions</th>
                  <th className="p-2 text-left font-medium">Uploaded</th>
                  <th className="p-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 overflow-hidden rounded">
                          <Image
                            src={item.url || "/placeholder.svg"}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.size}</td>
                    <td className="p-2">{item.dimensions}</td>
                    <td className="p-2">{item.uploadedAt}</td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyUrl(item.url)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
