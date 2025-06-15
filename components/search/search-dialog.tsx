"use client"

import type * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { SearchResults } from "@/components/search/search-results" // Fixed: Changed from default to named import

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&filter=${activeTab}`)
      setOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as unknown as React.FormEvent)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search dialog on Ctrl+K or Command+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (newOpen) {
          // Reset search when opening
          setSearchQuery("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Search"
          onClick={() => setOpen(true)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-xl">Search</DialogTitle>
          <div className="flex items-center mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or keywords..."
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="all" className="mt-2" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="journals">Journals</TabsTrigger>
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            {searchQuery.length > 1 && (
              <ScrollArea className="max-h-[300px] overflow-auto">
                <SearchResults query={searchQuery} filter="all" dialogMode={true} />
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="journals" className="mt-0">
            {searchQuery.length > 1 && (
              <ScrollArea className="max-h-[300px] overflow-auto">
                <SearchResults query={searchQuery} filter="journals" dialogMode={true} />
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="mt-0">
            {searchQuery.length > 1 && (
              <ScrollArea className="max-h-[300px] overflow-auto">
                <SearchResults query={searchQuery} filter="blogs" dialogMode={true} />
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="authors" className="mt-0">
            {searchQuery.length > 1 && (
              <ScrollArea className="max-h-[300px] overflow-auto">
                <SearchResults query={searchQuery} filter="authors" dialogMode={true} />
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-muted-foreground">
            {searchQuery.length > 1 ? "Press Enter to see all results" : "Start typing to search"}
          </div>
          <Button onClick={handleSearch} disabled={searchQuery.length <= 1} size="sm">
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
