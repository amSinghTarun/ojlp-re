"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImageIcon, Upload, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { uploadMediaFile, getMediaFiles } from "@/lib/actions/media-actions"

interface MediaItem {
  id: string
  name: string
  url: string
  type: string
  alt?: string
  description?: string
}

interface MediaSelectorProps {
  onSelect: (url: string) => void
  selectedImage?: string
}

export function MediaSelector({ onSelect, selectedImage }: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    alt: "",
    description: ""
  })

  // Load media items when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMediaItems()
    }
  }, [isOpen])

  const loadMediaItems = async () => {
    setIsLoading(true)
    try {
      const result = await getMediaFiles()
      if (result.success) {
        setMediaItems(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load media files",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load media:", error)
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMedia = mediaItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.alt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = () => {
    if (selectedId) {
      const selected = mediaItems.find((item) => item.id === selectedId)
      if (selected) {
        onSelect(selected.url)
        setIsOpen(false)
        setSelectedId(null)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      setUploadForm({
        alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for alt text
        description: ""
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('alt', uploadForm.alt)
      formData.append('description', uploadForm.description)

      const result = await uploadMediaFile(formData)

      if (result.success) {
        toast({
          title: "Upload successful",
          description: `${selectedFile.name} has been uploaded successfully.`,
        })

        // Add to media items and select it
        setMediaItems(prev => [result.data, ...prev])
        onSelect(result.data.url)
        setIsOpen(false)

        // Reset form
        setSelectedFile(null)
        setUploadForm({ alt: "", description: "" })
      } else {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-gray-300">
        {selectedImage ? (
          <Image src={selectedImage} alt="Selected image" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No images found
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border ${
                          selectedId === item.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <Image 
                          src={item.url} 
                          alt={item.alt || item.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
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
                  <Label htmlFor="upload-file">Image File</Label>
                  <Input 
                    id="upload-file" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: JPEG, PNG, WebP. Max size: 5MB
                  </p>
                </div>
                
                {selectedFile && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="alt-text">Alt Text</Label>
                      <Input
                        id="alt-text"
                        value={uploadForm.alt}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, alt: e.target.value }))}
                        placeholder="Describe the image for accessibility"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Additional details about the image"
                        rows={3}
                      />
                    </div>
                  </>
                )}
                
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading} 
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload and Select
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}