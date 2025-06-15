"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { authors } from "@/lib/authors"
import type { Author } from "@/lib/types"

interface AuthorSelectorProps {
  onSelect: (author: Author) => void
  selectedAuthor?: Author | null
}

export function AuthorSelector({ onSelect, selectedAuthor }: AuthorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [newAuthorName, setNewAuthorName] = useState("")
  const [newAuthorEmail, setNewAuthorEmail] = useState("")
  const [filteredAuthors, setFilteredAuthors] = useState(authors)

  useEffect(() => {
    if (searchValue) {
      setFilteredAuthors(
        authors.filter(
          (author) =>
            author.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            author.email.toLowerCase().includes(searchValue.toLowerCase()),
        ),
      )
    } else {
      setFilteredAuthors(authors)
    }
  }, [searchValue])

  const handleCreateAuthor = () => {
    if (newAuthorName && newAuthorEmail) {
      // In a real app, you would call an API to create the author
      // and link it to a user (or create a new user)
      const newAuthor: Author = {
        slug: newAuthorName
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim(),
        name: newAuthorName,
        email: newAuthorEmail,
        // Generate a placeholder userId that would be created in the backend
        userId: `user_${Date.now()}`,
        // Flag this as a new author
        isNew: true,
      }

      onSelect(newAuthor)
      setDialogOpen(false)
      setNewAuthorName("")
      setNewAuthorEmail("")
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedAuthor ? selectedAuthor.name : "Select author..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search authors..." value={searchValue} onValueChange={setSearchValue} />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No author found.</p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create new author
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create new author</DialogTitle>
                        <DialogDescription>
                          Add a new author with basic information. You can edit more details later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={newAuthorName}
                            onChange={(e) => setNewAuthorName(e.target.value)}
                            placeholder="Author name"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newAuthorEmail}
                            onChange={(e) => setNewAuthorEmail(e.target.value)}
                            placeholder="author@example.com"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateAuthor} disabled={!newAuthorName || !newAuthorEmail}>
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredAuthors.map((author) => (
                  <CommandItem
                    key={author.slug}
                    value={author.slug}
                    onSelect={() => {
                      onSelect(author)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{author.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">({author.email})</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedAuthor?.slug === author.slug ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setDialogOpen(true)
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new author
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
