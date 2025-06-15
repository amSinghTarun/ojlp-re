"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Sample media items for demonstration
const mediaItems = [
  {
    id: "1",
    name: "courthouse.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
  {
    id: "2",
    name: "legal-document.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
  {
    id: "3",
    name: "constitution.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
  {
    id: "4",
    name: "judge-gavel.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
  {
    id: "5",
    name: "law-books.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
  {
    id: "6",
    name: "supreme-court.jpg",
    url: "/placeholder.svg?height=600&width=800",
    type: "image",
  },
]

interface ImageSelectorProps {
  onSelect: (url: string) => void
  selectedImage?: string
}

export function ImageSelector({ onSelect, selectedImage }: ImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const filteredMedia = mediaItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelect = () => {
    if (selectedId) {
      const selected = mediaItems.find((item) => item.id === selectedId)
      if (selected) {
        onSelect(selected.url)
      }
    }
  }

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

      // In a real application, this would be the URL returned from your image upload API
      const mockUploadedUrl = "/placeholder.svg?height=600&width=800"
      onSelect(mockUploadedUrl)

      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been uploaded successfully.`,
      })
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Library</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>
        <TabsContent value="browse" className="space-y-4">
          <Input placeholder="Search images..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="h-[300px] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border ${
                    selectedId === item.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <Image src={item.url || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSelect} disabled={!selectedId}>
              Insert Selected Image
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="upload" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="upload-file">Select Image File</label>
              <Input id="upload-file" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {selectedFile && (
              <div className="text-sm">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            )}
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Upload and Insert"}
              {!isUploading && <Upload className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
