"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Upload } from "lucide-react"

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

interface MediaSelectorProps {
  onSelect: (url: string) => void
  selectedImage: string
}

export function MediaSelector({ onSelect, selectedImage }: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredMedia = mediaItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelect = () => {
    if (selectedId) {
      const selected = mediaItems.find((item) => item.id === selectedId)
      if (selected) {
        onSelect(selected.url)
        setIsOpen(false)
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
          {selectedImage ? (
            <Image src={selectedImage || "/placeholder.svg"} alt="Selected image" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            {selectedImage ? "Change Image" : "Select Image"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="browse">
            <TabsList>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="browse" className="space-y-4">
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  Select
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="upload-file">File</label>
                  <Input id="upload-file" type="file" accept="image/*" />
                </div>
                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
